'use client';

import { useTranslations } from 'next-intl';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { buildPath } from '@/config/countries';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Toast, type ToastType } from '@/components/ui/Toast';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { User, MapPin, ChevronRight, Camera, Lock } from 'lucide-react';
import { useAddressStore } from '@/stores/addressStore';
import { useAuthStore } from '@/stores/authStore';
import { fetchUserProfile, updateUserProfile } from '@/lib/api';
import { Link } from '@/i18n/navigation';
const GENDER_OPTIONS = [
  { value: '', label: 'Select' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

export function SettingsContent() {
  const t = useTranslations('Account');
  const userId = useAuthStore((s) => s.userId);
  const firstName = useAuthStore((s) => s.firstName);
  const authEmail = useAuthStore((s) => s.email);
  const setUser = useAuthStore((s) => s.setUser);
  const { addresses, fetchAddresses } = useAddressStore();

  // Profile form state
  const [form, setForm] = useState({
    firstname: firstName ?? '',
    lastname: '',
    email: authEmail ?? '',
    phonenumber: '',
    gender: '',
    dateofbirth: '',
  });
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [savingPassword, setSavingPassword] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(!!userId);

  useEffect(() => {
    if (userId) fetchAddresses(Number(userId));
  }, [userId, fetchAddresses]);

  // Fetch full user profile from API on mount
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const result = await fetchUserProfile(Number(userId));
      if (cancelled) return;
      if (result.data) {
        const d = result.data;
        setForm({
          firstname: d.firstname || '',
          lastname: d.lastname || '',
          email: d.email || '',
          phonenumber: d.phonenumber || '',
          gender: d.gender || '',
          dateofbirth: d.dateofbirth ? d.dateofbirth.split('T')[0] : '',
        });
        if (d.profilepicture) setPreviewUrl(d.profilepicture);
      }
      setLoadingProfile(false);
    })();
    return () => { cancelled = true; };
  }, [userId]);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfilePicture(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (form.firstname && form.firstname.length < 2) errs.firstname = t('firstNameMinError');
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = t('invalidEmail');
    if (form.phonenumber && (form.phonenumber.length < 10 || form.phonenumber.length > 15)) errs.phonenumber = t('phoneError');
    if (form.gender && !['male', 'female', 'other', ''].includes(form.gender)) errs.gender = t('genderError');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleProfileSave() {
    if (!userId) return;
    if (!validate()) return;

    setSaving(true);
    const payload: Record<string, string | File> = {};
    if (form.firstname) payload.firstname = form.firstname;
    if (form.lastname !== undefined) payload.lastname = form.lastname;
    if (form.email) payload.email = form.email;
    if (form.phonenumber) payload.phonenumber = form.phonenumber;
    if (form.gender) payload.gender = form.gender;
    if (form.dateofbirth) payload.dateofbirth = form.dateofbirth;
    if (profilePicture) payload.profilepicture = profilePicture;

    const result = await updateUserProfile(Number(userId), payload as Parameters<typeof updateUserProfile>[1]);
    setSaving(false);

    if (result.error) {
      setToast({ message: result.error, type: 'error' });
      return;
    }

    // Sync updated data back into auth store
    if (result.data) {
      setUser({ firstName: result.data.firstname, email: result.data.email });
    }
    setToast({ message: t('profileUpdated'), type: 'success' });
  }

  function updatePasswordField(field: string, value: string) {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
    if (passwordErrors[field]) setPasswordErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  }

  function validatePassword(): boolean {
    const errs: Record<string, string> = {};
    if (!passwordForm.currentPassword) errs.currentPassword = t('fieldRequired');
    if (!passwordForm.newPassword) {
      errs.newPassword = t('fieldRequired');
    } else if (passwordForm.newPassword.length < 6 || passwordForm.newPassword.length > 20) {
      errs.newPassword = t('passwordLengthError');
    }
    if (!passwordForm.confirmNewPassword) {
      errs.confirmNewPassword = t('fieldRequired');
    } else if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      errs.confirmNewPassword = t('passwordMismatch');
    }
    setPasswordErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handlePasswordSave() {
    if (!userId) return;
    if (!validatePassword()) return;

    setSavingPassword(true);
    const result = await updateUserProfile(Number(userId), {
      password: passwordForm.newPassword,
    });
    setSavingPassword(false);

    if (result.error) {
      setToast({ message: result.error, type: 'error' });
      return;
    }

    setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    setToast({ message: t('passwordChanged'), type: 'success' });
  }

  const genderOpts = GENDER_OPTIONS.map((g) => ({
    value: g.value,
    label: g.value ? t(`gender_${g.value}`) : t('selectGender'),
  }));

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb
        items={[
          { label: t('dashboard'), href: buildPath('/account') },
          { label: t('settings') },
        ]}
      />
      <h1 className="text-3xl font-bold text-slate-900 mb-8">{t('settings')}</h1>

      <div className="space-y-8">
        {/* Personal Information */}
        <section className="bg-white rounded-2xl border p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
            <User className="w-5 h-5 text-primary" /> {t('personalInfo')}
          </h2>

          {loadingProfile ? (
            <div className="space-y-4 animate-pulse">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-full bg-slate-200" />
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-slate-200 rounded" />
                  <div className="h-3 w-32 bg-slate-200 rounded" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-10 bg-slate-200 rounded" />
                <div className="h-10 bg-slate-200 rounded" />
              </div>
              <div className="h-10 bg-slate-200 rounded" />
              <div className="h-10 bg-slate-200 rounded" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-10 bg-slate-200 rounded" />
                <div className="h-10 bg-slate-200 rounded" />
              </div>
            </div>
          ) : (
          <>
          {/* Profile picture */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-slate-200">
                {previewUrl ? (
                  <Image src={previewUrl} alt="Profile" className="w-full h-full object-cover" width={80} height={80} unoptimized />
                ) : (
                  <User className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 p-1.5 bg-primary text-white rounded-full shadow-md hover:bg-primary/90 transition-colors"
                aria-label={t('changePhoto')}
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">{t('profilePhoto')}</p>
              <p className="text-xs text-slate-600">{t('photoHint')}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('firstName')}
                name="firstname"
                value={form.firstname}
                onChange={(e) => updateField('firstname', e.target.value)}
                error={errors.firstname}
              />
              <Input
                label={t('lastName')}
                name="lastname"
                value={form.lastname}
                onChange={(e) => updateField('lastname', e.target.value)}
                error={errors.lastname}
              />
            </div>

            <Input
              label={t('emailAddress')}
              name="email"
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              error={errors.email}
            />

            <Input
              label={t('phoneNumber')}
              name="phonenumber"
              type="tel"
              value={form.phonenumber}
              onChange={(e) => updateField('phonenumber', e.target.value)}
              error={errors.phonenumber}
              maxLength={15}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label={t('gender')}
                name="gender"
                value={form.gender}
                onChange={(e) => updateField('gender', e.target.value)}
                error={errors.gender}
                options={genderOpts}
              />
              <Input
                label={t('dateOfBirth')}
                name="dateofbirth"
                type="date"
                value={form.dateofbirth}
                onChange={(e) => updateField('dateofbirth', e.target.value)}
                error={errors.dateofbirth}
              />
            </div>

            <Button onClick={handleProfileSave} disabled={saving}>
              {saving ? t('saving') : t('updateProfile')}
            </Button>
          </div>
          </>
          )}
        </section>

        {/* Change Password */}
        <section className="bg-white rounded-2xl border p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
            <Lock className="w-5 h-5 text-primary" /> {t('changePassword')}
          </h2>
          <div className="space-y-4">
            <Input
              label={t('currentPassword')}
              name="currentPassword"
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => updatePasswordField('currentPassword', e.target.value)}
              error={passwordErrors.currentPassword}
            />
            <Input
              label={t('newPassword')}
              name="newPassword"
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => updatePasswordField('newPassword', e.target.value)}
              error={passwordErrors.newPassword}
            />
            <Input
              label={t('confirmNewPassword')}
              name="confirmNewPassword"
              type="password"
              value={passwordForm.confirmNewPassword}
              onChange={(e) => updatePasswordField('confirmNewPassword', e.target.value)}
              error={passwordErrors.confirmNewPassword}
            />
            <Button onClick={handlePasswordSave} disabled={savingPassword}>
              {savingPassword ? t('saving') : t('changePassword')}
            </Button>
          </div>
        </section>

        {/* Addresses */}
        <section className="bg-white rounded-2xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" /> {t('addresses')}
            </h2>
            <Link
              href={buildPath('/account/addresses')}
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              {t('manageAddresses')} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {addresses.length > 0 ? (
            <div className="space-y-3">
              {addresses.slice(0, 2).map((addr) => (
                <div key={addr.id} className="p-4 bg-slate-50 rounded-xl">
                  <p className="font-medium text-sm">{addr.street}</p>
                  <p className="text-sm text-slate-600">{addr.city}, {addr.state} {addr.postal_code}</p>
                  <p className="text-sm text-slate-600">{addr.country}</p>
                  {addr.is_primary && <span className="text-xs text-primary font-medium">{t('defaultAddress')}</span>}
                </div>
              ))}
              {addresses.length > 2 && (
                <p className="text-sm text-slate-600 text-center">
                  +{addresses.length - 2} more
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-600">{t('noAddresses')}</p>
          )}
        </section>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </main>
  );
}

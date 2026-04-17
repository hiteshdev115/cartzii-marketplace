'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { buildCountryPath } from '@/config/countries';
import { Button } from '@/components/ui/Button';
import { Toast, type ToastType } from '@/components/ui/Toast';
import { useAddressStore } from '@/stores/addressStore';
import { useAuthStore } from '@/stores/authStore';
import { AddressForm } from '@/components/account/AddressForm';
import { AddressCard } from '@/components/account/AddressCard';
import type { ApiAddress } from '@/types';
import type { AddressFormData } from '@/lib/validators';
import { MapPin, Plus } from 'lucide-react';

export function AddressesContent() {
  const t = useTranslations('Account');
  const locale = useLocale();
  const userId = useAuthStore((s) => s.userId);
  const { addresses, loading, fetchAddresses, addAddress, editAddress, removeAddress } =
    useAddressStore();

  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<ApiAddress | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (userId) fetchAddresses(Number(userId));
  }, [userId, fetchAddresses]);

  const handleAdd = useCallback(
    async (data: AddressFormData) => {
      if (!userId) return;
      const result = await addAddress({ ...data, userid: Number(userId) });
      if (result.success) {
        showToast(t('addressAdded'), 'success');
        setShowForm(false);
      } else {
        showToast(result.error || t('addressError'), 'error');
      }
    },
    [userId, addAddress, showToast, t],
  );

  const handleEdit = useCallback(
    async (data: AddressFormData) => {
      if (!editingAddress) return;
      const result = await editAddress(editingAddress.id, data);
      if (result.success) {
        showToast(t('addressUpdated'), 'success');
        setEditingAddress(null);
      } else {
        showToast(result.error || t('addressError'), 'error');
      }
    },
    [editingAddress, editAddress, showToast, t],
  );

  const handleDelete = useCallback(
    async (id: number) => {
      setDeletingId(id);
      const result = await removeAddress(id);
      if (result.success) {
        showToast(t('addressDeleted'), 'success');
      } else {
        showToast(result.error || t('addressError'), 'error');
      }
      setDeletingId(null);
    },
    [removeAddress, showToast, t],
  );

  const isFormVisible = showForm || editingAddress !== null;

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb
        items={[
          { label: t('dashboard'), href: buildCountryPath(locale, '/account') },
          { label: t('settings'), href: buildCountryPath(locale, '/account/settings') },
          { label: t('addresses') },
        ]}
      />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-slate-900">{t('addresses')}</h1>
        {!isFormVisible && (
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="w-4 h-4" /> {t('addAddress')}
          </Button>
        )}
      </div>

      {/* Add / Edit form */}
      {showForm && !editingAddress && (
        <div className="mb-6">
          <AddressForm
            onSubmit={handleAdd}
            onCancel={() => setShowForm(false)}
            loading={loading}
          />
        </div>
      )}

      {editingAddress && (
        <div className="mb-6">
          <AddressForm
            address={editingAddress}
            onSubmit={handleEdit}
            onCancel={() => setEditingAddress(null)}
            loading={loading}
          />
        </div>
      )}

      {/* Address list */}
      {loading && addresses.length === 0 ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-16">
          <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-lg font-medium text-slate-600">{t('noAddresses')}</p>
          <p className="text-sm text-slate-500 mt-1">{t('noAddressesMessage')}</p>
          {!isFormVisible && (
            <Button onClick={() => setShowForm(true)} className="mt-6 gap-2">
              <Plus className="w-4 h-4" /> {t('addAddress')}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <AddressCard
              key={addr.id}
              address={addr}
              onEdit={(a) => {
                setShowForm(false);
                setEditingAddress(a);
              }}
              onDelete={handleDelete}
              deleting={deletingId === addr.id}
            />
          ))}
        </div>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </main>
  );
}

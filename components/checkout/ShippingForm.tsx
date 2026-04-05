'use client';

import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { shippingSchema, ShippingFormData } from '@/lib/validators';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface ShippingFormProps {
  onSubmit: (data: ShippingFormData) => void;
  defaultValues?: Partial<ShippingFormData>;
}

export function ShippingForm({ onSubmit, defaultValues }: ShippingFormProps) {
  const t = useTranslations('Checkout');
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShippingFormData>({
    resolver: zodResolver(shippingSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">{t('shippingAddress')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label={t('firstName')} {...register('firstName')} error={errors.firstName?.message} />
        <Input label={t('lastName')} {...register('lastName')} error={errors.lastName?.message} />
      </div>
      <Input label={t('email')} type="email" {...register('email')} error={errors.email?.message} />
      <Input label={t('phone')} type="tel" {...register('phone')} error={errors.phone?.message} />
      <Input label={t('address')} {...register('address')} error={errors.address?.message} />
      <Input label={t('apartment')} {...register('addressLine2')} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label={t('city')} {...register('city')} error={errors.city?.message} />
        <Input label={t('state')} {...register('state')} error={errors.state?.message} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label={t('zipCode')} {...register('zipCode')} error={errors.zipCode?.message} />
        <Input label={t('country')} {...register('country')} error={errors.country?.message} />
      </div>
      <Button type="submit" className="w-full mt-4">
        {t('continueToPayment')}
      </Button>
    </form>
  );
}

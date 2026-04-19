'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CheckoutSteps } from '@/components/checkout/CheckoutSteps';
import { ShippingForm } from '@/components/checkout/ShippingForm';
import { PaymentForm } from '@/components/checkout/PaymentForm';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { useCartStore } from '@/stores/cartStore';
import { CheckCircle, Package } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { buildCountryPath } from '@/config/countries';
import { generateOrderNumber } from '@/lib/utils';

export function CheckoutPageContent() {
  const t = useTranslations('Checkout');
  const locale = useLocale();
  const clearCart = useCartStore((s) => s.clearCart);
  const [step, setStep] = useState(0);
  const [orderNumber, setOrderNumber] = useState('');

  const steps = [t('shipping'), t('payment'), t('confirmation')];

  const handleShippingSubmit = () => {
    setStep(1);
  };

  const handlePaymentSubmit = () => {
    const num = generateOrderNumber();
    setOrderNumber(num);
    clearCart();
    setStep(2);
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[{ label: t('title') }]} />
      <h1 className="text-3xl font-bold text-slate-900 mb-6">{t('title')}</h1>
      <CheckoutSteps currentStep={step} steps={steps} />

      {step < 2 ? (
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            {step === 0 && <ShippingForm onSubmit={handleShippingSubmit} />}
            {step === 1 && <PaymentForm onSubmit={handlePaymentSubmit} onBack={() => setStep(0)} />}
          </div>
          <div className="lg:col-span-2">
            <OrderSummary />
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('orderConfirmed')}</h2>
          <p className="text-slate-600 mb-1">{t('orderNumber')}: <span className="font-mono font-bold">{orderNumber}</span></p>
          <p className="text-sm text-slate-600 mb-8">{t('confirmationEmail')}</p>
          <div className="flex items-center justify-center gap-4">
            <Link href={buildCountryPath(locale, '/products')} className="btn-primary flex items-center gap-2">
              <Package className="w-4 h-4" /> {t('continueShopping')}
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}

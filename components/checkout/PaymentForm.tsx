'use client';

import { useTranslations } from 'next-intl';
import { CreditCard, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useState } from 'react';

interface PaymentFormProps {
  onSubmit: () => void;
  onBack: () => void;
}

export function PaymentForm({ onSubmit, onBack }: PaymentFormProps) {
  const t = useTranslations('Checkout');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardName, setCardName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})/g, '$1 ').trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <CreditCard className="w-5 h-5" /> {t('paymentDetails')}
      </h2>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-2 text-sm text-blue-700">
        <Lock className="w-4 h-4" />
        {t('securePayment')}
      </div>

      <Input
        label={t('cardholderName')}
        value={cardName}
        onChange={(e) => setCardName(e.target.value)}
        required
      />
      <Input
        label={t('cardNumber')}
        value={cardNumber}
        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
        placeholder="1234 5678 9012 3456"
        inputMode="numeric"
        required
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label={t('expiryDate')}
          value={expiry}
          onChange={(e) => setExpiry(formatExpiry(e.target.value))}
          placeholder="MM/YY"
          inputMode="numeric"
          required
        />
        <Input
          label={t('cvc')}
          value={cvc}
          onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="123"
          inputMode="numeric"
          required
        />
      </div>

      <div className="flex gap-4 mt-6">
        <button type="button" onClick={onBack} className="btn-ghost flex-1">{t('back')}</button>
        <Button type="submit" className="flex-1">{t('placeOrder')}</Button>
      </div>
    </form>
  );
}

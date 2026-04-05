'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckoutStepsProps {
  currentStep: number;
  steps: string[];
}

export function CheckoutSteps({ currentStep, steps }: CheckoutStepsProps) {
  return (
    <nav aria-label="Checkout progress" className="mb-8">
      <ol className="flex items-center overflow-x-auto">
        {steps.map((step, i) => (
          <li key={step} className="flex items-center flex-1 last:flex-none min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0',
                  i < currentStep
                    ? 'bg-green-500 text-white'
                    : i === currentStep
                    ? 'bg-primary text-white'
                    : 'bg-slate-200 text-slate-500'
                )}
              >
                {i < currentStep ? <Check className="w-4 h-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  'text-sm font-medium hidden sm:block',
                  i <= currentStep ? 'text-slate-900' : 'text-slate-400'
                )}
              >
                {step}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn('flex-1 h-0.5 mx-4', i < currentStep ? 'bg-green-500' : 'bg-slate-200')} />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

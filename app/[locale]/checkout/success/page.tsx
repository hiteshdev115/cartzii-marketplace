'use client';

import { useSearchParams, useRouter } from 'next/navigation';

import { CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { buildPath } from '@/config/countries';

const EASE = [0.25, 0.1, 0.25, 1] as const;

function fadeScale(delay = 0) {
  return {
    initial: { opacity: 0, scale: 0.85 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.4, ease: EASE, delay },
  } as const;
}

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: EASE, delay },
  } as const;
}

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const paymentIntent = searchParams.get('payment_intent');
  const redirectStatus = searchParams.get('redirect_status');

  const succeeded =
    redirectStatus === 'succeeded' || (!!paymentIntent && redirectStatus !== 'failed');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="bg-white rounded-2xl shadow-md p-6 sm:p-10 max-w-md w-full text-center space-y-5 sm:space-y-6">
        {succeeded ? (
          <>
            {/* Success icon */}
            <motion.div {...fadeScale(0)} className="flex justify-center">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            </motion.div>

            {/* Heading */}
            <motion.h1 {...fadeUp(0.1)} className="text-2xl font-bold text-gray-900">
              Payment Successful!
            </motion.h1>

            {/* Body text */}
            <motion.p {...fadeUp(0.2)} className="text-sm text-gray-500">
              Thank you for your order. You&apos;ll receive a confirmation email shortly.
            </motion.p>

            {/* Payment intent pill */}
            {paymentIntent && (
              <motion.div {...fadeUp(0.3)}>
                <span className="inline-block bg-gray-100 text-gray-600 font-mono text-xs px-3 py-1.5 rounded-full break-all">
                  {paymentIntent}
                </span>
              </motion.div>
            )}

            {/* CTA */}
            <motion.div {...fadeUp(0.4)}>
              <button
                onClick={() => router.push(buildPath('/'))}
                className="btn-primary w-full"
              >
                Continue Shopping
              </button>
            </motion.div>
          </>
        ) : (
          <>
            {/* Failure icon */}
            <motion.div {...fadeScale(0)} className="flex justify-center">
              <XCircle className="w-16 h-16 text-red-500" />
            </motion.div>

            {/* Heading */}
            <motion.h1 {...fadeUp(0.1)} className="text-2xl font-bold text-gray-900">
              Payment Failed
            </motion.h1>

            {/* Body text */}
            <motion.p {...fadeUp(0.2)} className="text-sm text-gray-500">
              Something went wrong with your payment. Please try again.
            </motion.p>

            {/* CTA */}
            <motion.div {...fadeUp(0.3)}>
              <button
                onClick={() => router.push(buildPath('/checkout'))}
                className="btn-primary w-full"
              >
                Try Again
              </button>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}

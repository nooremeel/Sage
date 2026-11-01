'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import type { OrderDto } from '@sage/shared';

interface CheckoutSandboxCardProps {
  order: OrderDto;
  locale: 'ar' | 'en';
}

export function CheckoutSandboxCard({ order, locale }: CheckoutSandboxCardProps) {
  const t = useTranslations('Payments');
  const router = useRouter();

  const [status, setStatus] = React.useState<OrderDto['status']>(order.status);
  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSimulate = async (action: 'pay' | 'fail') => {
    setLoadingAction(action);
    setErrorMessage(null);

    try {
      const res = await apiClient<{ status: string; orderId: string }>(
        `/payments/orders/${order.id}/simulate`,
        {
          method: 'POST',
          body: JSON.stringify({ action }),
        }
      );

      if (res.status === 'success') {
        setStatus('completed');
        // Refresh after short delay so user sees celebration state
        setTimeout(() => {
          router.push(`/${locale}/courses`);
        }, 1500);
      } else {
        setStatus('failed');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Payment simulation failed');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCancel = async () => {
    setLoadingAction('cancel');
    setErrorMessage(null);

    try {
      await apiClient(`/payments/orders/${order.id}/cancel`, {
        method: 'POST',
      });
      setStatus('cancelled');
      router.push(`/${locale}/courses`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not cancel order');
    } finally {
      setLoadingAction(null);
    }
  };

  if (status === 'completed') {
    return (
      <div className="rounded-lg border-2 border-success bg-paper-200/60 dark:bg-card p-6 text-center space-y-4 shadow-e1 animate-in fade-in duration-300">
        <div className="w-14 h-14 rounded-full bg-success/15 text-success flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="font-headline text-2xl font-bold text-text">
            {t('paymentSuccessTitle')}
          </h3>
          <p className="text-xs text-text-muted max-w-md mx-auto">
            {t('paymentSuccessDesc')}
          </p>
        </div>
        <div className="pt-2">
          <Button
            variant="accent"
            size="md"
            onClick={() => router.push(`/${locale}/courses`)}
            className="flex items-center gap-2 mx-auto"
          >
            <span>{t('startLearning')}</span>
            {locale === 'ar' ? (
              <ArrowLeft className="w-4 h-4" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    );
  }

  if (status === 'cancelled') {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-paper-200 text-text-muted flex items-center justify-center mx-auto">
          <XCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-headline text-xl font-bold text-text">
            {t('orderCancelledTitle')}
          </h3>
          <p className="text-xs text-text-muted">
            {t('orderCancelledDesc')}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.push(`/${locale}/courses`)}
          className="mx-auto"
        >
          {t('returnToCatalog')}
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-6 shadow-e1">
      {/* Sandbox Notice Banner */}
      <div className="rounded-md border border-accent/40 bg-accent/10 p-3.5 flex items-start gap-3 text-start">
        <ShieldCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold text-text">
            {t('sandboxModeTitle')}
          </h4>
          <p className="text-[11px] text-text-muted leading-relaxed">
            {t('sandboxModeNotice')}
          </p>
        </div>
      </div>

      {status === 'failed' && (
        <div className="rounded-md border border-danger/40 bg-danger/10 p-3.5 flex items-start gap-3 text-start text-danger">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-xs">
            <h5 className="font-semibold">{t('paymentFailedTitle')}</h5>
            <p>{t('paymentFailedDesc')}</p>
          </div>
        </div>
      )}

      {errorMessage && (
        <p className="text-xs text-danger text-start font-medium">
          {errorMessage}
        </p>
      )}

      {/* Action Buttons */}
      <div className="space-y-3 pt-2">
        <Button
          variant="accent"
          size="lg"
          onClick={() => handleSimulate('pay')}
          disabled={loadingAction !== null}
          className="w-full flex items-center justify-center gap-2 font-semibold shadow-sm"
        >
          {loadingAction === 'pay' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t('processingPayment')}</span>
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              <span>
                {t('payAmount', {
                  amount: `$${(order.amountCents / 100).toFixed(2)}`,
                })}
              </span>
            </>
          )}
        </Button>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleSimulate('fail')}
            disabled={loadingAction !== null}
            className="flex items-center justify-center gap-1.5 text-xs border-border"
          >
            {loadingAction === 'fail' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            )}
            <span>{t('simulateFailure')}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={loadingAction !== null}
            className="flex items-center justify-center gap-1.5 text-xs text-danger hover:bg-danger/10"
          >
            {loadingAction === 'cancel' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <XCircle className="w-3.5 h-3.5" />
            )}
            <span>{t('cancelOrder')}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

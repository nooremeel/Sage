'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

export default function VerifyEmailPage() {
  const tAuth = useTranslations('auth');
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = React.useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = React.useState<string>('');

  React.useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage(tAuth('invalidToken'));
      return;
    }

    apiClient('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
      .then(() => {
        setStatus('success');
        setMessage(tAuth('emailVerifiedSuccess'));
      })
      .catch((err: unknown) => {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : tAuth('invalidToken'));
      });
  }, [token, tAuth]);

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-1">
        <h1 className="font-headline text-2xl font-bold tracking-tight text-text">
          {tAuth('verifyEmailTitle')}
        </h1>
        <p className="text-xs text-text-muted">
          {tAuth('verifyEmailSubtitle')}
        </p>
      </div>

      {status === 'loading' && (
        <div className="py-6 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {status === 'success' && (
        <Alert variant="success">
          <span>{message}</span>
        </Alert>
      )}

      {status === 'error' && (
        <Alert variant="danger">
          <span>{message}</span>
        </Alert>
      )}

      {status !== 'loading' && (
        <div className="pt-2">
          <Link href="/login">
            <Button variant="primary" className="w-full">
              {tAuth('signInBtn')}
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

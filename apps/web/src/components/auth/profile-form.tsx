'use client';

import * as React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { useRouter, usePathname } from '@/i18n/routing';

export function ProfileForm() {
  const tProfile = useTranslations('profile');
  const tAuth = useTranslations('auth');
  const tCommon = useTranslations('common');
  const currentLocale = useLocale() as 'ar' | 'en';
  const { user, refreshUser, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [selectedLocale, setSelectedLocale] = React.useState<'ar' | 'en'>(
    (user?.locale as 'ar' | 'en') || currentLocale
  );
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  if (!user) {
    return null;
  }

  const handleUpdateLocale = async () => {
    setIsUpdating(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await apiClient('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ locale: selectedLocale }),
      });
      await refreshUser();
      setSuccessMsg(tProfile('updateSuccess'));

      // If locale changed, redirect to matching locale route
      if (selectedLocale !== currentLocale) {
        router.replace(pathname, { locale: selectedLocale });
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg(tAuth('errorGeneric'));
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {successMsg && (
        <Alert variant="success">
          <span>{successMsg}</span>
        </Alert>
      )}

      {errorMsg && (
        <Alert variant="danger">
          <span>{errorMsg}</span>
        </Alert>
      )}

      <Card className="p-6 space-y-4">
        <h3 className="font-headline text-xl font-semibold text-text">
          {tProfile('accountDetails')}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-text-muted block text-xs">{tProfile('email')}</span>
            <span className="font-medium text-text">{user.email}</span>
          </div>

          <div>
            <span className="text-text-muted block text-xs">{tProfile('role')}</span>
            <Badge variant="secondary" className="mt-1 capitalize">
              {user.role}
            </Badge>
          </div>

          <div>
            <span className="text-text-muted block text-xs">{tProfile('memberSince')}</span>
            <span className="font-medium text-text">
              {new Date(user.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="font-headline text-xl font-semibold text-text">
          {tProfile('languagePreference')}
        </h3>

        <div className="grid grid-cols-2 gap-3 max-w-xs">
          <button
            type="button"
            onClick={() => setSelectedLocale('en')}
            className={`p-3 rounded-md border text-sm font-medium transition-colors text-center focus-ring ${
              selectedLocale === 'en'
                ? 'border-primary bg-primary-tint text-primary font-semibold'
                : 'border-border bg-card text-text hover:bg-bg-subtle'
            }`}
          >
            {tCommon('english')}
          </button>
          <button
            type="button"
            onClick={() => setSelectedLocale('ar')}
            className={`p-3 rounded-md border text-sm font-medium transition-colors text-center focus-ring ${
              selectedLocale === 'ar'
                ? 'border-primary bg-primary-tint text-primary font-semibold'
                : 'border-border bg-card text-text hover:bg-bg-subtle'
            }`}
          >
            {tCommon('arabic')}
          </button>
        </div>

        <Button
          type="button"
          variant="primary"
          onClick={handleUpdateLocale}
          isLoading={isUpdating}
        >
          {tProfile('updateLanguage')}
        </Button>
      </Card>

      <div className="pt-4 border-t border-border flex justify-end">
        <Button
          type="button"
          variant="destructive"
          onClick={handleLogout}
        >
          {tAuth('signOut')}
        </Button>
      </div>
    </div>
  );
}

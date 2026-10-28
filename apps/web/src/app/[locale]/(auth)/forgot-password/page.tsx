import { useTranslations } from 'next-intl';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export default function ForgotPasswordPage() {
  const tAuth = useTranslations('auth');

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="font-headline text-2xl font-bold tracking-tight text-text">
          {tAuth('forgotPasswordTitle')}
        </h1>
        <p className="text-xs text-text-muted">
          {tAuth('forgotPasswordSubtitle')}
        </p>
      </div>

      <ForgotPasswordForm />
    </div>
  );
}


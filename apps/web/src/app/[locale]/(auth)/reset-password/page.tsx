import { useTranslations } from 'next-intl';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  const token = params.token || '';
  const tAuth = useTranslations('auth');

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="font-headline text-2xl font-bold tracking-tight text-text">
          {tAuth('resetPasswordTitle')}
        </h1>
        <p className="text-xs text-text-muted">
          {tAuth('resetPasswordSubtitle')}
        </p>
      </div>

      <ResetPasswordForm token={token} />
    </div>
  );
}

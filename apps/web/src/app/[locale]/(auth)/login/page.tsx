import { useTranslations } from 'next-intl';
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  const tAuth = useTranslations('auth');

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="font-headline text-2xl font-bold tracking-tight text-text">
          {tAuth('loginTitle')}
        </h1>
        <p className="text-xs text-text-muted">
          {tAuth('loginSubtitle')}
        </p>
      </div>

      <LoginForm />
    </div>
  );
}


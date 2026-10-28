import { useTranslations } from 'next-intl';
import { SignupForm } from '@/components/auth/signup-form';

export default function SignupPage() {
  const tAuth = useTranslations('auth');

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="font-headline text-2xl font-bold tracking-tight text-text">
          {tAuth('signupTitle')}
        </h1>
        <p className="text-xs text-text-muted">
          {tAuth('signupSubtitle')}
        </p>
      </div>

      <SignupForm />
    </div>
  );
}


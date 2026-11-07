import { useTranslations } from 'next-intl';
import { LoginForm } from '@/components/auth/login-form';
import { DemoPersonasCard } from '@/components/auth/demo-personas-card';

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

      {/* 1-Click Demo Persona Quick Picker */}
      <DemoPersonasCard />

      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <span className="relative bg-card px-3 text-[11px] uppercase tracking-wider text-text-muted">
          {tAuth('orDivider')}
        </span>
      </div>

      <LoginForm />
    </div>
  );
}

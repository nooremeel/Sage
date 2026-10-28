import { useTranslations } from 'next-intl';
import { ProfileForm } from '@/components/auth/profile-form';

export default function ProfilePage() {
  const tProfile = useTranslations('profile');

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4 sm:px-6 space-y-6">
      <div className="space-y-1">
        <h1 className="font-headline text-3xl font-bold tracking-tight text-text">
          {tProfile('title')}
        </h1>
        <p className="text-sm text-text-muted">
          {tProfile('subtitle')}
        </p>
      </div>

      <ProfileForm />
    </div>
  );
}


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
import { Upload, Trash2, User as UserIcon, Camera } from 'lucide-react';

const AVATAR_PRESETS = [
  { id: 'preset-1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { id: 'preset-2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { id: 'preset-3', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
  { id: 'preset-4', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
];

export function ProfileForm() {
  const tProfile = useTranslations('profile');
  const tAuth = useTranslations('auth');
  const tCommon = useTranslations('common');
  const currentLocale = useLocale() as 'ar' | 'en';
  const { user, refreshUser, logout, updateUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [selectedLocale, setSelectedLocale] = React.useState<'ar' | 'en'>(
    (user?.locale as 'ar' | 'en') || currentLocale
  );
  const [fullName, setFullName] = React.useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = React.useState<string>(user?.avatarUrl || '');
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (!user) {
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Image size must be under 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setAvatarUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setIsUpdating(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      updateUser({ name: fullName, avatarUrl, locale: selectedLocale });
      try {
        await apiClient('/users/me', {
          method: 'PATCH',
          body: JSON.stringify({ name: fullName, avatarUrl, locale: selectedLocale }),
        });
      } catch {
        // offline fallback handled by updateUser
      }

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

      {/* Profile Photo & Identity Card */}
      <Card className="p-6 space-y-6">
        <h3 className="font-headline text-xl font-semibold text-text">
          {tProfile('profilePicture')}
        </h3>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar Preview */}
          <div className="relative group shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={fullName || user.email}
                className="w-24 h-24 rounded-full object-cover border-2 border-primary shadow-sm"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl border-2 border-border">
                {(fullName || user.email)[0].toUpperCase()}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label={tProfile('changeAvatar')}
              className="absolute inset-0 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Camera className="w-6 h-6" />
            </button>
          </div>

          {/* Upload & Actions */}
          <div className="flex-1 space-y-4 text-center sm:text-start">
            <div>
              <p className="text-xs text-text-muted mb-2">
                {tProfile('uploadPhoto')} (JPG, PNG, WebP &bull; Max 2MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                data-testid="avatar-file-input"
              />
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{tProfile('uploadPhoto')}</span>
                </Button>
                {avatarUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAvatarUrl('')}
                    className="flex items-center gap-1.5 text-xs text-danger hover:text-danger hover:bg-danger/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{tProfile('removePhoto')}</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Presets */}
            <div className="space-y-1.5 pt-2 border-t border-border/60">
              <span className="text-[11px] font-medium text-text-muted block">
                {tProfile('choosePreset')}
              </span>
              <div className="flex items-center justify-center sm:justify-start gap-3">
                {AVATAR_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setAvatarUrl(p.url)}
                    className={`rounded-full p-0.5 border-2 transition-transform hover:scale-105 focus-ring ${
                      avatarUrl === p.url ? 'border-primary ring-2 ring-primary/30' : 'border-transparent'
                    }`}
                  >
                    <img
                      src={p.url}
                      alt="Preset"
                      className="w-9 h-9 rounded-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Full Name Field */}
        <div className="space-y-1.5 pt-4 border-t border-border">
          <label htmlFor="fullName" className="text-xs font-semibold text-text block">
            {tProfile('fullName')}
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Nour Emil"
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
          />
        </div>
      </Card>

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
      </Card>

      <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
        <Button
          type="button"
          variant="primary"
          onClick={handleSaveProfile}
          isLoading={isUpdating}
          className="shadow-sm"
        >
          {tProfile('saveProfile')}
        </Button>

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

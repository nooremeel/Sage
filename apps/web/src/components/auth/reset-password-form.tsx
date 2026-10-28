'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { ResetPasswordSchema, type ResetPasswordInput } from '@sage/shared';
import { apiClient } from '@/lib/api';
import { Link, useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldWrapper } from '@/components/ui/field-wrapper';
import { Alert } from '@/components/ui/alert';

export function ResetPasswordForm({ token }: { token: string }) {
  const tAuth = useTranslations('auth');
  const router = useRouter();
  const [success, setSuccess] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: { token },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    try {
      setErrorMsg(null);
      await apiClient('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg(tAuth('errorGeneric'));
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full">
      {success && (
        <Alert variant="success">
          <span>{tAuth('passwordResetSuccess')}</span>
        </Alert>
      )}

      {errorMsg && (
        <Alert variant="danger">
          <span>{errorMsg}</span>
        </Alert>
      )}

      {!success && (
        <>
          <input type="hidden" {...register('token')} value={token} />

          <FieldWrapper
            label={tAuth('newPasswordLabel')}
            error={errors.newPassword?.message}
            required
          >
            <Input
              type="password"
              dir="ltr"
              autoComplete="new-password"
              placeholder="••••••••"
              {...register('newPassword')}
            />
          </FieldWrapper>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isSubmitting}
          >
            {tAuth('resetPasswordBtn')}
          </Button>
        </>
      )}

      <p className="text-center text-xs text-text-muted pt-2">
        <Link
          href="/login"
          className="font-medium text-primary hover:underline focus-ring rounded-xs"
        >
          {tAuth('signInBtn')}
        </Link>
      </p>
    </form>
  );
}

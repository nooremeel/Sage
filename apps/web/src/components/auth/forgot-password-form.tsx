'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { ForgotPasswordSchema, type ForgotPasswordInput } from '@sage/shared';
import { apiClient } from '@/lib/api';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldWrapper } from '@/components/ui/field-wrapper';
import { Alert } from '@/components/ui/alert';

export function ForgotPasswordForm() {
  const tAuth = useTranslations('auth');
  const [success, setSuccess] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    try {
      setErrorMsg(null);
      await apiClient('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setSuccess(true);
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
          <span>{tAuth('checkEmailAlert')}</span>
        </Alert>
      )}

      {errorMsg && (
        <Alert variant="danger">
          <span>{errorMsg}</span>
        </Alert>
      )}

      {!success && (
        <>
          <FieldWrapper
            label={tAuth('emailLabel')}
            error={errors.email?.message}
            required
          >
            <Input
              type="email"
              dir="ltr"
              autoComplete="email"
              placeholder="name@example.com"
              {...register('email')}
            />
          </FieldWrapper>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isSubmitting}
          >
            {tAuth('sendResetLinkBtn')}
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

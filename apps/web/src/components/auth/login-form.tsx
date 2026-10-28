'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { LoginSchema, type LoginInput } from '@sage/shared';
import { useAuth } from '@/lib/auth-context';
import { Link, useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldWrapper } from '@/components/ui/field-wrapper';
import { Alert } from '@/components/ui/alert';

export function LoginForm() {
  const tAuth = useTranslations('auth');
  const { login } = useAuth();
  const router = useRouter();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      setErrorMsg(null);
      await login(data);
      router.push('/');
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
      {errorMsg && (
        <Alert variant="danger">
          <span>{errorMsg}</span>
        </Alert>
      )}

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

      <FieldWrapper
        label={tAuth('passwordLabel')}
        error={errors.password?.message}
        required
      >
        <Input
          type="password"
          dir="ltr"
          autoComplete="current-password"
          {...register('password')}
        />
      </FieldWrapper>

      <div className="flex items-center justify-end">
        <Link
          href="/forgot-password"
          className="text-xs text-primary hover:underline focus-ring rounded-xs"
        >
          {tAuth('forgotPasswordLink')}
        </Link>
      </div>

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        isLoading={isSubmitting}
      >
        {tAuth('signInBtn')}
      </Button>

      <p className="text-center text-xs text-text-muted pt-2">
        {tAuth('noAccount')}{' '}
        <Link
          href="/signup"
          className="font-medium text-primary hover:underline focus-ring rounded-xs"
        >
          {tAuth('signUpBtn')}
        </Link>
      </p>
    </form>
  );
}

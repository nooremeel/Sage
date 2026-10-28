'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations, useLocale } from 'next-intl';
import { SignupSchema, type SignupInput, type SignupRawInput } from '@sage/shared';
import { useAuth } from '@/lib/auth-context';
import { Link, useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldWrapper } from '@/components/ui/field-wrapper';
import { Alert } from '@/components/ui/alert';

export function SignupForm() {
  const tAuth = useTranslations('auth');
  const tCommon = useTranslations('common');
  const activeLocale = useLocale() as 'ar' | 'en';
  const { signup } = useAuth();
  const router = useRouter();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupRawInput, any, SignupInput>({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      role: 'student',
      locale: activeLocale,
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: SignupInput) => {
    try {
      setErrorMsg(null);
      await signup(data);
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

      {/* Role Selection */}
      <FieldWrapper label={tAuth('roleLabel')} required>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setValue('role', 'student')}
            className={`p-3 rounded-md border text-sm font-medium transition-colors text-start focus-ring ${
              selectedRole === 'student'
                ? 'border-primary bg-primary-tint text-primary font-semibold'
                : 'border-border bg-card text-text hover:bg-bg-subtle'
            }`}
          >
            {tAuth('studentRole')}
          </button>
          <button
            type="button"
            onClick={() => setValue('role', 'instructor')}
            className={`p-3 rounded-md border text-sm font-medium transition-colors text-start focus-ring ${
              selectedRole === 'instructor'
                ? 'border-primary bg-primary-tint text-primary font-semibold'
                : 'border-border bg-card text-text hover:bg-bg-subtle'
            }`}
          >
            {tAuth('instructorRole')}
          </button>
        </div>
      </FieldWrapper>

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
          autoComplete="new-password"
          placeholder="••••••••"
          {...register('password')}
        />
      </FieldWrapper>

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        isLoading={isSubmitting}
      >
        {tAuth('signUpBtn')}
      </Button>

      <p className="text-center text-xs text-text-muted pt-2">
        {tAuth('haveAccount')}{' '}
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

'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/lib/auth-context';
import { DEMO_PERSONAS, type DemoPersona } from '@/lib/demo-courses';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowEnd } from '@/components/ui/directional-icon';
import { GraduationCap, PenTool, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DemoPersonasCard() {
  const tAuth = useTranslations('auth');
  const locale = useLocale() as 'ar' | 'en';
  const { login } = useAuth();
  const router = useRouter();
  const [activeLoggingIn, setActiveLoggingIn] = React.useState<string | null>(null);

  const getPersonaIcon = (role: DemoPersona['role']) => {
    switch (role) {
      case 'student':
        return <GraduationCap className="h-4 w-4 text-primary" />;
      case 'instructor':
        return <PenTool className="h-4 w-4 text-accent" />;
      case 'admin':
        return <ShieldCheck className="h-4 w-4 text-success" />;
    }
  };

  const getPersonaBadgeVariant = (role: DemoPersona['role']): 'secondary' | 'accent' | 'sage' => {
    switch (role) {
      case 'student':
        return 'secondary';
      case 'instructor':
        return 'accent';
      case 'admin':
        return 'sage';
    }
  };

  const handle1ClickLogin = async (persona: DemoPersona) => {
    try {
      setActiveLoggingIn(persona.role);
      await login({
        email: persona.email,
        password: 'password123',
      });
      router.push(persona.targetPath);
    } catch {
      // Offline fallback login will handle session setup
      router.push(persona.targetPath);
    } finally {
      setActiveLoggingIn(null);
    }
  };

  return (
    <Card className="border border-border/80 bg-paper-200/40 p-4 sm:p-5 text-start shadow-xs dark:bg-bg-subtle/40">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="h-4 w-4 text-accent shrink-0" />
        <h2 className="font-headline text-base font-bold text-text">
          {tAuth('demoPersonasTitle')}
        </h2>
      </div>
      <p className="text-xs text-text-muted mb-4 leading-relaxed">
        {tAuth('demoPersonasSubtitle')}
      </p>

      {/* Personas List */}
      <div className="space-y-2.5">
        {DEMO_PERSONAS.map((persona) => {
          const isCurrentLoading = activeLoggingIn === persona.role;
          const isAnyLoading = activeLoggingIn !== null;

          return (
            <div
              key={persona.role}
              data-testid={`persona-card-${persona.role}`}
              className={cn(
                'group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-md border border-border/70 bg-card/80 transition-all hover:border-primary/50 hover:shadow-xs',
                isCurrentLoading && 'opacity-80'
              )}
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-paper-200 dark:bg-bg mt-0.5 sm:mt-0">
                  {getPersonaIcon(persona.role)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-headline text-sm font-semibold text-text truncate">
                      {persona.name[locale]}
                    </span>
                    <Badge variant={getPersonaBadgeVariant(persona.role)} className="text-[10px] py-0 px-1.5 h-4">
                      {persona.badge[locale]}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-text-muted mt-0.5 line-clamp-1 leading-normal">
                    {persona.description[locale]}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                size="sm"
                variant={persona.role === 'admin' ? 'primary' : persona.role === 'instructor' ? 'accent' : 'secondary'}
                disabled={isAnyLoading}
                onClick={() => handle1ClickLogin(persona)}
                data-testid={`btn-login-${persona.role}`}
                className="shrink-0 text-xs gap-1.5 self-end sm:self-auto w-full sm:w-auto"
              >
                {isCurrentLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>...</span>
                  </>
                ) : (
                  <>
                    <span>{tAuth('oneClickLogin', { role: persona.badge[locale] })}</span>
                    <ArrowEnd className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

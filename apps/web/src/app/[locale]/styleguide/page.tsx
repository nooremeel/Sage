import { setRequestLocale } from 'next-intl/server';
import { StyleguideClient } from './styleguide-client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Styleguide & Design System — Sage (سايج)',
  description: 'Component catalog, design tokens, typography, and accessibility showcase.',
};

interface StyleguidePageProps {
  params: Promise<{ locale: string }>;
}

export default async function StyleguidePage({ params }: StyleguidePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <StyleguideClient />;
}

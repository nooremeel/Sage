import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { DirectionProvider } from '@radix-ui/react-direction';
import { LOCALES, type Locale } from '@sage/shared';
import {
  ebGaramond,
  amiri,
  ibmPlexSans,
  ibmPlexSansArabic,
  ibmPlexMono,
} from '../fonts';
import '../globals.css';
import { Header } from '@/components/shell/header';
import { Footer } from '@/components/shell/footer';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'Sage (سايج) — Learn something worth knowing',
  description: 'Bilingual (AR/EN, RTL-first) course platform with protected video delivery',
};

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

interface RootLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function RootLayout({ children, params }: RootLayoutProps) {
  const { locale } = await params;

  if (!LOCALES.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  const cookieStore = await cookies();
  const theme = cookieStore.get('sage_theme')?.value ?? 'light';

  const fontVariables = [
    ebGaramond.variable,
    amiri.variable,
    ibmPlexSans.variable,
    ibmPlexSansArabic.variable,
    ibmPlexMono.variable,
  ].join(' ');

  return (
    <html lang={locale} dir={dir} data-theme={theme} className={fontVariables} suppressHydrationWarning>
      <body className="min-h-screen bg-bg text-text antialiased flex flex-col">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <DirectionProvider dir={dir}>
            <AuthProvider>
              <Header />
              <div className="flex-1">{children}</div>
              <Footer />
            </AuthProvider>
          </DirectionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

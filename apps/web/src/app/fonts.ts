import {
  EB_Garamond,
  Amiri,
  IBM_Plex_Sans,
  IBM_Plex_Sans_Arabic,
  IBM_Plex_Mono,
} from 'next/font/google';

export const ebGaramond = EB_Garamond({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-eb-garamond',
  display: 'swap',
});

export const amiri = Amiri({
  subsets: ['arabic'],
  weight: ['700'],
  variable: '--font-amiri',
  display: 'swap',
});

export const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-sans',
  display: 'swap',
});

export const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-sans-arabic',
  display: 'swap',
});

export const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap',
});

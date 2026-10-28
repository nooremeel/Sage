/**
 * Normalize Arabic text for search and indexation:
 * - Strip Tashkeel (diacritics: Fatha, Damma, Kasra, Sukun, Shadda, Tanwin)
 * - Strip Tatweel (kashida: ـ)
 * - Normalize Alef variants (أ, إ, آ, ٱ -> ا)
 * - Normalize Alef Maqsura (ى -> ي)
 * - Normalize Ta Marbuta (ة -> ه)
 */
export function normalizeArabic(text: string): string {
  if (!text) return '';

  return (
    text
      // Strip Tashkeel (Unicode range \u064B to \u0652) and Shadda (\u0651)
      .replace(/[\u064B-\u0652\u0651\u0670]/g, '')
      // Strip Tatweel (\u0640)
      .replace(/\u0640/g, '')
      // Normalize Alef variants to bare Alef (ا)
      .replace(/[أإآٱ]/g, 'ا')
      // Normalize Alef Maqsura (ى) to Yeh (ي)
      .replace(/ى/g, 'ي')
      // Normalize Ta Marbuta (ة) to Heh (ه)
      .replace(/ة/g, 'ه')
      .trim()
  );
}


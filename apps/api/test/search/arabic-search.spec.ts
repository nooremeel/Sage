import { describe, it, expect } from 'vitest';
import { normalizeArabic } from '../../src/common/utils/arabic-normalizer.js';

describe('Arabic Text Normalization & Search Edge Cases', () => {
  it('strips all Tashkeel diacritics (Fatha, Damma, Kasra, Tanwin, Sukun, Shadda)', () => {
    // تَعلُّمٌ مُتَقَدِّمٌ فِي بَرْمَجَةِ النُّظُمِ
    const inputWithDiacritics = 'تَعلُّمٌ مُتَقَدِّمٌ فِي بَرْمَجَةِ النُّظُمِ';
    const normalized = normalizeArabic(inputWithDiacritics);

    expect(normalized).toBe('تعلم متقدم في برمجه النظم');
  });

  it('strips Tatweel (kashida ـ) cleanly', () => {
    const inputWithTatweel = 'تــــعــــلـــــم نــــيـــــســــت';
    const normalized = normalizeArabic(inputWithTatweel);

    expect(normalized).toBe('تعلم نيست');
  });

  it('normalizes all Alef variants (أ, إ, آ, ٱ) to bare Alef (ا)', () => {
    expect(normalizeArabic('أحمد')).toBe('احمد');
    expect(normalizeArabic('إدارة')).toBe('اداره');
    expect(normalizeArabic('آفاق')).toBe('افاق');
    expect(normalizeArabic('ٱستمع')).toBe('استمع');
  });

  it('normalizes Alef Maqsura (ى) to Yeh (ي)', () => {
    expect(normalizeArabic('موسيقى')).toBe('موسيقي');
    expect(normalizeArabic('مستوى')).toBe('مستوي');
    expect(normalizeArabic('على')).toBe('علي');
  });

  it('normalizes Ta Marbuta (ة) to Heh (ه)', () => {
    expect(normalizeArabic('برمجة')).toBe('برمجه');
    expect(normalizeArabic('دورة')).toBe('دوره');
    expect(normalizeArabic('منصة')).toBe('منصه');
  });

  it('handles combined complex Arabic phrases with mixed diacritics, tatweel, and variants', () => {
    const phrase = 'دَوْرَةٌ تَدْرِيبِيَّةٌ فِي الْبَرْمَجَةِ الْمُتَقَدِّمَةِ وَالْـأَنْـظِـمَـةِ';
    const normalized = normalizeArabic(phrase);

    expect(normalized).toBe('دوره تدريبيه في البرمجه المتقدمه والانظمه');
  });

  it('matches searches whether user queries with or without diacritics', () => {
    const targetTitle = 'تطوير تطبيقات الويب باستخدام نست جي إس';
    const userQuery1 = 'تَطْوِيرُ تَطْبِيقَاتِ';
    const userQuery2 = 'تطوير تطبيقات';

    const normalizedTarget = normalizeArabic(targetTitle);
    const normalizedQ1 = normalizeArabic(userQuery1);
    const normalizedQ2 = normalizeArabic(userQuery2);

    expect(normalizedTarget).toContain(normalizedQ1);
    expect(normalizedTarget).toContain(normalizedQ2);
    expect(normalizedQ1).toBe(normalizedQ2);
  });

  it('matches searches with Alef or Ta Marbuta differences', () => {
    const targetTitle = 'برمجة النظم المتقدمة بإتقان';
    const userQuery1 = 'برمجه';
    const userQuery2 = 'باتقان';

    const normalizedTarget = normalizeArabic(targetTitle);
    expect(normalizedTarget).toContain(normalizeArabic(userQuery1));
    expect(normalizedTarget).toContain(normalizeArabic(userQuery2));
  });

  it('gracefully handles empty or non-Arabic strings', () => {
    expect(normalizeArabic('')).toBe('');
    expect(normalizeArabic('   ')).toBe('');
    expect(normalizeArabic('NestJS 11 & Next.js')).toBe('NestJS 11 & Next.js');
  });
});


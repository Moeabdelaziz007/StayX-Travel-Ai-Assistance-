'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ar';

interface Translations {
  [key: string]: {
    en: string;
    ar: string;
  };
}

const translations: Translations = {
  'app.name': { en: 'StayX', ar: 'ستاي إكس' },
  'nav.dashboard': { en: 'Dashboard', ar: 'لوحة التحكم' },
  'nav.trips': { en: 'My Trips', ar: 'رحلاتي' },
  'nav.planner': { en: 'Trip Planner', ar: 'مخطط الرحلات' },
  'nav.buddies': { en: 'Travel Buddies', ar: 'رفقاء السفر' },
  'nav.watch': { en: 'Watch Together', ar: 'شاهد معاً' },
  'nav.documents': { en: 'Document AI', ar: 'ذكاء الوثائق' },
  'nav.reviews': { en: 'Reviews', ar: 'المراجعات' },
  'nav.notifications': { en: 'Notifications', ar: 'التنبيهات' },
  'nav.smartget': { en: 'SmartGet', ar: 'سمارت جيت' },
  'common.loading': { en: 'Loading...', ar: 'جاري التحميل...' },
  'common.send': { en: 'Send', ar: 'إرسال' },
  'common.connect': { en: 'Connect', ar: 'اتصال' },
  'common.pass': { en: 'Pass', ar: 'تخطي' },
  'common.save': { en: 'Save', ar: 'حفظ' },
  'common.export': { en: 'Export', ar: 'تصدير' },
  'voice.connecting': { en: 'Connecting to Live API...', ar: 'جاري الاتصال بـ Live API...' },
  'voice.connected': { en: 'Connected! Speak now.', ar: 'متصل! تحدث الآن.' },
  'voice.mic_active': { en: 'Microphone Active', ar: 'الميكروفون نشط' },
  'voice.mic_inactive': { en: 'Microphone Inactive', ar: 'الميكروفون غير نشط' },
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang) setLanguage(savedLang);
  }, []);

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string) => {
    return translations[key]?.[language] || key;
  };

  const isRTL = language === 'ar';

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

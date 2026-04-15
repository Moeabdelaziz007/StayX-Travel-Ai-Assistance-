'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ar';

interface Translations {
  [key: string]: string;
}

const translations: Record<Language, Translations> = {
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.trips': 'My Trips',
    'nav.search': 'SmartGet',
    'nav.watch': 'Watch Room',
    'nav.notifications': 'Notifications',
    'nav.signout': 'Sign Out',
    'home.welcome': 'Welcome back',
    'home.traveler': 'Traveler',
    'home.subtitle': 'Your AI-powered travel ecosystem is ready.',
    'home.create_room': 'Create Voice Room',
    'home.room_title': 'Room Title',
    'home.create': 'Create',
    'watch.title': 'STAYTV',
    'watch.subtitle': 'Your personal travel entertainment hub.',
    'watch.connect_youtube': 'Connect YouTube',
    'watch.search_placeholder': 'Paste YouTube URL or search for travel vlogs...',
    'watch.search': 'SEARCH',
    'watch.up_next': 'Up Next',
    'watch.refresh': 'Refresh',
  },
  ar: {
    'nav.dashboard': 'لوحة القيادة',
    'nav.trips': 'رحلاتي',
    'nav.search': 'البحث الذكي',
    'nav.watch': 'غرفة المشاهدة',
    'nav.notifications': 'الإشعارات',
    'nav.signout': 'تسجيل الخروج',
    'home.welcome': 'مرحباً بعودتك',
    'home.traveler': 'أيها المسافر',
    'home.subtitle': 'نظام السفر الذكي الخاص بك جاهز.',
    'home.create_room': 'إنشاء غرفة صوتية',
    'home.room_title': 'عنوان الغرفة',
    'home.create': 'إنشاء',
    'watch.title': 'STAYTV',
    'watch.subtitle': 'مركز الترفيه الخاص بالسفر.',
    'watch.connect_youtube': 'ربط يوتيوب',
    'watch.search_placeholder': 'الصق رابط يوتيوب أو ابحث عن مدونات السفر...',
    'watch.search': 'بحث',
    'watch.up_next': 'التالي',
    'watch.refresh': 'تحديث',
  }
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang && (savedLang === 'en' || savedLang === 'ar')) {
      setLanguage(savedLang);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
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

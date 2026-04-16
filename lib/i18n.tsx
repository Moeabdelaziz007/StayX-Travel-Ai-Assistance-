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
    'home.welcome_name': 'Welcome back, {name}!',
    'home.where_to': 'Where are you traveling next?',
    'home.countdown_title': 'Next Adventure',
    'home.countdown_days': 'Days',
    'home.countdown_hours': 'Hours',
    'home.countdown_subtitle': 'Until takeoff',
    'home.section_welcome_title': 'Good Morning, {name}',
    'home.section_welcome_desc': 'Here is what is ahead for your upcoming travels.',
    'home.section_tools_title': 'Quick Actions',
    'home.section_tools_desc': 'One-tap access to your essential travel tools.',
    'home.section_plan_title': 'Logistics & Prep',
    'home.section_plan_desc': 'Stay organized with currency, visas, and progress tracking.',
    'home.section_explore_title': 'Discover & Inspire',
    'home.section_explore_desc': 'Explore trending spots and visualize your dream trip.',
    'home.section_community_title': 'The StayX Network',
    'home.section_community_desc': 'Connect with fellow explorers and regional experts.',
    'home.quick_search': 'Quick Search',
    'home.planner_pro': 'Planner Pro',
    'home.stay_tv': 'STAYTV',
    'home.buddies': 'Find Buddies',
    'home.dest.dubai': 'Dubai',
    'home.dest.paris': 'Paris',
    'home.dest.istanbul': 'Istanbul',
    'home.dest.bangkok': 'Bangkok',
    'stats.trending': 'Trending Now',
    'stats.best_deal': 'Best Deal Today',
    'stats.ai_recommend': 'AI Recommendation',
    'stats.dubai_price': 'Dubai from $299',
    'stats.profile_based': 'Based on your profile',
    'stats.deals_found': 'Deals Found',
    'stats.avg_price': 'Avg. Price',
    'stats.best_platform': 'Best Platform',
    'trips.quick_add': 'Quick Add',
    'trips.travel_tips': 'Today\'s Travel Tips',
    'trips.add_appointment': 'Add Appointment',
    'trips.title': 'Title',
    'trips.type': 'Type',
    'trips.time': 'Time',
    'trips.details': 'Details',
    'trips.price': 'Price',
    'trips.save': 'Save',
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
    'home.welcome_name': 'مرحباً بعودتك، {name}!',
    'home.where_to': 'إلى أين ستسافر المرة القادمة؟',
    'home.countdown_title': 'المغامرة القادمة',
    'home.countdown_days': 'أيام',
    'home.countdown_hours': 'ساعة',
    'home.countdown_subtitle': 'حتى موعد الإقلاع',
    'home.section_welcome_title': 'صباح الخير، {name}',
    'home.section_welcome_desc': 'إليك نظرة عامة على رحلاتك القادمة.',
    'home.section_tools_title': 'أدوات سريعة',
    'home.section_tools_desc': 'وصول سريع بضغطة واحدة لأهم أدوات السفر.',
    'home.section_plan_title': 'التخطيط والتحضير',
    'home.section_plan_desc': 'ابقَ منظماً مع أسعار العملات، التأشيرات، وتتبع التقدم.',
    'home.section_explore_title': 'اكتشف واستلهم',
    'home.section_explore_desc': 'استكشف الوجهات الرائجة ولوحات الإلهام.',
    'home.section_community_title': 'شبكة StayX',
    'home.section_community_desc': 'تواصل مع المسافرين الآخرين والخبراء الإقليميين.',
    'home.quick_search': 'البحث السريع',
    'home.planner_pro': 'المخطط المحترف',
    'home.stay_tv': 'STAYTV',
    'home.buddies': 'ابحث عن زملاء السفر',
    'home.dest.dubai': 'دبي',
    'home.dest.paris': 'باريس',
    'home.dest.istanbul': 'إسطنبول',
    'home.dest.bangkok': 'بانكوك',
    'stats.trending': 'الأكثر تداولاً الآن',
    'stats.best_deal': 'أفضل عرض اليوم',
    'stats.ai_recommend': 'توصية الذكاء الاصطناعي',
    'stats.dubai_price': 'دبي ابتداءً من $299',
    'stats.profile_based': 'بناءً على ملفك الشخصي',
    'stats.deals_found': 'العروض الموجودة',
    'stats.avg_price': 'متوسط السعر',
    'stats.best_platform': 'أفضل منصة',
    'trips.quick_add': 'إضافة سريعة',
    'trips.travel_tips': 'نصائح السفر اليوم',
    'trips.add_appointment': 'إضافة موعد',
    'trips.title': 'العنوان',
    'trips.type': 'النوع',
    'trips.time': 'الوقت',
    'trips.details': 'التفاصيل',
    'trips.price': 'السعر',
    'trips.save': 'حفظ',
  }
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('language') as Language;
      if (savedLang && (savedLang === 'en' || savedLang === 'ar')) {
        return savedLang;
      }
    }
    return 'en';
  });

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
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

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/ed67d976-cb1d-45ff-a2c6-22a8d3a44b0e

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
✨ StayX - AI-Powered Travel Assistant | مساعد السفر المدعوم بالذكاء الاصطناعي
Your Personal AI Travel Companion for Smarter Journey Planning رفيقك الشخصي الذكي لتخطيط الرحلات بشكل أفضل

Next.js React TypeScript Firebase Stripe License Node.js

📖 Table of Contents | جدول المحتويات
🎯 About | حول المشروع
🌟 Key Features | الميزات الرئيسية
🏗️ Architecture | البنية المعمارية
🛠️ Tech Stack | مكدس التكنولوجيا
📦 Installation | التثبيت
🚀 Quick Start | البدء السريع
📋 Configuration | التكوين
🗂️ Project Structure | هيكل المشروع
📱 Components Overview | نظرة عامة على المكونات
🔌 API Integration | تكامل واجهات برمجية
🔐 Authentication | المصادقة
💳 Payment Integration | معالجة الدفع
🎨 UI/UX | تصميم الواجهة
🚢 Deployment | النشر
🌱 Future Improvements | التحسينات المستقبلية
🤝 Contributing | المساهمة
📄 License | الترخيص
📞 Support | الدعم
🎯 About | حول المشروع
English: StayX is an AI-powered travel assistant that transforms the travel experience from planning to booking and beyond. The app uses intelligent voice interaction and AI itinerary generation to deliver personalized travel plans and on-demand destination guidance.

العربية: StayX هو مساعد سفر مدعوم بالذكاء الاصطناعي يحول تجربة السفر من التخطيط إلى الحجز وما بعده. يستخدم التطبيق التفاعل الصوتي الذكي وإنشاء جداول سفر مدعومة بالذكاء الاصطناعي لتقديم خطط سفر مخصصة وإرشادات فورية عن الوجهات.

🌟 Key Features | الميزات الرئيسية
English:

Voice-based travel planning with natural language support.
AI-generated itineraries with recommended attractions, meals, and timings.
Budget planning and cost breakdowns for flights, hotels, food, and activities.
Trip management with booking status, history, and notifications.
Destination intelligence including language, currency, weather, and safety.
Reviews, ratings, and AI summaries for destinations.
Responsive design optimized for mobile and desktop.
العربية:

تخطيط السفر صوتيًا باستخدام دعم اللغة الطبيعية.
إنشاء جداول رحلات بواسطة الذكاء الاصطناعي مع التوصيات للمعالم والطعام والمواعيد.
تخطيط الميزانية وتفصيل التكاليف للرحلات والفنادق والطعام والأنشطة.
إدارة الرحلات مع حالة الحجز وتاريخ الرحلة والإشعارات.
معلومات الوجهات بما في ذلك اللغة والعملات والطقس والسلامة.
مراجعات وتقييمات وملخصات مدعومة بالذكاء الاصطناعي.
تصميم متجاوب محسّن للجوال وسطح المكتب.
🏗️ Architecture | البنية المعمارية
English: The application is built with a modern Next.js frontend and Firebase backend, with AI-powered travel services and payment processing through Stripe.

العربية: تم بناء التطبيق بواجهة حديثة باستخدام Next.js وخلفية Firebase، مع خدمات سفر مدعومة بالذكاء الاصطناعي ومعالجة الدفع عبر Stripe.

Diagram:

┌─────────────────────────────────────────────────┐
│           Frontend (Next.js + React)            │
│  ┌─────────────────────────────────────────────┐│
│  │ Authentication (Firebase Auth)              ││
│  │ - Google Sign-In                             ││
│  │ - Session Management                         ││
│  └─────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────┐│
│  │ Core App Components                          ││
│  │ - Dashboard                                  ││
│  │ - Trip Planner                               ││
│  │ - Voice Assistant                            ││
│  │ - Reviews & Trips                            ││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
              ↓              ↓              ↓
        ┌─────────────┬──────────────┬──────────────┐
        │             │              │              │
   Google Gemini   Firebase       Stripe        External
      AI            Firestore      Payments      APIs
        │             │              │              │
        └─────────────┴──────────────┴──────────────┘
🛠️ Tech Stack | مكدس التكنولوجيا
English: StayX uses Next.js, React, TypeScript, Tailwind CSS, Firebase, and Stripe, with AI integration through Google Gemini.

العربية: يستخدم StayX Next.js وReact وTypeScript وTailwind CSS وFirebase وStripe، مع تكامل الذكاء الاصطناعي عبر Google Gemini.

Category	Technology	Version
Frontend	Next.js	15.4.9
UI	React	19.2.1
Language	TypeScript	5.9.3
Styling	Tailwind CSS	4.1.11
Components	Shadcn UI	4.2.0
AI	Google Gemini	1.17.0
Backend	Firebase	12.12.0
Database	Firestore	Real-time NoSQL
Auth	Firebase Auth	Multi-provider
Payments	Stripe	22.0.1
Charts	Recharts	3.8.1
Forms	React Hook Form	5.2.1
Dates	date-fns	4.1.0
Icons	Lucide React	0.553.0
Notifications	Sonner	2.0.7
Themes	Next Themes	0.4.6
Linting	ESLint	9.39.1
📦 Installation | التثبيت
English: Follow these steps to set up the project locally.

العربية: اتبع هذه الخطوات لإعداد المشروع محليًا.

Prerequisites | المتطلبات
Node.js v20 or later
npm or yarn
Firebase project with Firestore enabled
Google Cloud project for AI key
Stripe account for payments
Git
Step 1: Clone the repository | الخطوة 1: استنساخ المستودع
git clone https://github.com/yourusername/StayX-Travel-Ai-Assistance.git
cd StayX-Travel-Ai-Assistance
Step 2: Install dependencies | الخطوة 2: تثبيت الحزم
npm install
# or
# yarn install
Step 3: Environment variables | الخطوة 3: إعداد متغيرات البيئة
Create .env.local:

NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=your_stripe_public_key
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_API_URL=http://localhost:3000
🚀 Quick Start | البدء السريع
English: Run the app locally using npm.

العربية: شغّل التطبيق محليًا باستخدام npm.

npm run dev
Open http://localhost:3000

npm run build
npm run start
npm run lint
npm run clean
📋 Configuration | التكوين
English: Configure external services and environment variables for production.

العربية: قم بتكوين الخدمات الخارجية ومتغيرات البيئة للإنتاج.

Google Gemini
Create a Google AI key.
Add it to .env.local.
Firebase
Create a Firebase project.
Enable Firestore.
Enable Authentication (Google Sign-In).
Add Firebase config to .env.local.
Stripe
Create a Stripe account.
Add API keys.
Configure webhooks for payment verification.
🗂️ Project Structure | هيكل المشروع
English: The codebase is organized into app routes, components, utilities, hooks, and types.

العربية: تم تنظيم الكود إلى مسارات التطبيق، المكونات، الأدوات المساعدة، الخطافات، والأنواع.

app/
  layout.tsx
  page.tsx
  globals.css
  api/
    checkout/
      route.ts
    verify/
      route.ts
  destinations/
    [destination]/
      reviews/
        page.tsx
  planner/
    page.tsx
components/
  dashboard.tsx
  home-view.tsx
  login.tsx
  notifications-view.tsx
  search-compare-view.tsx
  trip-planner.tsx
  trips-view.tsx
  voice-assistant.tsx
  watch-room.tsx
  weather-widget.tsx
  documents/
    DocumentAnalyzer.tsx
  planner/
    ItineraryDisplay.tsx
    TripChat.tsx
  reviews/
    AISummary.tsx
    ReviewCard.tsx
    ReviewForm.tsx
  ui/
    accordion.tsx
    alert.tsx
    avatar.tsx
    badge.tsx
    button.tsx
    calendar.tsx
    card.tsx
    dialog.tsx
    input.tsx
    popover.tsx
    scroll-area.tsx
    select.tsx
    sheet.tsx
    skeleton.tsx
    sonner.tsx
    tabs.tsx
    textarea.tsx
  watch-room/
    WatchRoomSidebar.tsx
hooks/
  use-mobile.ts
  useTripPlanner.ts
lib/
  ai-summary.ts
  audio-utils.ts
  auth-context.tsx
  firebase.ts
  travel-tools.ts
  utils.ts
types/
  planner.ts
📱 Components Overview | نظرة عامة على المكونات
English: Major components include the dashboard, trip planner, voice assistant, and destination review views.

العربية: تشمل المكونات الرئيسية لوحة المعلومات ومخطط الرحلة والمساعد الصوتي وعرض مراجعات الوجهات.

Component	Purpose	Purpose in Arabic
Dashboard	Application hub	مركز التطبيق
Trip Planner	Plan and manage trips	تخطيط وإدارة الرحلات
Voice Assistant	Voice-enabled AI chat	مساعد صوتي مدعوم بالذكاء الاصطناعي
Trips View	Manage bookings and history	إدارة الحجوزات والتاريخ
Itinerary Display	Show daily plans	عرض البرنامج اليومي
Review Components	Destination ratings	تقييمات الوجهات
Weather Widget	Show destination weather	عرض حالة الطقس
Notifications	Booking alerts	تنبيهات الحجز
🔌 API Integration | تكامل واجهات برمجية
English: The app uses AI functions for itinerary generation and stores user data in Firestore.

العربية: يستخدم التطبيق وظائف الذكاء الاصطناعي لإنشاء البرامج ويخزن بيانات المستخدم في Firestore.

Sample functions | أمثلة على الوظائف
// Generate itinerary
generateTravelItinerary(destination, budget, duration, preferences)

// Destination insights
getDestinationInsights(destination)

// Personalized recommendations
getPersonalizedRecommendations(userProfile, destination)
Firestore Collections | مجموعات Firestore
users/ - User profiles and preferences | ملفات تعريف المستخدمين والتفضيلات
trips/ - Trip bookings and itineraries | حجوزات الرحلات والبرامج
reviews/ - Destination reviews | مراجعات الوجهات
bookings/ - Payment records | سجلات الدفع
🔐 Authentication | المصادقة
English: Firebase Authentication secures the app and stores user profiles in Firestore.

العربية: تؤمن Firebase Authentication التطبيق وتخزن ملفات تعريف المستخدمين في Firestore.

Provider: Firebase Auth | الموفر: Firebase Auth
Methods: Google Sign-In, Email/Password | الطرق: Google Sign-In، البريد الإلكتروني/كلمة المرور
Session: Token-based security | الجلسة: أمان قائم على الرموز
💳 Payment Integration | معالجة الدفع
English: Payments are handled through Stripe with secure checkout and webhook verification.

العربية: يتم معالجة الدفع عبر Stripe مع صفحة دفع آمنة والتحقق من webhook.

Provider: Stripe | الموفر: Stripe
Payment methods: Cards | طرق الدفع: بطاقات
Webhook verification | التحقق من webhook
Multi-currency support | دعم متعدد العملات
🎨 UI/UX | تصميم الواجهة
English: The UI is designed to be modern, responsive, and accessible.

العربية: تم تصميم واجهة المستخدم لتكون حديثة ومتجاوبة وسهلة الوصول.

Design system | نظام التصميم
Dark theme with green accents | سمة داكنة مع لمسات خضراء
Readable typography | طباعة قابلة للقراءة
Smooth animations | رسوم متحركة سلسة
Responsive breakpoints | نقاط الاستجابة
Mobile: 320px - 640px | الجوال: 320px - 640px
Tablet: 641px - 1024px | الجهاز اللوحي: 641px - 1024px
Desktop: 1025px+ | سطح المكتب: 1025px+
Accessibility | إمكانية الوصول
WCAG 2.1 friendly | متوافق مع WCAG 2.1
Keyboard navigation | دعم لوحة المفاتيح
Screen reader support | دعم قارئ الشاشة
🚢 Deployment | النشر
English: Deploy to Vercel, Firebase Hosting, or Docker.

العربية: انشر على Vercel أو Firebase Hosting أو Docker.

Vercel
npm install -g vercel
vercel
Firebase Hosting
firebase login
firebase init hosting
firebase deploy
Docker
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
🌱 Future Improvements | التحسينات المستقبلية
English: To make StayX more powerful and cover the full travel experience from A to Z, consider adding:

Free or low-cost AI options using open-source models or zero-cost APIs.
Flight and hotel search aggregation from multiple sources.
Local transport, tours, and activity booking support.
Currency conversion, expense tracker, and travel wallet.
Offline mode with cached itineraries and maps.
Real-time weather, flight status, and airport alerts.
Local safety, emergency contact, and health guidance.
Travel checklists and packing lists for every destination.
Multi-language support for chat and destination content.
Personalized recommendations based on traveler profile and history.
العربية: لجعل StayX أكثر قوة وتغطية لتجربة السفر من الألف إلى الياء، يجب إضافة:

خيارات ذكاء اصطناعي مجانية أو منخفضة التكلفة باستخدام نماذج مفتوحة المصدر أو واجهات برمجة تطبيقات مجانية.
تجميع بحث الرحلات الجوية والفنادق من مصادر متعددة.
دعم النقل المحلي، الجولات، وحجز الأنشطة.
تحويل العملات، تتبع المصاريف، ومحفظة السفر.
وضع عدم الاتصال مع جداول زمنية وخرائط مخزّنة.
الطقس الفوري، حالة الرحلات، وتنبيهات المطار.
نصائح السلامة المحلية، جهات الاتصال في الطوارئ، والإرشادات الصحية.
قوائم التحقق من السفر وقوائم التعبئة لكل وجهة.
دعم تعدد اللغات للدردشة ومحتوى الوجهات.
توصيات شخصية بناءً على ملف تعريف المسافر وتاريخه.
Zero-cost stack recommendations | توصيات المكدس بدون تكلفة
English: To reduce costs, use free-tier services and open-source alternatives:

Firebase Spark plan for hosting, auth, and Firestore.
Vercel Hobby or similar hosting free tier.
OpenStreetMap or free map APIs for location services.
Open-Meteo or other free weather APIs.
Open-source LLMs or community AI endpoints for chat.
Stripe test mode for development.
العربية: لتقليل التكاليف، استخدم الخدمات المجانية أو المفتوحة المصدر:

خطة Firebase Spark للاستضافة والمصادقة وFirestore.
استضافة مجانية مثل Vercel Hobby.
OpenStreetMap أو واجهات خرائط مجانية.
Open-Meteo أو واجهات طقس مجانية.
نماذج ذكاء اصطناعي مفتوحة المصدر للدردشة.
وضع الاختبار في Stripe أثناء التطوير.
🤝 Contributing | المساهمة
English: We welcome contributions to improve StayX in features, performance, and usability.

العربية: نرحب بالمساهمات لتحسين StayX في الميزات والأداء وسهولة الاستخدام.

Fork the repository | انسخ المستودع
Create a feature branch | أنشئ فرعًا جديدًا
Commit changes | التزم بالتغييرات
Push and open a PR | ادفع وافتح طلب دمج
Guidelines | إرشادات
Use TypeScript best practices.
Keep code clear and maintainable.
Add comments for complex logic.
Test before submit.
Update documentation.
📄 License | الترخيص
English: This project is licensed under the MIT License.

العربية: هذا المشروع مرخّص بموجب رخصة MIT.

See LICENSE for details.

📞 Support | الدعم
English: Questions, bug reports, and feature requests are welcome.

العربية: الأسئلة، البلاغات عن الأخطاء، وطلبات الميزات مرحب بها.

Email: support@stayx.dev
Issues: https://github.com/yourusername/StayX-Travel-Ai-Assistance/issues
Discussions: https://github.com/yourusername/StayX-Travel-Ai-Assistance/discussions
Docs: https://docs.stayx.dev
### Made with ❤️ by the StayX Team | تم إنشاؤه بـ ❤️ بواسطة فريق StayX
English: Questions? Found a bug? Want to contribute? Open an issue or reach out. العربية: هل لديك أسئلة؟ وجدت خطأ؟ تريد المساهمة؟ افتح مشكلة أو تواصل معنا.

⭐ Please star the repository if you find it useful! | ⭐ إذا وجدت المستودع مفيدًا، فضلاً ضع نجمة!

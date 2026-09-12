export type Lang = 'de' | 'leicht' | 'en' | 'tr' | 'ar';
export const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
];

const de = {
  'tab.discover': 'Entdecken',
  'tab.act': 'Handeln',
  'tab.impact': 'Impact',
  'tab.together': 'Gemeinsam',
  'tab.profile': 'Profil',
  'home.greeting': 'Hallo',
  'home.nearby': 'In deiner Nähe',
  'home.all': 'Alles',
  'act.title': 'Was möchtest du heute tun?',
  'act.ride': 'Fahrt starten',
  'act.ride.sub': 'Bus & Bahn bewusst tracken',
  'act.reuse': 'Mehrweg',
  'act.reuse.sub': 'Ausleihen und zurückbringen',
  'act.food': 'Lebensmittel retten',
  'act.food.sub': 'Fairteiler, Körbe, Verteilungen',
  'act.clean': 'Sauberes Frankfurt',
  'act.clean.sub': 'Clean-ups, Melden, Lernen',
  'act.learn': 'Lernen',
  'act.learn.sub': 'Kurze Kapitel mit Kai',
  'week.goal': 'Wochenziel',
  'week.days': 'aktive Tage',
  'impact.title': 'Dein Impact',
  'impact.co2': 'CO₂ vermieden',
  'impact.food': 'Lebensmittel gerettet',
  'impact.packaging': 'Einweg vermieden',
  'impact.km': 'nachhaltige km',
  'impact.estimated': 'Schätzung',
  'together.title': 'Frankfurt gemeinsam',
  'profile.points': 'Blätter',
  'profile.rewards': 'Belohnungen',
  'profile.lose': 'Lose',
  'why.title': 'Warum diese Punkte?',
  'privacy.recording': 'Aufzeichnung läuft',
  'common.stop': 'Beenden',
  'common.start': 'Starten',
  'common.back': 'Zurück',
  'common.next': 'Weiter',
  'common.done': 'Fertig',
  'common.cancel': 'Abbrechen',
  'common.demo': 'Demo-Daten',
  'onb.1.title': 'Frankfurt, gemeinsam.',
  'onb.1.body': 'Bus, Mehrweg, Lebensmittel und saubere Straßen in einer App.\nDu siehst, was in deiner Nähe möglich ist.',
  'onb.2.title': 'Ehrlich statt abstrakt.',
  'onb.2.body': 'Jede Aktion bekommt einen Nachweis-Status und eine Begründung. Du siehst immer, warum Punkte entstehen.',
  'onb.3.title': 'Dein Standort gehört dir.',
  'onb.3.body': 'GPS nur, wenn du eine Fahrt bewusst startest.\nKein Hintergrund-Tracking, keine exakten Adressen.',
  'onb.name': 'Wie sollen wir dich nennen?',
  'onb.start': 'Los geht’s',
};
type Key = keyof typeof de;

const leicht: Partial<Record<Key, string>> = {
  'tab.discover': 'Karte', 'tab.act': 'Machen', 'tab.impact': 'Wirkung', 'tab.together': 'Zusammen', 'tab.profile': 'Ich',
  'act.title': 'Was willst du heute machen?',
  'act.ride': 'Bus oder Bahn fahren', 'act.ride.sub': 'Fahrt starten und Punkte bekommen',
  'act.reuse': 'Mehrweg-Schale', 'act.reuse.sub': 'Schale ausleihen. Schale zurückbringen.',
  'act.food': 'Essen retten', 'act.food.sub': 'Essen holen oder Essen teilen',
  'act.clean': 'Stadt sauber machen', 'act.clean.sub': 'Mitmachen. Melden. Lernen.',
  'act.learn': 'Lernen', 'act.learn.sub': 'Kurze Fragen mit Kai',
  'week.goal': 'Ziel für die Woche', 'week.days': 'Tage aktiv',
  'impact.title': 'Das hast du geschafft', 'impact.co2': 'Weniger CO₂', 'impact.food': 'Essen gerettet', 'impact.packaging': 'Müll vermieden', 'impact.km': 'Kilometer',
  'impact.estimated': 'ungefähr', 'together.title': 'Frankfurt zusammen', 'profile.points': 'Blätter', 'profile.rewards': 'Prämien',
  'why.title': 'Warum bekomme ich Punkte?', 'privacy.recording': 'Die App merkt sich jetzt den Weg',
  'onb.1.title': 'Frankfurt. Zusammen.', 'onb.1.body': 'Bus. Mehrweg. Essen. Saubere Straßen. Alles in einer App.',
  'onb.2.title': 'Alles wird erklärt.', 'onb.2.body': 'Du siehst immer, warum du Punkte bekommst.',
  'onb.3.title': 'Dein Ort bleibt privat.', 'onb.3.body': 'Die App schaut nur auf deinen Ort, wenn du eine Fahrt startest.',
  'onb.name': 'Wie heißt du?', 'onb.start': 'Los',
};

const en: Partial<Record<Key, string>> = {
  'tab.discover': 'Discover', 'tab.act': 'Act', 'tab.impact': 'Impact', 'tab.together': 'Together', 'tab.profile': 'Profile',
  'home.greeting': 'Hi', 'home.nearby': 'Near you', 'home.all': 'All',
  'act.title': 'What do you want to do today?', 'act.ride': 'Start a ride', 'act.ride.sub': 'Track bus & train consciously',
  'act.reuse': 'Reusables', 'act.reuse.sub': 'Borrow and return', 'act.food': 'Rescue food', 'act.food.sub': 'Share points, baskets, handouts',
  'act.clean': 'Clean Frankfurt', 'act.clean.sub': 'Clean-ups, reports, learning', 'act.learn': 'Learn', 'act.learn.sub': 'Short chapters with Kai',
  'week.goal': 'Weekly goal', 'week.days': 'active days', 'impact.title': 'Your impact', 'impact.co2': 'CO₂ avoided', 'impact.food': 'Food rescued',
  'impact.packaging': 'Single-use avoided', 'impact.km': 'sustainable km', 'impact.estimated': 'estimate', 'together.title': 'Frankfurt together',
  'profile.points': 'Leaves', 'profile.rewards': 'Rewards', 'profile.lose': 'Tickets', 'why.title': 'Why these points?', 'privacy.recording': 'Recording',
  'common.stop': 'Stop', 'common.start': 'Start', 'common.back': 'Back', 'common.next': 'Next', 'common.done': 'Done', 'common.cancel': 'Cancel', 'common.demo': 'Demo data',
  'onb.1.title': 'Frankfurt, together.', 'onb.1.body': 'Transit, reusables, food and clean streets in one app. See what is possible near you.',
  'onb.2.title': 'Honest, not abstract.', 'onb.2.body': 'Every action gets a verification status and a reason. You always see why points happen.',
  'onb.3.title': 'Your location is yours.', 'onb.3.body': 'GPS only when you consciously start a ride. No background tracking, no exact addresses.',
  'onb.name': 'What should we call you?', 'onb.start': 'Let’s go',
};

const tr: Partial<Record<Key, string>> = {
  'tab.discover': 'Keşfet', 'tab.act': 'Harekete geç', 'tab.impact': 'Etki', 'tab.together': 'Birlikte', 'tab.profile': 'Profil',
  'home.greeting': 'Merhaba', 'home.nearby': 'Yakınında', 'home.all': 'Hepsi',
  'act.title': 'Bugün ne yapmak istersin?', 'act.ride': 'Yolculuk başlat', 'act.ride.sub': 'Otobüs ve treni bilinçli takip et',
  'act.reuse': 'Tekrar kullanım', 'act.reuse.sub': 'Ödünç al ve geri getir', 'act.food': 'Gıda kurtar', 'act.food.sub': 'Paylaşım noktaları, sepetler',
  'act.clean': 'Temiz Frankfurt', 'act.clean.sub': 'Temizlik, bildirim, öğrenme', 'act.learn': 'Öğren', 'act.learn.sub': 'Kai ile kısa bölümler',
  'week.goal': 'Haftalık hedef', 'week.days': 'aktif gün', 'impact.title': 'Etkin', 'impact.co2': 'Önlenen CO₂', 'impact.food': 'Kurtarılan gıda',
  'impact.packaging': 'Önlenen tek kullanımlık', 'impact.km': 'sürdürülebilir km', 'impact.estimated': 'tahmin', 'together.title': 'Frankfurt birlikte',
  'profile.points': 'Yaprak', 'profile.rewards': 'Ödüller', 'profile.lose': 'Bilet', 'why.title': 'Bu puanlar neden?', 'privacy.recording': 'Kayıt sürüyor',
  'common.stop': 'Bitir', 'common.start': 'Başlat', 'common.back': 'Geri', 'common.next': 'İleri', 'common.done': 'Tamam', 'common.cancel': 'İptal', 'common.demo': 'Demo verisi',
  'onb.1.title': 'Frankfurt, birlikte.', 'onb.1.body': 'Toplu taşıma, tekrar kullanım, gıda ve temiz sokaklar tek uygulamada.',
  'onb.2.title': 'Dürüst, soyut değil.', 'onb.2.body': 'Her eylemin bir doğrulama durumu ve gerekçesi var.',
  'onb.3.title': 'Konumun sana ait.', 'onb.3.body': 'GPS yalnızca sen bir yolculuk başlattığında.',
  'onb.name': 'Sana nasıl hitap edelim?', 'onb.start': 'Başlayalım',
};

const ar: Partial<Record<Key, string>> = {
  'tab.discover': 'استكشف', 'tab.act': 'تحرّك', 'tab.impact': 'الأثر', 'tab.together': 'معًا', 'tab.profile': 'حسابي',
  'home.greeting': 'مرحبًا', 'home.nearby': 'بالقرب منك', 'home.all': 'الكل',
  'act.title': 'ماذا تريد أن تفعل اليوم؟', 'act.ride': 'ابدأ رحلة', 'act.ride.sub': 'تتبّع الحافلة والقطار بوعي',
  'act.reuse': 'إعادة الاستخدام', 'act.reuse.sub': 'استعر وأعد', 'act.food': 'أنقذ الطعام', 'act.food.sub': 'نقاط المشاركة والسلال',
  'act.clean': 'فرانكفورت نظيفة', 'act.clean.sub': 'تنظيف، إبلاغ، تعلّم', 'act.learn': 'تعلّم', 'act.learn.sub': 'فصول قصيرة مع كاي',
  'week.goal': 'هدف الأسبوع', 'week.days': 'أيام نشطة', 'impact.title': 'أثرك', 'impact.co2': 'CO₂ تم تجنبه', 'impact.food': 'طعام تم إنقاذه',
  'impact.packaging': 'عبوات تم تجنبها', 'impact.km': 'كم مستدامة', 'impact.estimated': 'تقدير', 'together.title': 'فرانكفورت معًا',
  'profile.points': 'أوراق', 'profile.rewards': 'مكافآت', 'profile.lose': 'تذاكر', 'why.title': 'لماذا هذه النقاط؟', 'privacy.recording': 'التسجيل جارٍ',
  'common.stop': 'إنهاء', 'common.start': 'ابدأ', 'common.back': 'رجوع', 'common.next': 'التالي', 'common.done': 'تم', 'common.cancel': 'إلغاء', 'common.demo': 'بيانات تجريبية',
  'onb.1.title': 'فرانكفورت، معًا.', 'onb.1.body': 'المواصلات وإعادة الاستخدام والطعام والشوارع النظيفة في تطبيق واحد.',
  'onb.2.title': 'صدق لا تجريد.', 'onb.2.body': 'كل إجراء له حالة تحقق وسبب واضح.',
  'onb.3.title': 'موقعك ملكك.', 'onb.3.body': 'GPS فقط عندما تبدأ رحلة بوعي.',
  'onb.name': 'ماذا نناديك؟', 'onb.start': 'هيا بنا',
};

const DICT: Record<Lang, Partial<Record<Key, string>>> = { de, leicht, en, tr, ar };

export function translate(lang: Lang, key: Key): string {
  return DICT[lang]?.[key] ?? de[key] ?? key;
}
export type { Key as TKey };

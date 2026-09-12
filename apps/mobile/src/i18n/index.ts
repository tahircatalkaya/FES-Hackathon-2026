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
  'onb.1.title': 'Hallo, ich bin Kai.',
  'onb.1.body': 'Ich bin ein Chamäleon und Frankfurt ist mein Zuhause.\nHilfst du mir, meinen Lebensraum zu schützen und zu verbessern?',
  'onb.2.title': 'Gemeinsam entdecken wir Frankfurt.',
  'onb.2.body': 'Bus fahren, Mehrweg nutzen, Lebensmittel retten und Straßen sauber halten helfen meinem Zuhause.\nIch zeige dir, was du in deiner Nähe tun kannst.',
  'onb.3.title': 'Jede gute Tat zählt.',
  'onb.3.body': 'Gemeinsam machen wir meinen Lebensraum Schritt für Schritt besser und geben der Natur in Frankfurt mehr Raum.\nDein Standort bleibt dabei geschützt und gehört immer dir.',
  'onb.name': 'Wie darf Kai dich nennen?',
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
  'onb.1.title': 'Hallo. Ich bin Kai.', 'onb.1.body': 'Ich bin ein Chamäleon.\nFrankfurt ist mein Zuhause.\nHilfst du mir?',
  'onb.2.title': 'Wir helfen Frankfurt.', 'onb.2.body': 'Wir fahren Bus oder Bahn.\nWir nutzen Mehrweg.\nWir retten Essen.\nWir halten Straßen sauber.',
  'onb.3.title': 'Jede gute Tat zählt.', 'onb.3.body': 'Wir machen mein Zuhause besser.\nWir geben der Natur in Frankfurt mehr Platz.\nDein Standort bleibt geschützt.',
  'onb.name': 'Wie soll Kai dich nennen?', 'onb.start': 'Los',
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
  'onb.1.title': 'Hello, I am Kai.', 'onb.1.body': 'I am a chameleon, and Frankfurt is my home.\nWill you help me protect and improve my habitat?',
  'onb.2.title': 'Let us explore Frankfurt together.', 'onb.2.body': 'Taking public transport, using reusables, rescuing food and keeping streets clean help my home.\nI will show you what you can do nearby.',
  'onb.3.title': 'Every good deed counts.', 'onb.3.body': 'Together, we can improve my habitat step by step and give nature more room in Frankfurt.\nYour location stays protected and always belongs to you.',
  'onb.name': 'What should Kai call you?', 'onb.start': 'Let’s go',
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
  'onb.1.title': 'Merhaba, ben Kai.', 'onb.1.body': 'Ben bir bukalemunum ve Frankfurt benim evim.\nYaşam alanımı korumama ve iyileştirmeme yardım eder misin?',
  'onb.2.title': 'Frankfurt’u birlikte keşfedelim.', 'onb.2.body': 'Toplu taşıma, yeniden kullanılabilir kaplar, yiyecek kurtarmak ve temiz sokaklar evime yardımcı olur.\nYakınında neler yapabileceğini sana göstereceğim.',
  'onb.3.title': 'Her iyi davranış önemlidir.', 'onb.3.body': 'Birlikte yaşam alanımı adım adım iyileştirip Frankfurt’ta doğaya daha fazla yer açabiliriz.\nKonumun korunur ve her zaman sana aittir.',
  'onb.name': 'Kai sana nasıl hitap etsin?', 'onb.start': 'Başlayalım',
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
  'onb.1.title': 'مرحبًا، أنا كاي.', 'onb.1.body': 'أنا حرباء، وفرانكفورت هي موطني.\nهل تساعدني في حماية موطني وتحسينه؟',
  'onb.2.title': 'لنكتشف فرانكفورت معًا.', 'onb.2.body': 'استخدام المواصلات والعبوات متعددة الاستخدام وإنقاذ الطعام والحفاظ على نظافة الشوارع يساعد موطني.\nسأريك ما يمكنك فعله بالقرب منك.',
  'onb.3.title': 'كل عمل جيد له أثر.', 'onb.3.body': 'معًا نستطيع تحسين موطني خطوة بخطوة ومنح الطبيعة مساحة أكبر في فرانكفورت.\nيبقى موقعك محميًا وملكًا لك دائمًا.',
  'onb.name': 'بأي اسم يناديك كاي؟', 'onb.start': 'هيا بنا',
};

const DICT: Record<Lang, Partial<Record<Key, string>>> = { de, leicht, en, tr, ar };

export function translate(lang: Lang, key: Key): string {
  return DICT[lang]?.[key] ?? de[key] ?? key;
}
export type { Key as TKey };

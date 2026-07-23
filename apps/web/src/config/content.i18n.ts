import type { Locale } from "@/locales";
import type { ContentBlock } from "./content";
import { profileSections, profileStats, legalIdentity } from "./content";

/**
 * English and Arabic renderings of the public-facing prose.
 *
 * The public pages are server components, so this is resolved from the
 * `app-locale` cookie on the server (see lib/server-locale.ts) rather than
 * through the client `useI18n` hook. Indonesian stays in content.ts and is
 * imported here rather than copied, so the source of record does not fork.
 *
 * WHAT IS DELIBERATELY NOT TRANSLATED, and why:
 *
 * - **Leaders' mottos.** Each is an Indonesian rendering of a hadith, chosen
 *   by a named living person. Producing Arabic from the Indonesian would yield
 *   wording that *looks* like the original narration but is my reconstruction
 *   of it — a fabricated religious quotation attributed to the Prophet ﷺ and
 *   published under someone's photograph. content.ts already warns "Do not
 *   invent quotes"; this is the sharpest case of it. They render in Indonesian
 *   in every locale until someone supplies the authentic Arabic text.
 *
 * - **Proper nouns and domain terms.** "Pesantren", "Tahfidz", "Santri",
 *   "SPMB", "Musyrif", "Markaz Annur", and the unit names (SD IT, SMA Qur'an)
 *   stay as they are, with a short gloss on first use. They are the
 *   institution's own vocabulary, and the system uses these terms throughout;
 *   translating them here would make the public site and the app disagree.
 *
 * - **Legal identifiers.** Decree numbers, the ministry's name, and the
 *   verifying bodies are facts on a document. The ministry name is given in
 *   English with the Indonesian original alongside, never replaced.
 */

export interface PublicContent {
  /** Page chrome for /profil — heading, standfirst, and the closing link. */
  profilePage: {
    title: string;
    /** <title> is `${title} — ${legalName}`; this is the search snippet. */
    metaDescription: string;
    lead: (markaz: string, year: number) => string;
    leadershipPrompt: string;
    leadershipLink: string;
  };
  profileSections: ContentBlock[];
  profileStats: Array<{ label: string; value: string }>;
  legalIdentity: {
    decree: { title: string; authority: string; description: string };
    verification: { title: string; description: string };
    /** Headings inside the two cards, and the closing governance paragraph. */
    sectionTitle: string;
    decreeNumberLabel: string;
    issuedByLabel: string;
    verifiedBadge: string;
    /** Alt text for a verifier's wordmark, e.g. "Verified by Goodstack". */
    verifiedByAlt: (verifier: string) => string;
    /** Homepage strip, which shows the same facts in one condensed row. */
    stripHeading: string;
    incorporationLabel: string;
    moreLink: string;
    governance: string;
    transparency: string;
  };
}

/**
 * Latin digits to Arabic-Indic, for figures rendered inside Arabic prose.
 *
 * The Arabic stats block is already written with ١٩١١ and ٨٠٠; interpolating
 * `siteConfig.establishedYear` raw would put "1911" in the standfirst directly
 * above "١٩١١" in the card beneath it. Applied only where a number sits in
 * running Arabic text — never to the decree number or the NPWP, which are
 * identifiers to be transcribed exactly as issued.
 */
function toArabicDigits(value: number | string): string {
  return String(value).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}

const EN: PublicContent = {
  profilePage: {
    title: "About Pesantren Cipansor",
    metaDescription:
      "The history, vision, and structure of Yayasan Pesantren Cipansor: an integrated Islamic boarding school in Kabupaten Tasikmalaya, established in 1911, with five educational units.",
    lead: (markaz, year) =>
      `${markaz} — an integrated Islamic boarding school (pesantren) in Kabupaten Tasikmalaya, West Java, established in ${year}.`,
    leadershipPrompt: "Would you like to meet the teachers and unit heads?",
    leadershipLink: "See the leadership",
  },
  profileSections: [
    {
      type: "p",
      text: "Yayasan Pesantren Cipansor is a nonprofit Islamic educational foundation in Kabupaten Tasikmalaya, West Java, operating under Markaz Annur. We provide boarding education that balances intellectual progress with strength of character, guided by the Qur'an and the Sunnah.",
    },
    { type: "h2", text: "A Short History" },
    {
      type: "p",
      text: "Cipansor was founded in 1911. What began as informal Qur'an study among the people of Kampung Nyalindung grew into an integrated institution that today spans five levels, from kindergarten through to advanced tahfidz (Qur'an memorisation) programmes.",
    },
    {
      type: "p",
      text: 'The name "Cipansor" itself carries a prayer: water that flows and gives shelter. The hope is that the benefit of the knowledge born here keeps flowing to our santri (boarding students), their families, and the surrounding community.',
    },
    { type: "h2", text: "Vision" },
    {
      type: "p",
      text: "To raise a Qur'anic generation that is both capable and self-reliant.",
    },
    { type: "h2", text: "How That Vision Is Put Into Practice" },
    {
      type: "ul",
      items: [
        "Qur'anic — memorisation and recitation are taught daily through an unbroken chain of transmission (sanad), with correct pronunciation (tahsin) valued ahead of the number of chapters memorised.",
        "Capable — the full national curriculum is taught alongside classical Islamic texts (kitab kuning), Arabic, and English.",
        "Self-reliant — boarding life, the student organisation, and enterprise training teach santri to look after themselves and take responsibility.",
      ],
    },
    { type: "h2", text: "Five Educational Units" },
    {
      type: "p",
      text: "Cipansor's levels connect to one another, so a student can complete their entire schooling within one consistent environment.",
    },
  ],
  profileStats: [
    { label: "Founded", value: "1911" },
    { label: "Santri", value: "±800" },
    { label: "Teaching staff", value: "60" },
    { label: "Educational units", value: "5" },
  ],
  legalIdentity: {
    decree: {
      title: "Legal Incorporation",
      authority:
        "Ministry of Law and Human Rights of the Republic of Indonesia (Kementerian Hukum dan Hak Asasi Manusia RI)",
      description:
        "Yayasan Pesantren Cipansor is a legally incorporated foundation, established by decree of the Minister of Law and Human Rights of the Republic of Indonesia.",
    },
    verification: {
      title: "Nonprofit Status Verification",
      description:
        "Yayasan Pesantren Cipansor's nonprofit status has been independently verified by Goodstack and TechSoup — two international nonprofit-verification bodies used by global social programmes to confirm that an organisation is genuine.",
    },
    sectionTitle: "Legal Standing & Accountability",
    decreeNumberLabel: "Decree number",
    issuedByLabel: "Issued by",
    verifiedBadge: "Nonprofit status verified",
    verifiedByAlt: (v) => `Verified by ${v}`,
    stripHeading: "Legal standing and accountability",
    incorporationLabel: "Incorporation",
    moreLink: "More on legal standing & accountability",
    governance:
      "As an incorporated foundation, Pesantren Cipansor is run by the three organs Indonesian law requires: the Pembina (board of trustees), the Pengurus (executive board), and the Pengawas (board of supervisors). Separating those roles keeps decision-making, day-to-day management, and oversight on distinct tracks.",
    transparency:
      "Every donation entrusted to us is managed transparently and disbursed according to the programme agreement the donor selected, with disbursement reports updated regularly.",
  },
};

const AR: PublicContent = {
  profilePage: {
    title: "نبذة عن معهد سيبانسور",
    metaDescription:
      "تاريخ مؤسسة معهد سيبانسور ورؤيتها وهيكلها: معهد إسلامي داخلي متكامل في منطقة تاسيكمالايا، تأسّس عام ١٩١١م، ويضمّ خمس وحدات تعليمية.",
    lead: (markaz, year) =>
      `${markaz} — معهد إسلامي داخلي متكامل (بيسانترين) في منطقة تاسيكمالايا بجاوة الغربية، تأسّس عام ${toArabicDigits(year)}م.`,
    leadershipPrompt: "أتودّ التعرّف على المشايخ ورؤساء الوحدات؟",
    leadershipLink: "عرض الهيئة القيادية",
  },
  profileSections: [
    {
      type: "p",
      text: "مؤسسة معهد سيبانسور (Yayasan Pesantren Cipansor) مؤسسة تعليمية إسلامية غير ربحية في منطقة تاسيكمالايا بجاوة الغربية، تعمل تحت مركز النور. نقدّم تعليماً داخلياً يوازن بين التقدّم العلمي وحسن الخلق وفق القرآن والسنّة.",
    },
    { type: "h2", text: "نبذة تاريخية" },
    {
      type: "p",
      text: "تأسّس سيبانسور عام ١٩١١م. بدأ حلقةَ تعليمٍ بسيطة بين أهالي قرية نيالندونغ، ثم نما ليصبح مؤسسة تعليمية متكاملة تضمّ اليوم خمس مراحل، من رياض الأطفال إلى برامج التحفيظ المتقدّمة.",
    },
    {
      type: "p",
      text: 'واسم "سيبانسور" نفسه يحمل دعاءً: ماءٌ يجري ويُظلّ. والرجاء أن يظلّ نفع العلم المولود هنا جارياً إلى الطلاب (السانتري) وأسرهم والمجتمع من حولهم.',
    },
    { type: "h2", text: "الرؤية" },
    {
      type: "p",
      text: "إعداد جيل قرآني ذكيّ ومعتمد على نفسه.",
    },
    { type: "h2", text: "كيف تُترجَم هذه الرؤية عملياً" },
    {
      type: "ul",
      items: [
        "قرآني — يُعتنى بالحفظ والتلاوة يومياً بسندٍ متّصل، مع تقديم إتقان التجويد (التحسين) على كثرة المحفوظ.",
        "ذكيّ — يُدرَّس المنهج الوطني كاملاً إلى جانب دراسة الكتب التراثية واللغة العربية والإنجليزية.",
        "معتمد على نفسه — الحياة الداخلية ومنظمة الطلاب والتدريب على ريادة الأعمال تُعوّد الطالب على رعاية شؤونه وتحمّل المسؤولية.",
      ],
    },
    { type: "h2", text: "خمس وحدات تعليمية" },
    {
      type: "p",
      text: "مراحل سيبانسور متّصلة بعضها ببعض، فيستطيع الطالب أن يُتمّ مسيرته الدراسية كاملة في بيئة تربوية واحدة متّسقة.",
    },
  ],
  profileStats: [
    { label: "سنة التأسيس", value: "١٩١١" },
    { label: "الطلاب", value: "±٨٠٠" },
    { label: "الهيئة التدريسية", value: "٦٠" },
    { label: "الوحدات التعليمية", value: "٥" },
  ],
  legalIdentity: {
    decree: {
      title: "الاعتماد القانوني",
      authority:
        "وزارة القانون وحقوق الإنسان بجمهورية إندونيسيا (Kementerian Hukum dan Hak Asasi Manusia RI)",
      description:
        "مؤسسة معهد سيبانسور مؤسسة مُسجَّلة قانونياً، أُنشئت بقرار من وزير القانون وحقوق الإنسان بجمهورية إندونيسيا.",
    },
    verification: {
      title: "التحقّق من الصفة غير الربحية",
      description:
        "تم التحقّق من الصفة غير الربحية لمؤسسة معهد سيبانسور بصورة مستقلّة من قِبَل Goodstack و TechSoup، وهما جهتان دوليتان للتحقّق من المنظمات غير الربحية تعتمد عليهما برامج اجتماعية عالمية للتأكّد من صحّة وضع المؤسسة.",
    },
    sectionTitle: "الوضع القانوني والمساءلة",
    decreeNumberLabel: "رقم القرار",
    issuedByLabel: "جهة الإصدار",
    verifiedBadge: "صفة غير ربحية مُوثَّقة",
    verifiedByAlt: (v) => `موثَّق من قِبَل ${v}`,
    stripHeading: "الوضع القانوني والمساءلة",
    incorporationLabel: "الشخصية الاعتبارية",
    moreLink: "المزيد عن الوضع القانوني والمساءلة",
    governance:
      "بوصفها مؤسسة ذات شخصية اعتبارية، يُدار معهد سيبانسور بثلاثة أجهزة يوجبها القانون الإندونيسي: مجلس الأمناء (Pembina)، والمجلس التنفيذي (Pengurus)، ومجلس الرقابة (Pengawas). ويضمن الفصل بين هذه الأدوار أن يسير اتخاذ القرار والإدارة اليومية والرقابة في مسارات منفصلة.",
    transparency:
      "كل تبرّع يُؤتمَن عليه يُدار بشفافية ويُصرَف وفق عقد البرنامج الذي اختاره المتبرّع، مع تقارير صرف تُحدَّث دورياً.",
  },
};

/** Indonesian is the source of record, read straight from content.ts. */
const ID: PublicContent = {
  profilePage: {
    title: "Profil Pesantren Cipansor",
    metaDescription:
      "Sejarah, visi, dan struktur Yayasan Pesantren Cipansor: lembaga pendidikan Islam terpadu di Kabupaten Tasikmalaya yang berdiri sejak 1911 dan menaungi lima unit pendidikan.",
    lead: (markaz, year) =>
      `${markaz} — lembaga pendidikan Islam terpadu di Kabupaten Tasikmalaya, berdiri sejak ${year}.`,
    leadershipPrompt: "Ingin mengenal para pengasuh dan kepala unit?",
    leadershipLink: "Lihat jajaran pimpinan",
  },
  profileSections,
  profileStats,
  legalIdentity: {
    decree: {
      title: legalIdentity.decree.title,
      authority: legalIdentity.decree.authority,
      description: legalIdentity.decree.description,
    },
    verification: {
      title: legalIdentity.verification.title,
      description: legalIdentity.verification.description,
    },
    sectionTitle: "Legalitas & Akuntabilitas",
    decreeNumberLabel: "Nomor keputusan",
    issuedByLabel: "Diterbitkan oleh",
    verifiedBadge: "Status nirlaba terverifikasi",
    verifiedByAlt: (v) => `Terverifikasi oleh ${v}`,
    stripHeading: "Legalitas dan akuntabilitas",
    incorporationLabel: "Badan hukum",
    moreLink: "Selengkapnya tentang legalitas & akuntabilitas",
    governance: legalIdentity.governance,
    transparency: legalIdentity.transparency,
  },
};

const BY_LOCALE: Record<Locale, PublicContent> = { id: ID, en: EN, ar: AR };

export function publicContentFor(locale: Locale): PublicContent {
  return BY_LOCALE[locale] ?? ID;
}

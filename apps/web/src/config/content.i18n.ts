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
  /**
   * /profil/legalitas — the page that answers "does this organisation really
   * operate this domain?".
   *
   * Google for Nonprofits declined the application a second time on identity
   * rather than content: they could not confirm the relationship between
   * Yayasan Pesantren Cipansor and cipansor.or.id. The facts needed to confirm
   * it were already on the site but scattered — the decree number in a strip on
   * the homepage, the address in the footer, the governance sentence at the
   * bottom of /profil — and the domain relationship was stated nowhere at all.
   *
   * This block gathers them onto one URL that can be sent to a reviewer.
   * Labels and prose live here; every number, hostname and address is read from
   * `siteConfig` and `legalIdentity` at render time, because those are facts on
   * a document and copying them per locale is how they drift.
   */
  transparencyPage: {
    title: string;
    metaDescription: string;
    lead: string;
    identity: {
      heading: string;
      legalNameLabel: string;
      legalFormLabel: string;
      legalFormValue: string;
      decreeLabel: string;
      issuedByLabel: string;
      establishedLabel: string;
      addressLabel: string;
      markazLabel: string;
    };
    domains: {
      heading: string;
      intro: string;
      canonicalRole: string;
      /**
       * Why the registration itself is evidence.
       *
       * `.or.id` is not an open TLD: PANDI requires incorporation documents in
       * the applicant organisation's name. That makes the domain's existence a
       * document-checked fact rather than a claim this site makes about itself,
       * which is the strongest thing on the page.
       */
      registryNote: string;
      emailNote: (email: string) => string;
    };
    governance: {
      heading: string;
      officersIntro: string;
      leadershipLink: string;
    };
    contact: { heading: string; body: string };
  };
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
    { type: "h2", text: "Mission" },
    {
      type: "ul",
      items: [
        "To provide high-quality formal and non-formal education grounded in Islamic values.",
        "To train santri (boarding students) to memorise and understand the Qur'an well.",
        "To build teaching facilities that are comfortable and safe, and that support children's growth.",
        "To work together with parents and the wider community in creating a positive learning environment.",
      ],
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
  transparencyPage: {
    title: "Legal Status & Transparency",
    metaDescription:
      "The legal identity of Yayasan Pesantren Cipansor: its Ministry of Law and Human Rights incorporation number, Registered ID (NPWP), registered address, foundation organs, and the domains the foundation operates.",
    lead: "This page sets out the legal identity of Yayasan Pesantren Cipansor together with the web addresses it operates, so that anyone — a parent, a donor, or a reviewing body — can verify the institution from a single place.",
    identity: {
      heading: "Legal Identity",
      legalNameLabel: "Registered name",
      legalFormLabel: "Legal form",
      legalFormValue:
        "Yayasan (Indonesian foundation), under Law No. 16 of 2001 as amended by Law No. 28 of 2004",
      decreeLabel: "Incorporation decree",
      issuedByLabel: "Issued by",
      establishedLabel: "Established",
      addressLabel: "Registered address",
      markazLabel: "Part of",
    },
    domains: {
      heading: "Official Foundation Domain",
      intro:
        "cipansor.or.id is the sole official website and domain owned and operated by Yayasan Pesantren Cipansor for all public communications, academic admissions, and institutional operations.",
      canonicalRole:
        "The foundation's official domain and the main portal for the pesantren's information system.",
      registryNote:
        "A .or.id domain may only be registered by a legally incorporated organisation in Indonesia. The national registry (PANDI) requires incorporation documents in the applicant organisation's own name — a deed of establishment or a ministerial decree of incorporation — before the domain is granted. The foundation's ownership of this domain was therefore checked against documents at registration, rather than being merely asserted on this page.",
      emailNote: (email) =>
        `All of the foundation's official correspondence uses an address on this domain: ${email}.`,
    },
    governance: {
      heading: "Foundation Organs and Governance",
      officersIntro:
        "The officers and unit heads who run the pesantren day to day are listed by name and position.",
      leadershipLink: "See the leadership",
    },
    contact: {
      heading: "Registered Address and Official Contact",
      body: "The address below is both the foundation's registered seat and the place where its teaching takes place, so it can be visited and checked on the map.",
    },
  },
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
    { type: "h2", text: "الرسالة" },
    {
      type: "ul",
      items: [
        "تقديم تعليم نظامي وغير نظامي عالي الجودة قائم على القيم الإسلامية.",
        "تربية الطلاب (السانتري) على حفظ القرآن الكريم وفهمه فهماً جيداً.",
        "بناء مرافق تعليمية مريحة وآمنة تدعم نموّ الأطفال.",
        "التعاون مع أولياء الأمور والمجتمع في تهيئة بيئة تعليمية إيجابية.",
      ],
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
  transparencyPage: {
    title: "الوضع القانوني والشفافية",
    metaDescription:
      "الهوية القانونية لمؤسسة معهد سيبانسور: رقم قرار الإشهار الصادر عن وزارة القانون وحقوق الإنسان، ورقم التعريف المسجَّل (NPWP)، والعنوان الرسمي، وأجهزة المؤسسة، والنطاقات التي تديرها.",
    lead: "تعرض هذه الصفحة الهوية القانونية لمؤسسة معهد سيبانسور مع العناوين الإلكترونية التي تديرها، ليتمكّن كلّ مهتمّ — وليّ أمر أو متبرّع أو جهة مراجِعة — من التحقّق من المؤسسة في مكان واحد.",
    identity: {
      heading: "الهوية القانونية",
      legalNameLabel: "الاسم المسجَّل",
      legalFormLabel: "الشكل القانوني",
      legalFormValue:
        "مؤسسة (Yayasan) وفق القانون رقم ١٦ لسنة ٢٠٠١ المعدَّل بالقانون رقم ٢٨ لسنة ٢٠٠٤",
      decreeLabel: "رقم قرار الإشهار",
      issuedByLabel: "الجهة المُصدِرة",
      establishedLabel: "سنة التأسيس",
      addressLabel: "العنوان الرسمي",
      markazLabel: "تندرج تحت",
    },
    domains: {
      heading: "النطاق الرسمي للمؤسسة",
      intro:
        "‏cipansor.or.id هو النطاق والموقع الرسمي الوحيد المملوك والمدار من قِبَل مؤسسة معهد سيبانسور لكافة الخدمات المعلوماتية والتسجيل والعمليات المؤسسية.",
      canonicalRole:
        "النطاق الرسمي للمؤسسة والبوابة الرئيسية لنظام المعلومات الخاص بالمعهد.",
      registryNote:
        "لا يُسمح بتسجيل نطاق ‎.or.id‎ إلا للمنظمات المشهرة قانونًا في إندونيسيا، إذ يشترط السجلّ الوطني (PANDI) تقديم وثائق التأسيس باسم المنظمة الطالبة نفسها — عقد التأسيس أو قرار الإشهار الوزاري — قبل منح النطاق. وعليه فإنّ ملكية المؤسسة لهذا النطاق قد خضعت لفحص المستندات منذ التسجيل، لا مجرّد دعوى تُذكر في هذه الصفحة.",
      emailNote: (email) =>
        `وتستخدم المؤسسة في جميع مراسلاتها الرسمية عنوان بريد على هذا النطاق، وهو ${email}.`,
    },
    governance: {
      heading: "أجهزة المؤسسة وحوكمتها",
      officersIntro:
        "أمّا المسؤولون ورؤساء الوحدات الذين يديرون المعهد يوميًّا فتُذكر أسماؤهم ومناصبهم كاملةً.",
      leadershipLink: "عرض الهيئة القيادية",
    },
    contact: {
      heading: "العنوان الرسمي وبيانات التواصل",
      body: "العنوان أدناه هو المقرّ الرسمي للمؤسسة وموضع نشاطها التعليمي في آنٍ واحد، فيمكن زيارته والتحقّق منه على الخريطة.",
    },
  },
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
  transparencyPage: {
    title: "Legalitas & Transparansi",
    metaDescription:
      "Identitas badan hukum Yayasan Pesantren Cipansor: nomor pengesahan Kementerian Hukum dan HAM, Registered ID (NPWP), alamat kedudukan, organ yayasan, dan domain resmi yang dioperasikan yayasan.",
    lead: "Halaman ini memuat identitas hukum Yayasan Pesantren Cipansor beserta alamat web yang dioperasikannya, agar siapa pun — wali santri, donatur, maupun lembaga yang meninjau — dapat memeriksa keabsahan lembaga ini dari satu tempat.",
    identity: {
      heading: "Identitas Badan Hukum",
      legalNameLabel: "Nama badan hukum",
      legalFormLabel: "Bentuk badan hukum",
      legalFormValue:
        "Yayasan, sesuai UU No. 16 Tahun 2001 jo. UU No. 28 Tahun 2004 tentang Yayasan",
      decreeLabel: "Nomor pengesahan",
      issuedByLabel: "Diterbitkan oleh",
      establishedLabel: "Berdiri sejak",
      addressLabel: "Alamat kedudukan",
      markazLabel: "Bernaung di bawah",
    },
    domains: {
      heading: "Domain Resmi Yayasan",
      intro:
        "cipansor.or.id adalah satu-satunya situs web dan domain resmi yang dimiliki serta dioperasikan oleh Yayasan Pesantren Cipansor untuk seluruh layanan informasi publik, pendaftaran santri baru, dan operasional kelembagaan.",
      canonicalRole:
        "Domain resmi yayasan sekaligus pintu masuk utama sistem informasi pesantren.",
      registryNote:
        "Domain .or.id hanya dapat didaftarkan oleh organisasi berbadan hukum di Indonesia. Registri nasional (PANDI) mensyaratkan dokumen legalitas atas nama organisasi pendaftar — akta pendirian atau surat keputusan pengesahan badan hukum — sebelum domain diberikan. Karena itu kepemilikan domain ini oleh yayasan telah melalui pemeriksaan dokumen sejak pendaftarannya, bukan sekadar pernyataan pada halaman ini.",
      emailNote: (email) =>
        `Seluruh korespondensi resmi yayasan menggunakan alamat surel pada domain ini, yaitu ${email}.`,
    },
    governance: {
      heading: "Organ dan Tata Kelola Yayasan",
      officersIntro:
        "Pengurus dan para kepala unit yang menjalankan kegiatan pesantren sehari-hari dicantumkan lengkap dengan nama dan jabatannya.",
      leadershipLink: "Lihat jajaran pimpinan",
    },
    contact: {
      heading: "Alamat dan Kontak Resmi",
      body: "Alamat berikut adalah kedudukan yayasan sekaligus lokasi kegiatan pendidikannya, sehingga dapat dikunjungi maupun diperiksa pada peta.",
    },
  },
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

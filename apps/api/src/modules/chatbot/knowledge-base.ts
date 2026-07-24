/**
 * The public chatbot's knowledge base.
 *
 * Every entry is DERIVED from the same constants the public pages render
 * (`@cipansor/shared` → `public-site.ts`). Nothing here is hand-transcribed,
 * which is the point: a hand-written knowledge base goes stale the first time
 * someone edits a phone number or a programme description, and nothing warns
 * you. The bot and the website are incapable of disagreeing.
 *
 * What must NOT live here: anything that changes on its own schedule. Admission
 * dates and fees are the obvious case — they belong to an admission period row
 * that opens and closes, so the bot reads them live (see `live-facts.ts`).
 * Baking them into a static corpus is how a bot ends up quoting last year's fee
 * to a family that is deciding this year.
 */

import {
  siteConfig,
  addressLines,
  educationUnits,
  featuredPrograms,
  donationConfig,
} from '@cipansor/shared';

export interface KnowledgeEntry {
  id: string;
  title: string;
  /** Public path a visitor can open to read the same thing. */
  url?: string;
  /** Plain prose. The retriever indexes this; the model is shown it verbatim. */
  text: string;
}

const { contact } = siteConfig;

/**
 * Built once at module load. The corpus is a few dozen entries derived from
 * constants — there is nothing to invalidate and no I/O to repeat.
 */
export const knowledgeBase: KnowledgeEntry[] = [
  {
    id: 'profil-umum',
    title: `Tentang ${siteConfig.legalName}`,
    url: '/profil',
    text: [
      `${siteConfig.legalName} (${siteConfig.markaz}) adalah ${siteConfig.tagline} yang berdiri sejak tahun ${siteConfig.establishedYear}.`,
      `Visi pesantren: "${siteConfig.visi}".`,
      siteConfig.description,
    ].join(' '),
  },
  {
    id: 'kontak',
    title: 'Kontak dan alamat',
    url: '/kontak',
    text: [
      `Alamat ${siteConfig.name}: ${addressLines.join(', ')}.`,
      `Telepon: ${contact.phone}. WhatsApp: ${contact.whatsapp}.`,
      `Email: ${contact.email}.`,
      `Lokasi di Google Maps: ${contact.maps.url}`,
    ].join(' '),
  },
  {
    id: 'unit-ikhtisar',
    title: 'Unit pendidikan',
    url: '/unit',
    text: [
      `${siteConfig.name} memiliki ${educationUnits.length} unit pendidikan:`,
      educationUnits.map((u) => u.name).join(', ') + '.',
      'Setiap unit memiliki halaman tersendiri dengan penjelasan lengkap.',
    ].join(' '),
  },

  // One entry per unit. Splitting them keeps retrieval precise: a question
  // about SMP IT should surface the SMP IT entry, not a paragraph in which it
  // is one name among five.
  ...educationUnits.map((unit) => ({
    id: `unit-${unit.slug}`,
    title: unit.name,
    url: `/unit/${unit.slug}`,
    text: `${unit.name} (${unit.shortName}) — ${unit.tagline}. ${unit.description}`,
  })),

  {
    id: 'program-ikhtisar',
    title: 'Program unggulan',
    url: '/program-unggulan',
    text: [
      `${siteConfig.name} menyelenggarakan ${featuredPrograms.length} program unggulan:`,
      featuredPrograms.map((p) => p.title).join(', ') + '.',
    ].join(' '),
  },
  ...featuredPrograms.map((program) => ({
    id: `program-${program.slug}`,
    title: program.title,
    url: '/program-unggulan',
    text: `${program.title}. ${program.description}`,
  })),

  {
    id: 'donasi-ikhtisar',
    title: `${donationConfig.headline} — donasi, wakaf dan infaq`,
    url: '/wakaf-infaq',
    text: [
      `${donationConfig.subheadline}. ${donationConfig.lead}`,
      donationConfig.programsIntro,
      donationConfig.programs.map((p) => `${p.title}: ${p.description}`).join(' '),
      donationConfig.commitment.text,
    ].join(' '),
  },
  {
    id: 'donasi-rekening',
    title: 'Rekening donasi resmi dan cara konfirmasi',
    url: '/wakaf-infaq',
    text: [
      `Donasi disalurkan melalui rekening resmi ${donationConfig.bank.name}`,
      `nomor ${donationConfig.bank.accountNumber} atas nama ${donationConfig.bank.accountHolder}.`,
      `Setelah transfer, kirim bukti melalui WhatsApp ke ${donationConfig.confirmation.whatsappNumber}`,
      `dengan format "${donationConfig.confirmation.format}", contoh: "${donationConfig.confirmation.example}".`,
      donationConfig.steps.map((s) => `${s.title}: ${s.description}`).join(' '),
    ].join(' '),
  },
  {
    id: 'spmb-cara-daftar',
    title: 'Cara mendaftar (SPMB)',
    url: '/public/spmb',
    text: [
      'Pendaftaran santri baru (SPMB) dilakukan secara online melalui halaman /public/spmb.',
      "Formulir diisi bertahap: data calon santri, data orang tua, alamat, kemampuan Qur'an, dokumen, lalu konfirmasi.",
      'Setelah mengirim formulir, simpan nomor pendaftaran untuk memantau hasil seleksi melalui tab "Cek Status" di halaman yang sama.',
      `Pertanyaan seputar pendaftaran dapat disampaikan ke ${contact.phone} atau WhatsApp ${contact.whatsapp}.`,
    ].join(' '),
  },
];

/** Lookup used by the service to attach source metadata to an answer. */
export const knowledgeById = new Map(knowledgeBase.map((e) => [e.id, e]));

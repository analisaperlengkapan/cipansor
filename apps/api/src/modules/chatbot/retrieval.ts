/**
 * Lexical retrieval (BM25) over the public knowledge base.
 *
 * WHY NOT EMBEDDINGS. The public corpus is a few dozen short, factual entries
 * about one institution, and questions arrive using the same vocabulary the
 * entries use ("biaya", "alamat", "tahfidz", "SMP IT"). BM25 handles that well,
 * costs nothing, needs no API key, and — decisive for a system whose answers
 * must be checkable — is deterministic, so a retrieval regression shows up in a
 * unit test instead of as a vague drop in answer quality.
 *
 * Embeddings buy paraphrase matching, which starts to matter at a corpus size
 * and question variety we do not have yet. `Retriever` is an interface so a
 * vector implementation can slot in behind it WHEN THE EVAL SET SHOWS lexical
 * retrieval is the bottleneck — measure, then swap. See
 * docs/planning/chatbot-design.md §1 and §6.
 */

import { knowledgeBase, type KnowledgeEntry } from './knowledge-base';

export interface RetrievedChunk {
  entry: KnowledgeEntry;
  score: number;
}

export interface Retriever {
  search(query: string, limit?: number): RetrievedChunk[];
}

/**
 * Indonesian function words. They appear in nearly every entry, so leaving them
 * in makes BM25 rank on sentence shape rather than subject matter.
 */
const STOPWORDS = new Set([
  'ada',
  'adalah',
  'agar',
  'akan',
  'anda',
  'apa',
  'apakah',
  'atau',
  'bagaimana',
  'bagi',
  'bahwa',
  'banyak',
  'berapa',
  'bisa',
  'buat',
  'dan',
  'dapat',
  'dari',
  'dengan',
  'di',
  'dia',
  'dll',
  'dong',
  'gimana',
  'ini',
  'itu',
  'jadi',
  'juga',
  'kalau',
  'kami',
  'kamu',
  'ke',
  'kepada',
  'kita',
  'lagi',
  'mau',
  'mengapa',
  'mereka',
  'nya',
  'oleh',
  'pada',
  'para',
  'pun',
  'saja',
  'saya',
  'sebagai',
  'secara',
  'sehingga',
  'serta',
  'sini',
  'situ',
  'siapa',
  'suatu',
  'tapi',
  'tentang',
  'terhadap',
  'tidak',
  'untuk',
  'yaitu',
  'yang',
  // Colloquial particles and vocatives. They carry no meaning but are very
  // common in typed Indonesian, and leaving them in splits "biaya pendaftaran
  // berapa ya" from "berapa biaya pendaftaran" — two spellings of one question.
  // That matters for the answer cache as much as it does for ranking.
  'ya',
  'yah',
  'sih',
  'deh',
  'nih',
  'kah',
  'kok',
  'loh',
  'lho',
  'aja',
  'mah',
  'toh',
  'pak',
  'bu',
  'min',
]);

/**
 * Conservative Indonesian affix stripping.
 *
 * Indonesian is agglutinative: "daftar" → "pendaftaran", "mendaftar",
 * "didaftarkan". Without this, a visitor asking "cara pendaftaran" never
 * matches an entry that says "mendaftar", which is the single most likely
 * question this bot will receive.
 *
 * This is deliberately not a full stemmer (Nazief-Adriani and friends need a
 * root dictionary). It strips only unambiguous affixes and refuses to reduce a
 * word below four characters, because over-stemming silently destroys precision
 * — "makan" → "mak" would collide with unrelated terms.
 */
const SUFFIXES = ['kannya', 'annya', 'inya', 'nya', 'kan', 'an', 'i'];
const PREFIXES = [
  'menge',
  'meny',
  'meng',
  'mem',
  'men',
  'ber',
  'per',
  'pen',
  'pem',
  'peng',
  'di',
  'ke',
  'se',
  'ter',
];

const MIN_STEM = 4;

export function stem(word: string): string {
  let w = word;
  for (const suffix of SUFFIXES) {
    if (w.endsWith(suffix) && w.length - suffix.length >= MIN_STEM) {
      w = w.slice(0, -suffix.length);
      break;
    }
  }
  for (const prefix of PREFIXES) {
    if (w.startsWith(prefix) && w.length - prefix.length >= MIN_STEM) {
      w = w.slice(prefix.length);
      break;
    }
  }
  return w;
}

export function tokenize(text: string): string[] {
  return (
    text
      .toLowerCase()
      // Keep the apostrophe inside a word so "qur'an" survives as one token,
      // then normalise it away so "quran" and "qur'an" agree.
      .replace(/['’]/g, '')
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 1 && !STOPWORDS.has(t))
      .map(stem)
  );
}

const K1 = 1.5;
const B = 0.75;

/**
 * Drop hits scoring far below the best one.
 *
 * BM25 returns anything sharing a term, so "berapa biaya pendaftaran" also
 * matched the entrepreneurship and hadith programme entries on a single weak
 * stem. Those are not merely wasted context — the widget SHOWS its sources, so
 * a visitor asking about fees was offered "Menghafal Hadits" as a citation,
 * which reads as either a broken bot or an evasive one.
 *
 * Relative rather than absolute, because BM25 scores are not comparable across
 * queries: a rare term scores high, a common one low, and any fixed cutoff
 * would silently discard everything for one phrasing and nothing for another.
 */
const MIN_RELATIVE_SCORE = 0.35;

export class Bm25Retriever implements Retriever {
  private readonly docs: { entry: KnowledgeEntry; tf: Map<string, number>; length: number }[];
  private readonly df = new Map<string, number>();
  private readonly avgLength: number;

  constructor(entries: KnowledgeEntry[] = knowledgeBase) {
    this.docs = entries.map((entry) => {
      // The title carries the most signal per word, so it is indexed twice.
      // This is a weight, not a trick: an entry titled "SMP IT Cipansor" should
      // beat one that merely mentions it in passing.
      const tokens = [...tokenize(entry.title), ...tokenize(entry.title), ...tokenize(entry.text)];
      const tf = new Map<string, number>();
      for (const token of tokens) tf.set(token, (tf.get(token) ?? 0) + 1);
      for (const token of new Set(tokens)) this.df.set(token, (this.df.get(token) ?? 0) + 1);
      return { entry, tf, length: tokens.length };
    });
    this.avgLength =
      this.docs.length === 0
        ? 0
        : this.docs.reduce((sum, d) => sum + d.length, 0) / this.docs.length;
  }

  search(query: string, limit = 4): RetrievedChunk[] {
    const terms = tokenize(query);
    if (terms.length === 0) return [];

    const n = this.docs.length;
    const scored = this.docs.map((doc) => {
      let score = 0;
      for (const term of terms) {
        const f = doc.tf.get(term);
        if (!f) continue;
        const df = this.df.get(term) ?? 0;
        const idf = Math.log(1 + (n - df + 0.5) / (df + 0.5));
        const norm = f + K1 * (1 - B + (B * doc.length) / (this.avgLength || 1));
        score += idf * ((f * (K1 + 1)) / norm);
      }
      return { entry: doc.entry, score };
    });

    const ranked = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
    if (ranked.length === 0) return [];

    const cutoff = ranked[0].score * MIN_RELATIVE_SCORE;
    return ranked.filter((s) => s.score >= cutoff).slice(0, limit);
  }
}

export const defaultRetriever = new Bm25Retriever();

import { describe, it, expect } from 'vitest';
import { Bm25Retriever, defaultRetriever, stem, tokenize } from '../retrieval';

describe('tokenize', () => {
  it('drops Indonesian stopwords so ranking is about subject matter', () => {
    // Without this, "Apa yang ada di ..." scores on function words that appear
    // in nearly every entry.
    expect(tokenize('Apa saja yang ada di sini')).toEqual([]);
  });

  it('normalises the apostrophe so "Qur\'an" and "Quran" are the same token', () => {
    expect(tokenize("Qur'an")).toEqual(tokenize('Quran'));
  });

  it('is case-insensitive and splits on punctuation', () => {
    expect(tokenize('SMP IT, Cipansor!')).toEqual(tokenize('smp it cipansor'));
  });
});

describe('stem', () => {
  it('reduces the affixed forms a visitor actually types to one root', () => {
    // The single most likely question this bot receives is some form of
    // "how do I register", and Indonesian offers many spellings of it.
    const root = stem('daftar');
    expect(stem('pendaftaran')).toBe(root);
    expect(stem('mendaftar')).toBe(root);
  });

  it('refuses to stem below four characters', () => {
    // Over-stemming destroys precision silently: "makan" must not become "mak".
    expect(stem('makan')).toBe('makan');
    expect(stem('kami')).toBe('kami');
  });
});

describe('Bm25Retriever', () => {
  it('returns nothing for a query with no indexable terms', () => {
    expect(defaultRetriever.search('yang di dan')).toEqual([]);
  });

  it('ranks the entry whose title matches above one that merely mentions it', () => {
    const results = defaultRetriever.search('SMP IT Cipansor');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].entry.id).toBe('unit-smpit');
  });

  it('finds the donation account entry from a natural question', () => {
    const results = defaultRetriever.search('ke mana saya transfer donasi wakaf');
    expect(results.map((r) => r.entry.id)).toContain('donasi-rekening');
  });

  it('finds registration guidance from an affixed query', () => {
    // Proves the stemmer is wired into retrieval, not just unit-tested alone.
    const results = defaultRetriever.search('bagaimana cara pendaftaran santri baru');
    expect(results.map((r) => r.entry.id)).toContain('spmb-cara-daftar');
  });

  it('honours the result limit', () => {
    expect(defaultRetriever.search('Cipansor', 2).length).toBeLessThanOrEqual(2);
  });

  it('drops weak hits that merely share one stem with the query', () => {
    // The widget displays its sources, so a fee question that cites
    // "Menghafal Hadits" reads as a broken or evasive bot. Observed against the
    // live database before the relative cutoff existed.
    const ids = defaultRetriever.search('berapa biaya pendaftaran').map((r) => r.entry.id);
    expect(ids).not.toContain('program-hadits');
    expect(ids).not.toContain('program-entrepreneurship');
  });

  it('still returns the entries that genuinely match', () => {
    // The cutoff must not be so aggressive that it strands real answers.
    const ids = defaultRetriever.search('donasi wakaf rekening').map((r) => r.entry.id);
    expect(ids).toContain('donasi-rekening');
  });

  it('handles an empty corpus without dividing by zero', () => {
    expect(new Bm25Retriever([]).search('apa pun')).toEqual([]);
  });
});

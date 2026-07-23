import { describe, it, expect } from 'vitest';
import {
  LETTERHEAD,
  LetterNature,
  LetterType,
  letterTemplateFor,
  natureMarking,
  remainingPlaceholders,
  renderTemplateDraft,
} from '@cipansor/shared';

describe('konsep awal surat', () => {
  it('setiap jenis naskah punya kerangka', () => {
    for (const type of Object.values(LetterType)) {
      const t = letterTemplateFor(type);
      expect(t, type).toBeTruthy();
      // Isi selalu ada; judul boleh kosong (surat dinas biasa tidak berjudul).
      expect(t.body.length, `${type} tidak punya isi awal`).toBeGreaterThan(0);
    }
  });

  it('mengikuti bentuk surat asli untuk Surat Keterangan', () => {
    const t = letterTemplateFor(LetterType.SURAT_KETERANGAN);
    expect(t.title).toBe('SURAT KETERANGAN');
    expect(t.opening).toBe('Yang bertanda tangan di bawah ini:');
    expect(t.transition).toBe('Dengan ini menerangkan dengan sebenarnya bahwa:');
    expect(t.closing).toMatch(/Demikian surat keterangan ini dibuat/);
  });

  it('kop surat memakai data resmi yayasan', () => {
    expect(LETTERHEAD.organisation).toBe('YAYASAN PESANTREN CIPANSOR');
    expect(LETTERHEAD.website).toBe('www.cipansor.or.id');
    expect(LETTERHEAD.legalBasis).toMatch(/AKTA NOTARIS NO\. 01/);
  });

  // Stamping "BIASA" on an ordinary letter dilutes the stamp on one that is
  // genuinely restricted, which is the whole point of the marking.
  it('hanya menandai naskah yang memang dibatasi', () => {
    expect(natureMarking(LetterNature.PUBLIC)).toBeNull();
    expect(natureMarking(LetterNature.LIMITED)).toBe('TERBATAS');
    expect(natureMarking(LetterNature.CONFIDENTIAL)).toBe('RAHASIA');
    expect(natureMarking(LetterNature.STRICTLY_CONFIDENTIAL)).toBe('SANGAT RAHASIA');
  });

  it('menempatkan penandaan sifat di awal naskah', () => {
    const draft = renderTemplateDraft(
      LetterType.SURAT_KETERANGAN,
      LetterNature.CONFIDENTIAL
    );
    expect(draft.startsWith('RAHASIA')).toBe(true);

    const biasa = renderTemplateDraft(
      LetterType.SURAT_KETERANGAN,
      LetterNature.PUBLIC
    );
    expect(biasa).not.toMatch(/^RAHASIA|^BIASA/);
  });

  it('surat keputusan memuat Menimbang, Mengingat, dan Menetapkan', () => {
    const draft = renderTemplateDraft(
      LetterType.SURAT_KEPUTUSAN,
      LetterNature.PUBLIC
    );
    expect(draft).toMatch(/Menimbang/);
    expect(draft).toMatch(/Mengingat/);
    expect(draft).toMatch(/MEMUTUSKAN/);
    // Dasar hukum yayasan yang selalu berlaku, agar tidak terlupa.
    expect(draft).toMatch(/Undang-Undang Nomor 16 Tahun 2001/);
  });

  it('surat tugas meminta uraian tugas, waktu, dan tempat', () => {
    const draft = renderTemplateDraft(LetterType.SURAT_TUGAS, LetterNature.PUBLIC);
    expect(draft).toMatch(/URAIAN TUGAS/);
    expect(draft).toMatch(/TEMPAT/);
  });

  // The drafter must be able to see what is still unfilled before submitting;
  // a letter that goes up the ladder with "[NAMA]" in it wastes everyone's
  // turn and comes straight back down as a revision.
  it('melaporkan placeholder yang belum diisi', () => {
    const draft = renderTemplateDraft(
      LetterType.SURAT_KETERANGAN,
      LetterNature.PUBLIC
    );
    const left = remainingPlaceholders(draft);
    expect(left.length).toBeGreaterThan(0);

    const filled = 'Sudah lengkap tanpa isian tersisa.';
    expect(remainingPlaceholders(filled)).toEqual([]);
  });

  it('konsep tidak menyisakan baris kosong di awal/akhir', () => {
    for (const type of Object.values(LetterType)) {
      const draft = renderTemplateDraft(type, LetterNature.PUBLIC);
      expect(draft, type).toBe(draft.trim());
    }
  });
});

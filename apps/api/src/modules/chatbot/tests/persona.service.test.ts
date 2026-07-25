import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    chatbotPersona: { findUnique: vi.fn(), upsert: vi.fn(), deleteMany: vi.fn() },
  },
}));
vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { prisma } from '@/lib/prisma';
import { config } from '@/config';
import { DEFAULT_PERSONA } from '../prompt';
import {
  resolvePublicPersona,
  getPublicPersonaState,
  setPublicPersona,
  resetPublicPersona,
  PUBLIC_SCOPE,
} from '../persona.service';

const db = prisma as unknown as {
  chatbotPersona: {
    findUnique: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
  };
};

const CUSTOM = 'Sapa dengan riang dan penuh semangat! 🎉';
const originalEnvPersona = config.chatbot.persona;

beforeEach(() => {
  vi.clearAllMocks();
  // Default to no env override; individual tests set it when they mean to.
  Object.assign(config.chatbot, { persona: undefined });
});
afterEach(() => {
  Object.assign(config.chatbot, { persona: originalEnvPersona });
});

describe('resolvePublicPersona', () => {
  it('uses the saved custom persona when a row exists', async () => {
    db.chatbotPersona.findUnique.mockResolvedValue({ persona: CUSTOM, updatedAt: new Date() });
    expect(await resolvePublicPersona()).toBe(CUSTOM);
  });

  it('falls back to the env persona when no row is saved', async () => {
    db.chatbotPersona.findUnique.mockResolvedValue(null);
    Object.assign(config.chatbot, { persona: 'ENV VOICE' });
    expect(await resolvePublicPersona()).toBe('ENV VOICE');
  });

  it('falls back to the built-in default when neither row nor env is set', async () => {
    db.chatbotPersona.findUnique.mockResolvedValue(null);
    expect(await resolvePublicPersona()).toBe(DEFAULT_PERSONA);
  });

  it('ignores a blank saved persona and falls back', async () => {
    db.chatbotPersona.findUnique.mockResolvedValue({ persona: '   ', updatedAt: new Date() });
    expect(await resolvePublicPersona()).toBe(DEFAULT_PERSONA);
  });

  it('degrades to the default rather than throwing when the database is down', async () => {
    // A persona lookup failure must never take the assistant down: the safety
    // scaffold and the answer are unaffected — only the voice degrades.
    db.chatbotPersona.findUnique.mockRejectedValue(new Error('db down'));
    expect(await resolvePublicPersona()).toBe(DEFAULT_PERSONA);
  });
});

describe('getPublicPersonaState', () => {
  it('reports a custom persona with its timestamp', async () => {
    const updatedAt = new Date('2026-07-25T10:00:00.000Z');
    db.chatbotPersona.findUnique.mockResolvedValue({ persona: CUSTOM, updatedAt });
    expect(await getPublicPersonaState()).toEqual({
      persona: CUSTOM,
      defaultPersona: DEFAULT_PERSONA,
      isCustom: true,
      updatedAt: updatedAt.toISOString(),
    });
  });

  it('reports the default as not custom when no row is saved', async () => {
    db.chatbotPersona.findUnique.mockResolvedValue(null);
    expect(await getPublicPersonaState()).toEqual({
      persona: DEFAULT_PERSONA,
      defaultPersona: DEFAULT_PERSONA,
      isCustom: false,
      updatedAt: null,
    });
  });
});

describe('setPublicPersona', () => {
  it('upserts the trimmed persona for the public scope and returns the new state', async () => {
    db.chatbotPersona.upsert.mockResolvedValue({});
    db.chatbotPersona.findUnique.mockResolvedValue({ persona: CUSTOM, updatedAt: new Date() });

    const state = await setPublicPersona(`  ${CUSTOM}  `, 'user-1');

    expect(db.chatbotPersona.upsert).toHaveBeenCalledWith({
      where: { scope: PUBLIC_SCOPE },
      create: { scope: PUBLIC_SCOPE, persona: CUSTOM, updatedBy: 'user-1' },
      update: { persona: CUSTOM, updatedBy: 'user-1' },
    });
    expect(state.isCustom).toBe(true);
  });
});

describe('resetPublicPersona', () => {
  it('deletes the custom row and returns the default state', async () => {
    db.chatbotPersona.deleteMany.mockResolvedValue({ count: 1 });
    db.chatbotPersona.findUnique.mockResolvedValue(null);

    const state = await resetPublicPersona();

    expect(db.chatbotPersona.deleteMany).toHaveBeenCalledWith({ where: { scope: PUBLIC_SCOPE } });
    expect(state.isCustom).toBe(false);
    expect(state.persona).toBe(DEFAULT_PERSONA);
  });
});

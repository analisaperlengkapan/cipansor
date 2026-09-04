import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/error';
import { ApiResponse } from '@/utils/response';
import { logger } from '@/lib/logger';
import type {
  ChatbotConversationListResponse,
  ChatbotPersonaResponse,
} from '@cipansor/shared';
import * as chatbotService from './chatbot.service';
import * as personaService from './persona.service';
import * as transcriptService from './transcript.service';
import type { PublicChatBody, UpdatePersonaBody } from './chatbot.schema';

/**
 * Ask the public assistant.
 * POST /api/chatbot/public/ask
 *
 * Unauthenticated by design: it serves visitors who have not logged in and can
 * reach nothing but public information. Rate limiting, not authentication, is
 * what protects it — see `chatbot.routes.ts`.
 */
export const ask = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as PublicChatBody;

  try {
    const { cached, ...result } = await chatbotService.ask({
      question: body.message,
      history: body.history,
    });

    // Log that a question was asked and whether it could be answered, never the
    // question text: visitors type personal details into chat boxes ("anak saya
    // bernama…"), and an application log is the wrong place for them to end up.
    // The transcript below is a different thing with different rules — it is
    // read only by a super admin, and it deletes itself after 90 days.
    logger.info('Chatbot answered', {
      refused: result.refused,
      sources: result.sources.length,
      conversationId: body.conversationId,
      cached: cached === true,
    });

    // Jawabannya dikirim LEBIH DULU, riwayatnya ditulis sesudahnya.
    //
    // Urutan sebaliknya membuat jawaban yang sudah siap bergantung pada
    // keberhasilan penulisan riwayat: `recordTurn` memang menelan galatnya
    // sendiri, tetapi menaruhnya sebelum `res.json` menjadikan jaminan itu
    // menanggung beban di tempat yang tidak perlu — satu perubahan di modul
    // lain, dan pengunjung menerima galat 500 atas pertanyaan yang sudah
    // terjawab dengan benar. Sesudah `res.json`, tidak ada kegagalan di bawah
    // ini yang dapat menyentuhnya.
    //
    // Dicatat DI SINI, bukan di dalam service, karena hanya permukaan HTTP yang
    // melayani pengunjung sungguhan — memanggilnya dari `ask()` akan ikut
    // mencatat setiap jalannya harness evaluasi ke dalam riwayat.
    res.json(ApiResponse.success(result));

    try {
      await transcriptService.recordTurn({
        clientId: body.conversationId,
        question: body.message,
        answer: result.answer,
        sources: result.sources,
        refused: result.refused,
        fromCache: cached === true,
        model: result.model,
      });
    } catch (error) {
      logger.warn('Chatbot transcript record failed after answering', {
        message: error instanceof Error ? error.message : String(error),
      });
    }
    return;
  } catch (error) {
    if (error instanceof chatbotService.ChatbotUnavailableError) {
      // 503, not 500: the assistant being switched off or its provider being
      // down is an expected state, and the widget renders a calm message with
      // the phone number rather than an error.
      res
        .status(503)
        .json(
          ApiResponse.error(
            'CHATBOT_UNAVAILABLE',
            'Asisten sedang tidak tersedia. Silakan hubungi kami melalui telepon atau WhatsApp.'
          )
        );
      return;
    }
    throw error;
  }
});

/**
 * Whether the assistant is available.
 * GET /api/chatbot/public/status
 *
 * The widget calls this before rendering so a disabled or unconfigured
 * assistant simply does not appear, instead of appearing and then failing on
 * the visitor's first question.
 */
export const status = asyncHandler(async (_req: Request, res: Response) => {
  res.json(ApiResponse.success({ available: chatbotService.resolveProvider() !== null }));
});

/**
 * Read the assistant's editable persona (super admin).
 * GET /api/chatbot/admin/persona
 *
 * Returns the persona in force, the code default (so the UI can preview it and
 * offer a reset), and whether a custom value is saved.
 */
export const getPersona = asyncHandler(async (_req: Request, res: Response) => {
  const state = await personaService.getPublicPersonaState();
  res.json(ApiResponse.success(state satisfies ChatbotPersonaResponse));
});

/**
 * Save a custom persona (super admin).
 * PUT /api/chatbot/admin/persona
 *
 * Only the additive style text is accepted; it can never revoke a safety rule
 * (see prompt.ts). Saving re-keys the answer cache, so the next visitor is
 * answered in the new voice with no stale cached copy in the old one.
 */
export const updatePersona = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as UpdatePersonaBody;
  const state = await personaService.setPublicPersona(body.persona, req.user?.id);
  // The persona text itself is house style, not a secret, but logging its
  // length rather than its body keeps the log terse and the audit useful.
  logger.info('Chatbot persona updated', { by: req.user?.id, length: body.persona.length });
  res.json(ApiResponse.success(state satisfies ChatbotPersonaResponse));
});

/**
 * Drop the custom persona and fall back to the default (super admin).
 * DELETE /api/chatbot/admin/persona
 */
export const resetPersona = asyncHandler(async (req: Request, res: Response) => {
  const state = await personaService.resetPublicPersona();
  logger.info('Chatbot persona reset to default', { by: req.user?.id });
  res.json(ApiResponse.success(state satisfies ChatbotPersonaResponse));
});

/**
 * Daftar percakapan (super admin).
 * GET /api/chatbot/admin/conversations
 *
 * Isinya kalimat yang benar-benar diketik pengunjung, jadi rutenya dikunci ke
 * SUPER_ADMIN di `chatbot.routes.ts` dan barisnya menghapus diri setelah 90
 * hari. `retentionDays` ikut dikirim supaya halamannya menyatakan aturan itu
 * kepada pembacanya alih-alih menyembunyikannya di kode.
 */
export const listConversations = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as Record<string, string | undefined>;

  const result = await transcriptService.listConversations({
    page: query.page ? Number(query.page) : undefined,
    pageSize: query.pageSize ? Number(query.pageSize) : undefined,
    onlyRefused: query.onlyRefused === 'true',
    search: query.search,
  });

  res.json(
    ApiResponse.success({
      ...result,
      retentionDays: transcriptService.TRANSCRIPT_RETENTION_DAYS,
    } satisfies ChatbotConversationListResponse)
  );
});

/**
 * Satu percakapan lengkap (super admin).
 * GET /api/chatbot/admin/conversations/:id
 */
export const getConversation = asyncHandler(async (req: Request, res: Response) => {
  const conversation = await transcriptService.getConversation(req.params.id);

  if (!conversation) {
    res.status(404).json(ApiResponse.error('NOT_FOUND', 'Percakapan tidak ditemukan'));
    return;
  }

  // Dicatat karena membaca kalimat orang lain adalah tindakan yang layak
  // meninggalkan jejak, bahkan ketika yang melakukannya berwenang penuh.
  logger.info('Chatbot transcript read', { by: req.user?.id, conversationId: conversation.id });

  res.json(ApiResponse.success(conversation));
});

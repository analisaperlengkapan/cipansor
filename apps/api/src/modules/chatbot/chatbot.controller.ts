import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/error';
import { ApiResponse } from '@/utils/response';
import { logger } from '@/lib/logger';
import type { ChatbotPersonaResponse } from '@cipansor/shared';
import * as chatbotService from './chatbot.service';
import * as personaService from './persona.service';
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
    const result = await chatbotService.ask({
      question: body.message,
      history: body.history,
    });

    // Log that a question was asked and whether it could be answered, never the
    // question text: visitors type personal details into chat boxes ("anak saya
    // bernama…"), and a log is the wrong place for them to end up.
    logger.info('Chatbot answered', {
      refused: result.refused,
      sources: result.sources.length,
      conversationId: body.conversationId,
    });

    res.json(ApiResponse.success(result));
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

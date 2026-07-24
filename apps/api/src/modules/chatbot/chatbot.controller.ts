import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/error';
import { ApiResponse } from '@/utils/response';
import { logger } from '@/lib/logger';
import * as chatbotService from './chatbot.service';
import type { PublicChatBody } from './chatbot.schema';

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

/**
 * Customer-service chatbot DTOs.
 *
 * Phase 1 is the PUBLIC assistant only: it answers from a curated knowledge
 * base about Cipansor plus a small set of live read-only lookups. It has no
 * access to any user's data, because no user is logged in.
 *
 * The authenticated, role-aware assistant is deliberately NOT modelled here.
 * When it arrives it must reach private data by calling the existing authorised
 * endpoints as the logged-in user with their active role — never by querying a
 * vector index built over the database. See docs/planning/chatbot-design.md §2.
 */

/** One turn of a conversation. `system` is never accepted from a client. */
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface PublicChatRequest {
  /** The visitor's question. */
  message: string;
  /**
   * Prior turns, oldest first. The server caps how many it will honour; it does
   * not trust the client to keep this small.
   */
  history?: ChatMessage[];
  /**
   * Opaque client-generated conversation id, for logging and rate limiting.
   * Carries no authority — it is not a session and grants nothing.
   */
  conversationId?: string;
}

/**
 * A piece of source material the answer was grounded in.
 *
 * Every answer carries its sources so a reader can check the claim, and so the
 * eval harness can measure groundedness rather than just plausibility.
 */
export interface ChatSource {
  /** Stable id of the knowledge-base entry or live lookup. */
  id: string;
  title: string;
  /** Public site path, when the source corresponds to a page a visitor can open. */
  url?: string;
  /** `kb` = curated knowledge base, `live` = a real-time authorised lookup. */
  kind: "kb" | "live";
}

export interface PublicChatResponse {
  answer: string;
  sources: ChatSource[];
  /**
   * True when the assistant declined because the question falls outside what
   * the public bot may discuss (private data, or nothing relevant retrieved).
   * The eval harness asserts on this directly: for the red-team set, a refusal
   * is the passing outcome.
   */
  refused: boolean;
  /** Which provider answered — useful when comparing candidate models. */
  model?: string;
}

/**
 * Word for word what the backend says when a locked partner's token is refused
 * (`PARTNER_LOCKED_MESSAGE` in nestjs-boilerplate jwt.strategy.ts). The 401 has
 * no code of its own, so the text is how a lock is told apart from a session
 * that simply ended (doitac-1410 #004).
 */
export const PARTNER_LOCKED_MESSAGE =
  'Tài khoản của Quý đối tác hiện đang bị khóa, vui lòng liên hệ admin để được hỗ trợ';

/** Why the partner was sent back to the sign-in page, as `?reason=`. */
export type SessionEndReason = 'locked' | 'ended';

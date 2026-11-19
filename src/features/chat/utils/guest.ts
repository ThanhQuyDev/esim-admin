/**
 * A visitor chatting without an account (vande-2011 #023). The server shows
 * their conversation as user -1 and their messages as sent by -1; that id is
 * no account, so there is nobody to look up and no orders to show.
 */
export const GUEST_USER_ID = -1;

export function isGuestId(id: number | null | undefined): boolean {
  return id === GUEST_USER_ID;
}

export function guestName(roomId: number | null | undefined): string {
  return roomId ? `Khách vãng lai #${roomId}` : 'Khách vãng lai';
}

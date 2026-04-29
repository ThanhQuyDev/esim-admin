import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * Returns the JWT token for WebSocket authentication.
 * The token cookie is httpOnly, so the client can't read it directly.
 * This endpoint allows the chat page to retrieve it for Socket.IO auth.
 */
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  return NextResponse.json({ token });
}

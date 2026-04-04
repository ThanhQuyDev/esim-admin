import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return NextResponse.json(
      { message: 'Not authenticated' },
      { status: 401 }
    );
  }

  const res = await fetch(`${API_URL}/api/v1/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    return NextResponse.json(
      { message: 'Not authenticated' },
      { status: 401 }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}

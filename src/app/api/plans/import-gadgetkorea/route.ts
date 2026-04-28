import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function getAuthHeaders() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const headers = await getAuthHeaders();

  const res = await fetch(`${API_URL}/api/v1/plans/import-gadgetkorea`, {
    method: 'POST',
    headers,
    body: formData
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return NextResponse.json(
      { message: data.message || 'Failed to import Gadget Korea plans', errors: data.errors },
      { status: res.status }
    );
  }

  return NextResponse.json(data, { status: 201 });
}

import { NextResponse } from 'next/server';

const getBackendBaseUrl = () => {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (configured) {
    return configured.replace(/\/orders\/?$/, '');
  }
  return 'http://localhost:5000/api';
};

export async function PATCH(request: Request, { params }: { params: { entryId: string } }) {
  try {
    const body = await request.json();
    const backendUrl = `${getBackendBaseUrl()}/journal/${params.entryId}`;
    const response = await fetch(backendUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json({ error: data?.error || 'Unable to update journal entry' }, { status: response.status || 500 });
    }

    return NextResponse.json({ entry: data.entry || data });
  } catch (error) {
    console.error('Journal proxy PATCH error:', error);
    return NextResponse.json({ error: 'Unable to update journal entry' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { entryId: string } }) {
  try {
    const backendUrl = `${getBackendBaseUrl()}/journal/${params.entryId}`;
    const response = await fetch(backendUrl, { method: 'DELETE' });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json({ error: data?.error || 'Unable to delete journal entry' }, { status: response.status || 500 });
    }

    return NextResponse.json({ success: true, message: data.message || 'Journal entry deleted successfully.' });
  } catch (error) {
    console.error('Journal proxy DELETE error:', error);
    return NextResponse.json({ error: 'Unable to delete journal entry' }, { status: 500 });
  }
}

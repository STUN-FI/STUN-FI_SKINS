import { NextResponse } from 'next/server';

type JournalCategory = 'Operations' | 'Client' | 'Production' | 'Notes';

type JournalEntry = {
  _id?: string;
  id?: string;
  title: string;
  body: string;
  category: JournalCategory;
  createdAt: string;
};

const fallbackEntries: JournalEntry[] = [
  {
    id: 'seed-demo-1',
    title: 'Daily update',
    body: 'Followed up on the pending production list and confirmed the afternoon dispatch window.',
    category: 'Operations',
    createdAt: new Date().toISOString(),
  },
];

const getBackendBaseUrl = () => {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (configured) {
    return configured.replace(/\/orders\/?$/, '');
  }
  return 'http://localhost:5000/api';
};

export async function GET() {
  try {
    const backendUrl = `${getBackendBaseUrl()}/journal`;
    const response = await fetch(backendUrl, { cache: 'no-store' });
    const data = await response.json().catch(() => ({}));

    if (response.ok && Array.isArray(data.entries)) {
      return NextResponse.json({ entries: data.entries });
    }

    if (response.status === 503 || String(data?.error || '').toLowerCase().includes('database unavailable')) {
      return NextResponse.json({ entries: fallbackEntries });
    }

    return NextResponse.json({ entries: fallbackEntries });
  } catch (error) {
    console.error('Journal proxy GET error:', error);
    return NextResponse.json({ entries: fallbackEntries });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const backendUrl = `${getBackendBaseUrl()}/journal`;
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 503 || String(data?.error || '').toLowerCase().includes('database unavailable')) {
        const saved: JournalEntry = {
          id: `fallback-${Date.now()}`,
          title: String(body?.title || 'Untitled note').trim() || 'Untitled note',
          body: String(body?.body || '').trim(),
          category: ['Operations', 'Client', 'Production', 'Notes'].includes(body?.category) ? body.category : 'Notes',
          createdAt: new Date().toISOString(),
        };
        return NextResponse.json({ entry: saved }, { status: 201 });
      }
      return NextResponse.json({ error: data?.error || 'Unable to create journal entry' }, { status: response.status || 500 });
    }

    return NextResponse.json({ entry: data.entry || data });
  } catch (error) {
    console.error('Journal proxy POST error:', error);
    const saved: JournalEntry = {
      id: `fallback-${Date.now()}`,
      title: 'Untitled note',
      body: '',
      category: 'Notes',
      createdAt: new Date().toISOString(),
    };
    return NextResponse.json({ entry: saved }, { status: 201 });
  }
}

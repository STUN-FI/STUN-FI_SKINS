'use client';

import { useEffect, useMemo, useState } from 'react';

type JournalCategory = 'Operations' | 'Client' | 'Production' | 'Notes';

type JournalEntry = {
  _id?: string;
  id?: string;
  title: string;
  body: string;
  category: JournalCategory;
  createdAt: string;
};

const API_URL = '/api/journal';

export default function AdminJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<JournalCategory>('Notes');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadEntries = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(API_URL, { cache: 'no-store' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Unable to load journal entries');
      }

      const normalized = Array.isArray(data.entries)
        ? data.entries.map((entry: any) => ({
            id: entry._id || entry.id,
            title: entry.title || 'Untitled note',
            body: entry.body || '',
            category: ['Operations', 'Client', 'Production', 'Notes'].includes(entry.category) ? entry.category : 'Notes',
            createdAt: entry.createdAt || new Date().toISOString(),
          }))
        : [];

      setEntries(normalized);
    } catch (error) {
      console.error('Journal load failed:', error);
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const totalEntries = useMemo(() => entries.length, [entries]);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setBody('');
    setCategory('Notes');
  };

  const handleSave = async () => {
    if (!title.trim() && !body.trim()) return;

    setIsSaving(true);

    try {
      const payload = {
        title: title.trim(),
        body: body.trim(),
        category,
      };

      const method = editingId ? 'PATCH' : 'POST';
      const endpoint = editingId ? `${API_URL}/${editingId}` : API_URL;

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to save journal entry');
      }

      await loadEntries();
      resetForm();
    } catch (error) {
      console.error('Journal save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (entry: JournalEntry) => {
    setEditingId(String(entry.id ?? entry._id));
    setTitle(entry.title);
    setBody(entry.body);
    setCategory(entry.category);
  };

  const handleDelete = async (id: string) => {
    if (!id) return;

    try {
      const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Unable to delete journal entry');
      }

      if (editingId === id) {
        resetForm();
      }

      await loadEntries();
    } catch (error) {
      console.error('Journal delete failed:', error);
    }
  };

  return (
    <section className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/50">Operations</p>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-black">Journal</h2>
        </div>

        <div className="rounded-full border border-black/10 bg-[#f7f7f5] px-3 py-1.5 text-sm font-semibold text-black">
          {totalEntries} entries
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.94fr_1.06fr]">
        <div className="space-y-4 rounded-[1.5rem] border border-black/10 bg-[#f7f7f5] p-4">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-black">Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Entry title"
              className="w-full rounded-2xl border border-black/10 bg-white px-3 py-3 text-black outline-none transition focus:border-black"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-black">Category</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as JournalCategory)}
              className="w-full rounded-2xl border border-black/10 bg-white px-3 py-3 text-black outline-none transition focus:border-black"
            >
              <option value="Operations">Operations</option>
              <option value="Client">Client</option>
              <option value="Production">Production</option>
              <option value="Notes">Notes</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-black">Notes</span>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={7}
              placeholder="Write today’s notes..."
              className="w-full rounded-2xl border border-black/10 bg-white px-3 py-3 text-black outline-none transition focus:border-black"
            />
          </label>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || (!title.trim() && !body.trim())}
              className="flex-1 rounded-full bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : editingId ? 'Update entry' : 'Save entry'}
            </button>

            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-black"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="rounded-[1.5rem] border border-dashed border-black/15 bg-[#f7f7f5] p-8 text-center text-sm text-black/60">
              Loading journal entries...
            </div>
          ) : entries.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-black/15 bg-[#f7f7f5] p-8 text-center text-sm text-black/60">
              No journal entries yet.
            </div>
          ) : (
            entries.map((entry) => (
              <article key={String(entry.id ?? entry._id)} className="rounded-[1.5rem] border border-black/10 bg-[#fafaf9] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-black/10 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-black/60">
                        {entry.category}
                      </span>
                      <span className="text-[11px] text-black/45">
                        {new Date(entry.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-black text-black">{entry.title}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(entry)}
                      className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-black"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(String(entry.id ?? entry._id))}
                      className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-black/75">{entry.body}</p>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

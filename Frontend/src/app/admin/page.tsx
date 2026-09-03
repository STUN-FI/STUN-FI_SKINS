'use client';

import { useEffect, useState } from 'react';
import AdminJournal from '../../components/AdminJournal';
import AdminOrders from '../../components/AdminOrders';
import BrandedLogo from '../../components/BrandedLogo';

const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN || '1234';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = window.localStorage.getItem('stunfi-admin-auth');
    if (saved === ADMIN_PIN) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleSubmit = () => {
    if (pin === ADMIN_PIN) {
      window.localStorage.setItem('stunfi-admin-auth', ADMIN_PIN);
      setIsAuthenticated(true);
      setError('');
      return;
    }

    setError('Invalid passcode. Please try again.');
  };

  const handleLogout = () => {
    window.localStorage.removeItem('stunfi-admin-auth');
    setIsAuthenticated(false);
    setPin('');
    setError('');
  };

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f3f3f1] px-4 py-8">
        <div className="w-full max-w-md rounded-[2rem] border border-black/10 bg-white p-8 shadow-glow">
          <BrandedLogo size="lg" />
          <p className="mt-3 text-sm text-black/70">
            Enter the administrative passcode to view the dashboard.
          </p>

          <label className="mt-8 block text-sm font-semibold text-black">
            Passcode
            <input
              type="password"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              className="mt-3 w-full rounded-3xl border border-black/10 bg-[#f7f7f5] px-4 py-3 text-black outline-none focus:border-black"
              placeholder="Enter PIN"
            />
          </label>

          {error ? (
            <div className="mt-4 rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleSubmit}
            className="mt-6 w-full rounded-3xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            Unlock Dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3f3f1] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
        >
          Logout
        </button>
      </div>
      <div className="space-y-8">
        <AdminOrders />
        <AdminJournal />
      </div>
    </main>
  );
}

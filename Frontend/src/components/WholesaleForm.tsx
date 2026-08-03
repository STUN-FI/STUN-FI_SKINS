'use client';

import { useMemo, useState } from 'react';
import { submitOrder } from '../lib/api';

type WholesaleFormState = {
  storeName: string;
  contactName: string;
  whatsappNumber: string;
  storeAddress: string;
  standardQty: number;
  shinyStonesQty: number;
  technicianRequested: boolean;
};

export default function WholesaleForm() {
  const [form, setForm] = useState<WholesaleFormState>({
    storeName: '',
    contactName: '',
    whatsappNumber: '',
    storeAddress: '',
    standardQty: 10,
    shinyStonesQty: 0,
    technicianRequested: false,
  });

  const totalUnits = useMemo(() => form.standardQty + form.shinyStonesQty, [form.standardQty, form.shinyStonesQty]);
  const moqSatisfied = totalUnits >= 10;
  const freeUnits = useMemo(() => Math.floor(totalUnits / 12), [totalUnits]);
  const unitsReceived = useMemo(() => totalUnits + freeUnits, [totalUnits, freeUnits]);
  const technicianFee = useMemo(() => (form.technicianRequested ? totalUnits * 500 : 0), [form.technicianRequested, totalUnits]);
  const totalCost = useMemo(() => form.standardQty * 2000 + form.shinyStonesQty * 2500 + technicianFee, [form.standardQty, form.shinyStonesQty, technicianFee]);

  const updateField = (key: keyof WholesaleFormState, value: string | number | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleWholesaleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        mode: 'wholesale',
        storeName: form.storeName,
        contactName: form.contactName,
        whatsappNumber: form.whatsappNumber,
        storeAddress: form.storeAddress,
        standardQty: form.standardQty,
        shinyStonesQty: form.shinyStonesQty,
        technicianRequested: form.technicianRequested,
      };

      const result = await submitOrder(payload);
      if (!result.success) {
        throw new Error(result.error || 'Wholesale order submission failed');
      }

      const orderId = result.orderId || 'PENDING';
      const message = encodeURIComponent(
        `Hello STUN-FI Skins,\n\n*Order Reference:* #${orderId}\nStore Name: ${form.storeName}\nContact Name: ${form.contactName}\nWhatsApp Number: ${form.whatsappNumber}\nStore Address: ${form.storeAddress}\nStandard Qty: ${form.standardQty}\nShiny Stones Qty: ${form.shinyStonesQty}\nTechnician Requested: ${form.technicianRequested ? 'Yes' : 'No'}\nTotal order cost: ₦${totalCost.toLocaleString()}\n\nPlease confirm this wholesale order request.`
      );

      window.open(`https://wa.me/2349064234807?text=${message}`, '_blank');
    } catch (error) {
      console.error(error);
      alert('Unable to submit wholesale order right now. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-glow backdrop-blur">
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-black/60">Wholesale order form</div>
        <h2 className="text-2xl font-black text-black">Store partner wholesale details</h2>
        <p className="text-sm text-black/70">Fill in your store info and inventory quantities for a wholesale order estimate.</p>
      </div>

      {!moqSatisfied ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          Minimum wholesale order is 10 units.
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-black">Store Name</span>
          <input
            type="text"
            value={form.storeName}
            onChange={(event) => updateField('storeName', event.target.value)}
            required
            className="w-full rounded-2xl border border-black/10 bg-[#f7f7f5] px-4 py-3 text-black outline-none focus:border-black"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-black">Contact Name</span>
          <input
            type="text"
            value={form.contactName}
            onChange={(event) => updateField('contactName', event.target.value)}
            required
            className="w-full rounded-2xl border border-black/10 bg-[#f7f7f5] px-4 py-3 text-black outline-none focus:border-black"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-black">WhatsApp Number</span>
          <input
            type="tel"
            value={form.whatsappNumber}
            onChange={(event) => updateField('whatsappNumber', event.target.value)}
            placeholder="e.g. +2348012345678"
            required
            className="w-full rounded-2xl border border-black/10 bg-[#f7f7f5] px-4 py-3 text-black outline-none focus:border-black"
          />
        </label>

        <label className="space-y-2 lg:col-span-2">
          <span className="text-sm font-semibold text-black">Store Address</span>
          <input
            type="text"
            value={form.storeAddress}
            onChange={(event) => updateField('storeAddress', event.target.value)}
            required
            className="w-full rounded-2xl border border-black/10 bg-[#f7f7f5] px-4 py-3 text-black outline-none focus:border-black"
          />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="space-y-2">
          <div className="flex items-center justify-between text-sm font-semibold text-black">
            <span>Standard Qty</span>
            <span className="text-black/60">₦2,000 / sheet</span>
          </div>
          <input
            type="number"
            min={0}
            step={1}
            value={form.standardQty}
            onChange={(event) => updateField('standardQty', Math.max(0, Number(event.target.value) || 0))}
            className="w-full rounded-2xl border border-black/10 bg-[#f7f7f5] px-4 py-3 text-black outline-none focus:border-black"
          />
        </label>

        <label className="space-y-2">
          <div className="flex items-center justify-between text-sm font-semibold text-black">
            <span>Shiny Stones Qty</span>
            <span className="text-black/60">₦2,500 / sheet</span>
          </div>
          <input
            type="number"
            min={0}
            step={1}
            value={form.shinyStonesQty}
            onChange={(event) => updateField('shinyStonesQty', Math.max(0, Number(event.target.value) || 0))}
            className="w-full rounded-2xl border border-black/10 bg-[#f7f7f5] px-4 py-3 text-black outline-none focus:border-black"
          />
        </label>
      </div>

      <label className="flex items-start gap-3 rounded-2xl border border-black/10 bg-[#f7f7f5] p-4">
        <input
          type="checkbox"
          checked={form.technicianRequested}
          onChange={(event) => updateField('technicianRequested', event.target.checked)}
          className="mt-1 h-5 w-5 accent-black"
        />
        <div className="text-sm text-black">
          <span className="font-semibold">Request STUN-FI On-Site Installation Technician</span>
          <div className="text-sm text-black/60">(+₦500/device)</div>
        </div>
      </label>

      <div className="rounded-[2rem] border border-black/10 bg-[#f7f7f5] p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-3xl bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-black/60">Total units</div>
            <div className="mt-2 text-3xl font-black text-black">{totalUnits}</div>
            <div className="mt-2 text-sm text-black/70">Includes standard and shiny stones units</div>
          </div>

          <div className="rounded-3xl bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-black/60">Free bonus</div>
            <div className="mt-2 text-3xl font-black text-black">{freeUnits}</div>
            <div className="mt-2 text-sm text-black/70">Earned with 12+1 wholesale bonus</div>
          </div>

          <div className="rounded-3xl bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-black/60">Units received</div>
            <div className="mt-2 text-3xl font-black text-black">{unitsReceived}</div>
            <div className="mt-2 text-sm text-black/70">Total stock delivered</div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-black/60">Total cost</div>
            <div className="mt-2 text-3xl font-black">₦{totalCost.toLocaleString()}</div>
          </div>

          <div className="rounded-3xl bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-black/60">Install fee</div>
            <div className="mt-2 text-3xl font-black">₦{technicianFee.toLocaleString()}</div>
          </div>
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={handleWholesaleSubmit}
            disabled={isSubmitting || !moqSatisfied}
            className="w-full rounded-3xl bg-black px-5 py-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-black/40"
          >
            {isSubmitting ? 'Creating Wholesale Order...' : 'Submit Wholesale Order'}
          </button>
        </div>
      </div>
    </div>
  );
}


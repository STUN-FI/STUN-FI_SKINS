'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';

// logo moved to public/img — use public path in Image src
import BrandedLogo from '../components/BrandedLogo';
import WholesaleForm from '../components/WholesaleForm';
import { formatCurrency, getSheetPrice } from '../lib/pricing';
import { submitOrder } from '../lib/api';

type DeviceType = 'laptop' | 'phone' | 'controller';
type FinishType = 'standard' | 'shiny-stones';
type Coverage = 'top-lid' | 'keyboard-deck' | 'bottom-base';

type SurfaceDesign = {
  customText: string;
  uploadLabel: string;
};

type OrderMode = 'individual' | 'wholesale';

type FormState = {
  device: DeviceType;
  coverage: Coverage[];
  finish: FinishType;
  customText: string;
  uploadLabel: string;
  installRequested: boolean;
  quantity: number;
  surfaceDesigns: Record<Coverage, SurfaceDesign>;
  mode: OrderMode;
  storeName: string;
};

type LineItem = {
  label: string;
  price: number;
};

const WHOLESALE_STANDARD_PER_SHEET = 2000;
const WHOLESALE_SHINY_PER_SHEET = 2500;
const WHOLESALE_MSRP_PER_SHEET = 4000;
const WHOLESALE_MIN_QTY = 10;

const DEVICE_OPTIONS = [
  { value: 'laptop', label: 'Laptop Wrap' },
  { value: 'phone', label: 'Phone Skin' },
  { value: 'controller', label: 'Game Controller' },
] as const;

const COVERAGE_OPTIONS: { value: Coverage; label: string }[] = [
  { value: 'top-lid', label: 'Top Lid' },
  { value: 'keyboard-deck', label: 'Keyboard Deck / Palmrest' },
  { value: 'bottom-base', label: 'Bottom Base' },
];

const FINISH_OPTIONS = [
  { value: 'standard', label: 'Standard Finish' },
  { value: 'shiny-stones', label: 'Shiny Stones Sparkle' },
] as const;

const BASE_PER_SHEET = 3500;
const SHINY_EXTRA_PER_SHEET = 500;
const FULL_LAPTOP_STANDARD = 10000;
const FULL_LAPTOP_SHINY = 11500;
const NAME_PRINT = 1000;
const DIY_DISCOUNT = 1500;
const SINGLE_DEVICE_STANDARD = 3500;
const SINGLE_DEVICE_SHINY = 4000;

const EMPTY_SURFACE_DESIGN: SurfaceDesign = {
  customText: '',
  uploadLabel: 'No design uploaded yet',
};

const DEFAULT_SURFACE_DESIGNS: Record<Coverage, SurfaceDesign> = {
  'top-lid': { ...EMPTY_SURFACE_DESIGN },
  'keyboard-deck': { ...EMPTY_SURFACE_DESIGN },
  'bottom-base': { ...EMPTY_SURFACE_DESIGN },
};

function getLaptopOrderPricing(
  coverage: Coverage[],
  finish: FinishType,
  installRequested: boolean,
  customText: string,
  mode: OrderMode,
) {
  const lineItems: LineItem[] = [];
  const sheetPrice = getSheetPrice(finish, mode);
  const selectedCount = coverage.length;

  if (selectedCount > 0) {
    if (selectedCount === 3 && mode === 'individual') {
      const packagePrice = finish === 'standard' ? FULL_LAPTOP_STANDARD : FULL_LAPTOP_SHINY;
      lineItems.push({ label: 'Full 3-piece laptop wrap', price: packagePrice });
    } else {
      coverage.forEach((item) => {
        const label = COVERAGE_OPTIONS.find((option) => option.value === item)?.label ?? item;
        lineItems.push({ label, price: sheetPrice });
      });
    }
  }

  if (customText.trim()) {
    lineItems.push({ label: 'Custom name / monogram', price: NAME_PRINT });
  }

  const hasFullLaptopDiscount = selectedCount === 3 && !installRequested;
  if (hasFullLaptopDiscount) {
    lineItems.push({ label: 'DIY discount', price: -DIY_DISCOUNT });
  }

  const total = lineItems.reduce((sum, item) => sum + item.price, 0);
  return { lineItems, total };
}

function getSingleDevicePricing(device: DeviceType, finish: FinishType, customText: string, mode: OrderMode) {
  const singlePrice = mode === 'wholesale' ? getSheetPrice(finish, mode) : finish === 'standard' ? SINGLE_DEVICE_STANDARD : SINGLE_DEVICE_SHINY;
  const lineItems: LineItem[] = [
    {
      label: `${DEVICE_OPTIONS.find((item) => item.value === device)?.label ?? 'Device'} - ${finish === 'standard' ? 'Standard Finish' : 'Shiny Stones Sparkle'}`,
      price: singlePrice,
    },
  ];

  if (customText.trim()) {
    lineItems.push({ label: 'Custom name / monogram', price: NAME_PRINT });
  }

  return {
    lineItems,
    total: lineItems.reduce((sum, line) => sum + line.price, 0),
  };
}

function calculateWholesaleTotal(finish: FinishType, quantity: number) {
  const unitPrice = finish === 'standard' ? WHOLESALE_STANDARD_PER_SHEET : WHOLESALE_SHINY_PER_SHEET;
  const freeBonus = Math.floor(quantity / 12);
  const totalReceived = quantity + freeBonus;
  const totalCost = quantity * unitPrice;
  const estimatedProfit = totalReceived * WHOLESALE_MSRP_PER_SHEET - totalCost;

  return {
    unitPrice,
    totalPaidSheets: quantity,
    freeBonus,
    totalReceived,
    totalCost,
    estimatedProfit,
    moqWarning: quantity < WHOLESALE_MIN_QTY,
  };
}

export default function HomePage() {
  const [form, setForm] = useState<FormState>({
    device: 'laptop',
    coverage: ['top-lid', 'keyboard-deck', 'bottom-base'],
    finish: 'standard',
    customText: '',
    uploadLabel: 'No design uploaded yet',
    installRequested: true,
    quantity: 1,
    surfaceDesigns: DEFAULT_SURFACE_DESIGNS,
    mode: 'individual',
    storeName: '',
  });

  const wholesaleSummary = useMemo(() => calculateWholesaleTotal(form.finish, form.quantity), [form.finish, form.quantity]);

  const orderSummary = useMemo(() => {
    if (form.device === 'laptop') {
      return getLaptopOrderPricing(form.coverage, form.finish, form.installRequested, form.customText, form.mode);
    }

    return getSingleDevicePricing(form.device, form.finish, form.customText, form.mode);
  }, [form]);

  const subtotal = useMemo(() => {
    return orderSummary.total * form.quantity;
  }, [orderSummary.total, form.quantity]);

  const orderTotal = form.mode === 'wholesale' ? wholesaleSummary.totalCost : subtotal;

  const receiptTitle = form.mode === 'wholesale' ? 'STUN-FI SKINS WHOLESALE RECEIPT' : 'STUN-FI SKINS RECEIPT';

  const getReceiptLines = () => {
    const finishLabel = form.finish === 'standard' ? 'Standard Finish' : 'Shiny Stones Sparkle Finish';
    const coverageSummary =
      form.device === 'laptop'
        ? form.coverage.length > 0
          ? form.coverage.map((item) => COVERAGE_OPTIONS.find((option) => option.value === item)?.label).join(', ')
          : 'No coverage selected'
        : 'Single item order';

    const surfaceDesignLines =
      form.device === 'laptop' && form.coverage.length > 0
        ? form.coverage.map((item) => {
            const label = COVERAGE_OPTIONS.find((option) => option.value === item)?.label ?? item;
            const design = form.surfaceDesigns[item];
            return `${label}: ${design.customText || 'No custom text'} | ${design.uploadLabel}`;
          })
        : [`Design upload: ${form.uploadLabel}`];

    return [
      receiptTitle,
      form.mode === 'wholesale' ? `Store / Brand: ${form.storeName || 'N/A'}` : `Device: ${DEVICE_OPTIONS.find((device) => device.value === form.device)?.label ?? form.device}`,
      `Coverage: ${coverageSummary}`,
      `Finish: ${finishLabel}`,
      `Custom text / name: ${form.customText.trim() || 'None'}`,
      `Installation requested: ${form.installRequested ? 'Yes' : 'No'}`,
      `Quantity: ${form.quantity}`,
      ...surfaceDesignLines,
      ...(form.mode === 'wholesale'
        ? [
            `Unit price: ${formatCurrency(wholesaleSummary.unitPrice)}`,
            `Free bonus skins: ${wholesaleSummary.freeBonus}`,
            `Total items to receive: ${wholesaleSummary.totalReceived}`,
          ]
        : []),
      `Order breakdown: ${orderSummary.lineItems.map((line) => `${line.label} ${formatCurrency(line.price)}`).join(' | ')}`,
      `TOTAL: ${formatCurrency(form.mode === 'wholesale' ? wholesaleSummary.totalCost : subtotal)}`,
    ];
  };

  const createReceiptHtml = () => {
    const rows = getReceiptLines()
      .map((line) => {
        const isTotal = line.startsWith('TOTAL:');
        return `<div class="receipt-row ${isTotal ? 'total' : ''}">${line}</div>`;
      })
      .join('');

    return `<!doctype html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>STUN-FI Skins Receipt</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
            * { box-sizing: border-box; }
            body {
              margin: 0;
              background: #f3f3f0;
              color: #111;
              font-family: 'Inter', Arial, sans-serif;
            }
            .receipt {
              max-width: 760px;
              margin: 36px auto;
              background: white;
              border: 1px solid #111;
              box-shadow: 0 18px 38px rgba(0,0,0,0.12);
            }
            .header {
              background: black;
              color: white;
              padding: 24px 32px 18px;
            }
            .brand {
              font-size: 30px;
              font-weight: 900;
              letter-spacing: 0.14em;
              text-transform: uppercase;
            }
            .small {
              font-size: 11px;
              letter-spacing: 0.2em;
              text-transform: uppercase;
              opacity: 0.8;
              margin-top: 10px;
            }
            .content {
              padding: 28px 32px 24px;
            }
            .receipt-row {
              padding: 9px 0;
              border-bottom: 1px solid #e8e5df;
              font-size: 14px;
              line-height: 1.7;
              word-break: break-word;
            }
            .receipt-row.total {
              margin-top: 18px;
              padding-top: 18px;
              border-top: 2px solid #111;
              border-bottom: none;
              font-weight: 800;
              font-size: 18px;
              letter-spacing: 0.04em;
            }
            .note {
              margin-top: 18px;
              padding-top: 16px;
              border-top: 1px solid #e8e5df;
              color: #333;
              font-size: 13px;
            }
            @media print {
              body { background: white; }
              .receipt { box-shadow: none; border: none; margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div class="brand">STUN-FI Skins</div>
              <div class="small">Order Receipt</div>
            </div>
            <div class="content">
              ${rows}
              <div class="note">Thank you for choosing STUN-FI Skins. Your custom order is confirmed.</div>
            </div>
          </div>
        </body>
      </html>`;
  };

  const createReceiptSvg = () => {
    const lines = getReceiptLines();
    const svgHeight = 210 + lines.length * 38 + 120;
    const textBlocks = lines
      .map((line, index) => {
        const isTotal = line.startsWith('TOTAL:');
        const fontSize = isTotal ? 26 : 18;
        const y = 180 + index * 38;
        const fill = isTotal ? '#111111' : '#222222';
        const weight = isTotal ? '700' : '500';
        const encoded = line
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');

        return `<text x="70" y="${y}" font-size="${fontSize}" fill="${fill}" font-weight="${weight}" font-family="Arial, Helvetica, sans-serif">${encoded}</text>`;
      })
      .join('');

    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="${svgHeight}" viewBox="0 0 1080 ${svgHeight}">
        <defs>
          <linearGradient id="headerGradient" x1="0" x2="1">
            <stop offset="0%" stop-color="#000000" />
            <stop offset="100%" stop-color="#1c1c1c" />
          </linearGradient>
        </defs>
        <rect width="1080" height="${svgHeight}" fill="#f5f5f3"/>
        <rect x="0" y="0" width="1080" height="170" fill="url(#headerGradient)"/>
        <text x="70" y="88" font-size="46" font-weight="900" fill="#ffffff" letter-spacing="8" font-family="Arial, Helvetica, sans-serif">STUN-FI</text>
        <text x="70" y="122" font-size="26" font-weight="700" fill="#ffffff" letter-spacing="5" font-family="Arial, Helvetica, sans-serif">SKINS</text>
        <text x="70" y="152" font-size="16" font-weight="600" fill="#d7d7d7" letter-spacing="2" font-family="Arial, Helvetica, sans-serif">ORDER RECEIPT</text>
        <rect x="60" y="170" width="960" height="${svgHeight - 230}" fill="#ffffff" stroke="#dcdcdc"/>
        ${textBlocks}
      </svg>
    `;
  };

  const buildOrderFormData = () => {
    const formData = new FormData();
    formData.append('mode', form.mode);
    formData.append('device', form.device);
    formData.append('coverage', JSON.stringify(form.coverage));
    formData.append('finish', form.finish);
    formData.append('customText', form.customText);
    formData.append('installRequested', String(form.installRequested));
    formData.append('quantity', String(form.quantity));
    formData.append('storeName', form.storeName || '');
    formData.append('surfaceDesigns', JSON.stringify(form.surfaceDesigns));

    form.coverage.forEach((surface) => {
      const input = document.getElementById(`surface-upload-${surface}`) as HTMLInputElement | null;
      const file = input?.files?.[0];
      if (file) {
        formData.append('files', file, file.name);
      }
    });

    const globalInput = document.getElementById('order-upload-reference') as HTMLInputElement | null;
    const globalFile = globalInput?.files?.[0];
    if (globalFile) {
      formData.append('files', globalFile, globalFile.name);
    }

    return formData;
  };

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePlaceOrder = () => {
    setShowOrderModal(true);
  };

  const handleSendToWhatsApp = async () => {
    setIsSubmitting(true);

    const createReceiptPngBlob = async () => {
      const svgMarkup = createReceiptSvg();
      const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new window.Image();

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Receipt image generation failed'));
        img.src = url;
      });

      const canvas = document.createElement('canvas');
      const width = 1080;
      const height = img.height ? Math.max(1400, img.height) : 1600;
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Canvas not available');
      }

      context.fillStyle = '#f5f5f3';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0, canvas.width, canvas.height);

      return await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => {
          if (result) {
            resolve(result);
            return;
          }
          reject(new Error('PNG generation failed'));
        }, 'image/png');
      });
    };

    try {
      const orderData = buildOrderFormData();
      const result = await submitOrder(orderData);
      const orderId = result.orderId || 'PENDING';
      if (!result.success) {
        throw new Error(result.error || 'Order creation failed');
      }

      const pngBlob = await createReceiptPngBlob();
      const receiptFile = new File([pngBlob], 'stunfi-receipt.png', { type: 'image/png' });

      const orderRefLine = `*Order Reference:* #${orderId}`;
      const stockDetails = form.device === 'laptop' && form.coverage.length > 0
        ? form.coverage.map((item) => `${COVERAGE_OPTIONS.find((option) => option.value === item)?.label ?? item}: 1`).join(', ')
        : `${DEVICE_OPTIONS.find((item) => item.value === form.device)?.label ?? form.device}: ${form.quantity}`;

      const wholesaleMessage = encodeURIComponent(
        `Hello STUN-FI Skins,

${orderRefLine}
Store Name: ${form.storeName || 'N/A'}
Mode: Wholesale
Finish: ${form.finish === 'standard' ? 'Standard' : 'Shiny Stones'}
Stock details: ${stockDetails}
Quantity ordered: ${wholesaleSummary.totalPaidSheets} sheets
Total received: ${wholesaleSummary.totalReceived} sheets
Free bonus skins: ${wholesaleSummary.freeBonus}
Unit price: ${formatCurrency(wholesaleSummary.unitPrice)}
Order total: ${formatCurrency(wholesaleSummary.totalCost)}
Estimated turnaround: 24-48 hrs

Please confirm this wholesale order request.`
      );
      const retailMessage = encodeURIComponent(
        `Hello STUN-FI Skins,

${orderRefLine}
I am placing a device wrap order for ${formatCurrency(subtotal)}. Please check the image and confirm.`
      );
      const message = form.mode === 'wholesale' ? wholesaleMessage : retailMessage;

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [receiptFile] })) {
        await navigator.share({
          title: 'STUN-FI Skins Receipt',
          text: `Order Reference: #${orderId}`,
          files: [receiptFile],
        });
        setShowOrderModal(false);
        return;
      }

      const pngUrl = URL.createObjectURL(pngBlob);
      window.open(`https://wa.me/2349064234807?text=${message}`, '_blank');
      window.open(pngUrl, '_blank', 'width=900,height=1200');
      setShowOrderModal(false);
    } catch (error) {
      const orderId = 'PENDING';
      const fallbackMessage = encodeURIComponent(
        form.mode === 'wholesale'
          ? `Hello STUN-FI Skins, I am requesting a wholesale order for ${form.quantity} sheets (receive ${wholesaleSummary.totalReceived} with free bonus ${wholesaleSummary.freeBonus}). Please confirm. *Order Reference:* #${orderId}`
          : `Hello STUN-FI Skins, here is my receipt: ${formatCurrency(subtotal)}. Please confirm my order. *Order Reference:* #${orderId}`
      );
      window.open(`https://wa.me/2349064234807?text=${fallbackMessage}`, '_blank');
      setShowOrderModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitOrder = async () => {
    setIsSubmitting(true);
    try {
      const result = await submitOrder(buildOrderFormData());
      if (!result.success) {
        throw new Error(result.error || 'Order submission failed');
      }

      alert(`Order submitted — ID: ${result.orderId}`);
      setShowOrderModal(false);
    } catch (err) {
      console.error(err);
      alert('Failed to submit order. See console for details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadReceipt = () => {
    const receiptWindow = window.open('', '_blank', 'width=900,height=1200');
    if (!receiptWindow) {
      return;
    }

    receiptWindow.document.write(createReceiptHtml());
    receiptWindow.document.close();
    receiptWindow.focus();
    setTimeout(() => receiptWindow.print(), 300);
    setShowOrderModal(false);
  };

  const updateDevice = (device: DeviceType) => {
    setForm((current) => ({
      ...current,
      device,
      coverage: device === 'laptop' ? ['top-lid', 'keyboard-deck', 'bottom-base'] : [],
    }));
  };

  const toggleCoverage = (value: Coverage) => {
    setForm((current) => {
      const currentCoverage = current.coverage.includes(value)
        ? current.coverage.filter((item) => item !== value)
        : [...current.coverage, value];
      return { ...current, coverage: currentCoverage };
    });
  };

  return (
    <main className="scroll-smooth min-h-screen overflow-x-hidden bg-[#f3f3f1] px-4 py-10 text-black md:px-8">
      <div className="mx-auto max-w-6xl">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 rounded-[2.5rem] border border-black/10 bg-white/90 p-5 sm:p-6 shadow-glow backdrop-blur"
        >
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-14 w-14 min-w-[3.5rem] items-center justify-center rounded-3xl bg-black p-2 sm:h-16 sm:w-16">
                <Image src="/img/stunfi-logo-white.png" alt="STUN-FI logo" className="h-full w-full object-contain" width={64} height={64} />
              </div>
              <div className="min-w-0">
                <BrandedLogo size="lg" />
                <p className="mt-1 text-xs sm:text-sm font-semibold uppercase tracking-[0.24em] text-black/70">your tech. your style</p>
              </div>
            </div>
          </div>
        </motion.header>

        <section className="mb-10 rounded-[2.5rem] border border-black/10 bg-white/90 p-6 sm:p-8 shadow-glow backdrop-blur">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.85fr] lg:items-center">
            <div className="space-y-5">
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.25em] text-black/60">Premium device wraps</p>
              <h1 className="max-w-full text-3xl font-black leading-tight tracking-[-0.04em] text-black sm:text-4xl xl:text-5xl">
                Precision Device Wraps &amp; Surface Protection
              </h1>
              <p className="max-w-full text-sm leading-7 text-black/70 sm:text-base">
                Transform your laptop, phone, or controller with high-grade vinyl and dazzling Shiny Stones sparkle finishes.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="#builder"
                  className="w-full rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 sm:w-auto"
                >
                  Customize Now
                </a>
                <a
                  href="#wholesale"
                  className="w-full rounded-2xl border border-black/10 bg-[#f7f7f5] px-6 py-3 text-sm font-semibold text-black transition hover:border-black sm:w-auto"
                >
                  Wholesale Info
                </a>
              </div>
            </div>
            <div className="rounded-[2rem] border border-black/10 bg-black/95 p-6 text-white shadow-xl">
              <div className="text-sm uppercase tracking-[0.25em] text-white/70">Build in minutes</div>
              <div className="mt-4 grid gap-4">
                <div className="rounded-3xl bg-white/5 p-4 sm:p-5">
                  <div className="text-sm text-white/70">Individual device orders</div>
                  <div className="mt-2 text-xl sm:text-2xl font-black">Laptops, phones, controllers</div>
                </div>
                <div className="rounded-3xl bg-white/5 p-4 sm:p-5">
                  <div className="text-sm text-white/70">Wholesale inventory</div>
                  <div className="mt-2 text-xl sm:text-2xl font-black">Store partner pricing</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-10 rounded-[2.5rem] border border-black/10 bg-white/90 p-5 shadow-glow backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-black/70">Order experience</p>
              <div className="mt-2 text-lg sm:text-xl font-black text-black">Select the right flow for your order</div>
            </div>
            <div className="flex flex-wrap gap-3 justify-start md:justify-end">
              {(['individual', 'wholesale'] as OrderMode[]).map((modeOption) => (
                <button
                  key={modeOption}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, mode: modeOption }))}
                  className={`rounded-3xl px-5 py-3 text-sm font-semibold transition ${
                    form.mode === modeOption
                      ? 'bg-black text-white'
                      : 'border border-black/10 bg-[#f7f7f5] text-black hover:border-black'
                  }`}
                >
                  {modeOption === 'individual'
                    ? '📱 Individual Device Builder'
                    : '🏪 Store Partner / Bulk Wholesale'}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[1.5fr_0.9fr]">
          <div className="space-y-8">
            {form.mode === 'individual' ? (
              <section id="builder" className="space-y-6 rounded-[2.5rem] border border-black/10 bg-white/90 p-6 shadow-glow backdrop-blur">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-black/70">1. Select device</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {DEVICE_OPTIONS.map((device) => (
                      <button
                        key={device.value}
                        type="button"
                        onClick={() => updateDevice(device.value)}
                        className={`rounded-[1.75rem] border-[3px] px-5 py-5 text-left transition-all duration-200 ${
                          form.device === device.value
                            ? 'border-black bg-white text-black shadow-[0_0_0_2px_rgba(0,0,0,0.04)]'
                            : 'border-black/10 bg-[#f7f7f5] text-black hover:border-black/30 hover:bg-white'
                        }`}
                      >
                        <div className="text-[1.05rem] font-semibold tracking-[-0.02em] md:text-[1.3rem]">{device.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {form.device === 'laptop' && (
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-black/70">2. Choose laptop coverage</p>
                    <div className="mt-4 space-y-3">
                      {COVERAGE_OPTIONS.map((option) => (
                        <label
                          key={option.value}
                          className={`flex min-w-0 flex-col gap-3 rounded-[1.5rem] border-[3px] px-4 py-4 transition-all duration-200 sm:flex-row sm:items-center sm:justify-between ${
                            form.coverage.includes(option.value)
                              ? 'border-black bg-white text-black shadow-[0_0_0_2px_rgba(0,0,0,0.04)]'
                              : 'border-black/10 bg-[#f7f7f5] text-black hover:border-black/30 hover:bg-white'
                          }`}
                        >
                          <span className="min-w-0 text-lg font-medium tracking-[-0.02em]">{option.label}</span>
                          <span className="min-w-0 text-base font-medium text-black/80 sm:ml-4">{formatCurrency(getSheetPrice(form.finish, form.mode))}</span>
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={form.coverage.includes(option.value)}
                            onChange={() => toggleCoverage(option.value)}
                          />
                        </label>
                      ))}
                    </div>

                    {form.coverage.length > 0 && (
                      <div className="mt-6 space-y-4 rounded-2xl border border-black/10 bg-[#f7f7f5] p-4">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-black/70">Surface designs</p>
                        {form.coverage.map((surface) => {
                          const option = COVERAGE_OPTIONS.find((item) => item.value === surface);
                          const design = form.surfaceDesigns[surface];

                          return (
                            <div key={surface} className="space-y-3 rounded-2xl border border-black/10 bg-white p-3">
                              <div className="text-sm font-semibold text-black">{option?.label ?? surface}</div>
                              <input
                                value={design.customText}
                                onChange={(event) =>
                                  setForm((current) => ({
                                    ...current,
                                    surfaceDesigns: {
                                      ...current.surfaceDesigns,
                                      [surface]: { ...current.surfaceDesigns[surface], customText: event.target.value },
                                    },
                                  }))
                                }
                                placeholder="Custom text for this surface"
                                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black"
                              />
                              <div className="space-y-2">
                                <input
                                  id={`surface-upload-${surface}`}
                                  type="file"
                                  onChange={(event) => {
                                    const fileName = event.target.files?.[0]?.name ?? 'No design uploaded yet';
                                    setForm((current) => ({
                                      ...current,
                                      surfaceDesigns: {
                                        ...current.surfaceDesigns,
                                        [surface]: { ...current.surfaceDesigns[surface], uploadLabel: fileName },
                                      },
                                    }));
                                  }}
                                  className="hidden"
                                />
                                <label
                                  htmlFor={`surface-upload-${surface}`}
                                  className="inline-flex w-full cursor-pointer items-center justify-between rounded-2xl border border-dashed border-black/20 bg-[#f7f7f5] px-4 py-3 text-sm font-medium text-black transition hover:border-black/40 hover:bg-white"
                                >
                                  <span className="min-w-0">Choose file</span>
                                  <span className="min-w-0 truncate text-black/60">{design.uploadLabel}</span>
                                </label>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-black/70">3. Choose finish</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {FINISH_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, finish: option.value }))}
                        className={`rounded-[1.5rem] border-[3px] p-4 text-left transition-all duration-200 ${
                          form.finish === option.value
                            ? 'border-black bg-white text-black shadow-[0_0_0_2px_rgba(0,0,0,0.04)]'
                            : 'border-black/10 bg-[#f7f7f5] text-black hover:border-black/30 hover:bg-white'
                        }`}
                      >
                        <div className="text-lg font-semibold tracking-[-0.02em]">{option.label}</div>
                        <div className="mt-2 text-sm text-black/70">
                          {form.mode === 'wholesale'
                            ? option.value === 'standard'
                              ? '₦2,000 per sheet wholesale'
                              : '₦2,500 per sheet wholesale'
                            : option.value === 'standard'
                            ? '₦3,500 per sheet'
                            : '₦4,000 per sheet'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-black/70">4. Customization</p>
                  <div className="mt-4 space-y-4">
                    <label className="block">
                      <span className="mb-2 block text-sm text-black/70">Custom name / monogram</span>
                      <input
                        value={form.customText}
                        onChange={(event) => setForm((current) => ({ ...current, customText: event.target.value }))}
                        placeholder="e.g. STUN"
                        className="w-full rounded-2xl border border-black/10 bg-[#f7f7f5] px-4 py-3 text-black outline-none ring-0 transition focus:border-black"
                      />
                    </label>

                    <label className="flex items-center justify-between rounded-2xl border border-black/10 bg-[#f7f7f5] px-4 py-3">
                      <div>
                        <div className="font-medium">Installation requested</div>
                        <div className="text-sm text-black/60">Turn off for DIY purchase</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={form.installRequested}
                        onChange={(event) => setForm((current) => ({ ...current, installRequested: event.target.checked }))}
                        className="h-5 w-5 accent-black"
                      />
                    </label>

                    <div className="block">
                      <span className="mb-2 block text-sm text-black/70">Upload design reference</span>
                      <input
                        id="order-upload-reference"
                        type="file"
                        onChange={(event) => {
                          const fileName = event.target.files?.[0]?.name ?? 'No design uploaded yet';
                          setForm((current) => ({ ...current, uploadLabel: fileName }));
                        }}
                        className="hidden"
                      />
                      <label
                        htmlFor="order-upload-reference"
                        className="inline-flex w-full cursor-pointer items-center justify-between rounded-2xl border border-dashed border-black/20 bg-[#f7f7f5] px-4 py-3 text-sm font-medium text-black transition hover:border-black/40 hover:bg-white"
                      >
                        <span className="min-w-0">Choose file</span>
                        <span className="min-w-0 truncate text-black/60">{form.uploadLabel}</span>
                      </label>
                    </div>

                    <label className="block">
                      <span className="mb-2 block text-sm text-black/70">{form.mode === 'wholesale' ? 'Sheets' : 'Quantity'}</span>
                      <input
                        type="number"
                        min={1}
                        value={form.quantity}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, quantity: Math.max(1, Number(event.target.value) || 1) }))
                        }
                        className="w-full rounded-2xl border border-black/10 bg-[#f7f7f5] px-4 py-3 text-black outline-none focus:border-black"
                      />
                    </label>
                  </div>
                </div>
              </section>
            ) : (
              <section id="wholesale" className="rounded-[2.5rem] border border-black/10 bg-white/90 p-6 shadow-glow backdrop-blur">
                <WholesaleForm />
              </section>
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-[2.5rem] border border-black/10 bg-white/90 p-5 sm:p-6 shadow-glow backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-black/70">Live order summary</p>
                  <h2 className="mt-2 text-2xl font-black text-black">{form.mode === 'individual' ? 'Individual order' : 'Wholesale estimate'}</h2>
                </div>
                <span className="rounded-full bg-black px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                  {form.mode === 'individual' ? 'Client' : 'Partner'} mode
                </span>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-3xl border border-black/10 bg-[#f7f7f5] p-4">
                  <div className="text-sm text-black/60">Total cost</div>
                  <div className="mt-2 text-3xl font-black text-black">{formatCurrency(orderTotal)}</div>
                </div>

                {form.mode === 'wholesale' ? (
                  <div className="space-y-4 rounded-3xl border border-black/10 bg-[#f7f7f5] p-4">
                    <div className="rounded-3xl bg-white p-4">
                      <div className="text-sm text-black/60">Unit price</div>
                      <div className="mt-1 text-lg font-semibold text-black">{formatCurrency(wholesaleSummary.unitPrice)} / sheet</div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-3xl bg-white p-4">
                        <div className="text-sm text-black/60">Free bonus skins</div>
                        <div className="mt-1 text-lg font-semibold text-black">{wholesaleSummary.freeBonus}</div>
                      </div>
                      <div className="rounded-3xl bg-white p-4">
                        <div className="text-sm text-black/60">Total received</div>
                        <div className="mt-1 text-lg font-semibold text-black">{wholesaleSummary.totalReceived}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-3xl border border-black/10 bg-[#f7f7f5] p-4">
                    <div className="text-sm text-black/60">Selected finish</div>
                    <div className="mt-1 text-lg font-semibold text-black">
                      {form.finish === 'standard' ? 'Standard' : 'Shiny Stones Sparkle'}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  className="w-full rounded-3xl bg-black px-5 py-4 text-sm font-semibold text-white transition hover:bg-neutral-800"
                >
                  Place order
                </button>
              </div>
            </div>
          </aside>
        </div>

        <section className="mt-12 rounded-[2.5rem] border border-black/10 bg-white/90 p-6 shadow-glow backdrop-blur">
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="rounded-3xl border border-black/10 bg-[#fafafa] p-6">
              <div className="text-4xl">🎯</div>
              <h3 className="mt-4 text-lg font-bold text-black">Precision Vector Fit</h3>
              <p className="mt-2 text-sm text-black/70">Exact cutouts for ports, cameras, and buttons for flawless wrap alignment.</p>
            </div>
            <div className="rounded-3xl border border-black/10 bg-[#fafafa] p-6">
              <div className="text-4xl">✨</div>
              <h3 className="mt-4 text-lg font-bold text-black">Shiny Stones Lamination</h3>
              <p className="mt-2 text-sm text-black/70">Dazzling light-catching sparkle that keeps devices looking premium.</p>
            </div>
            <div className="rounded-3xl border border-black/10 bg-[#fafafa] p-6">
              <div className="text-4xl">🛠️</div>
              <h3 className="mt-4 text-lg font-bold text-black">Free Campus Heat-Fitting</h3>
              <p className="mt-2 text-sm text-black/70">Professional bubble-free installation included with campus orders.</p>
            </div>
          </div>
        </section>

        <footer className="mt-16 rounded-[2.5rem] border border-black/10 bg-white/90 p-8 text-black/70 shadow-glow backdrop-blur">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.25em] text-black/60">STUN-FI Hub</div>
              <div className="mt-3">
                <BrandedLogo />
              </div>
              <p className="mt-3 max-w-xl text-sm leading-7 text-black/70">
                Campus-first device protection with a focus on premium fit, high-shine finishes, and fast on-site fitting for students and retailers.
              </p>
            </div>
            <div className="space-y-4 rounded-3xl border border-black/10 bg-[#f7f7f5] p-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-black/70">Contact</p>
                <a
                  href="https://wa.me/2349064234807"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block text-lg font-semibold text-black"
                >
                  WhatsApp: +234 906 423 4807
                </a>
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-black/70">Location</p>
                <p className="mt-2 text-sm text-black/70">Enugu State, Nigeria</p>
              </div>
            </div>
          </div>
          <div className="mt-10 border-t border-black/10 pt-6 text-sm text-black/50">
            © {new Date().getFullYear()} STUN-FI HUB. All rights reserved.
          </div>
        </footer>
      </div>

      {showOrderModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4"
          onClick={() => setShowOrderModal(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-4 shadow-2xl sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/60 sm:text-xs">Order ready</p>
                <h3 className="mt-2 text-xl font-black text-black sm:text-2xl">Place your order</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowOrderModal(false)}
                className="rounded-full border border-black/10 px-2.5 py-1 text-sm font-medium text-black"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-black/10 bg-[#f7f7f5] shadow-[0_10px_25px_rgba(0,0,0,0.06)]">
              <div className="bg-black px-4 py-3 text-white sm:px-5 sm:py-4">
                <div
                  className="text-lg font-black uppercase tracking-[0.12em] sm:text-xl"
                  style={{
                    fontFamily: 'Impact, "Arial Black", "Comic Sans MS", cursive',
                    letterSpacing: '0.12em',
                    transform: 'skewX(-8deg)',
                  }}
                >
                  STUN-FI Skins
                </div>
                <div className="mt-1 text-[9px] font-medium uppercase tracking-[0.24em] text-white/70 sm:text-[10px]">Receipt preview</div>
              </div>

              <div className="max-h-52 overflow-y-auto p-3 sm:max-h-64 sm:p-4">
                <div className="space-y-2 text-xs text-black sm:text-sm">
                  {getReceiptLines().map((line, index) => {
                    const isTotal = line.startsWith('TOTAL:');
                    return (
                      <div
                        key={`${line}-${index}`}
                        className={`border-b border-black/10 pb-2 last:border-b-0 last:pb-0 ${
                          isTotal ? 'pt-3 font-black text-sm text-black sm:text-base' : ''
                        }`}
                      >
                        {line}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {isSubmitting ? (
              <div className="rounded-3xl border border-black/10 bg-[#f7f7f5] p-4 text-center text-sm font-semibold text-black">
                Creating Order... Please wait.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  onClick={handleDownloadReceipt}
                  className="w-full rounded-2xl border border-black bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-neutral-100 sm:text-base"
                >
                  Download receipt
                </button>
                <button
                  type="button"
                  onClick={handleSendToWhatsApp}
                  className="w-full rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 sm:text-base"
                >
                  Send to WhatsApp
                </button>
                <button
                  type="button"
                  onClick={handleSubmitOrder}
                  className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 sm:text-base"
                >
                  Submit order
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { useMemo, useState } from 'react';

// logo moved to public/img — use public path in Image src
import BrandedLogo from '../components/BrandedLogo';
import WholesaleForm from '../components/WholesaleForm';
import ClientBuilder, { type ReceiptData } from '../components/ClientBuilder';
import ApplicationGuideSection from '../components/ApplicationGuideSection';
import VideoShowcase from '../components/VideoShowcase';
import ReceiptModal from '../components/ReceiptModal';
import HelpModal from '../components/HelpModal';
import CatalogGalleryModal from '../components/CatalogGalleryModal';
import FloatingPricingButton from '../components/FloatingPricingButton';
import { formatCurrency, getSheetPrice, type LaptopSurface } from '../lib/pricing';
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
  { value: 'shiny-stones', label: 'Premium' },
  { value: 'standard', label: 'Standard (- ₦500)' },
] as const;

const BASE_PER_SHEET = 3000;
const SHINY_EXTRA_PER_SHEET = 500;
const FULL_LAPTOP_STANDARD = 9000;
const FULL_LAPTOP_SHINY = 10500;
const NAME_PRINT = 1000;
const DIY_DISCOUNT = 1500;
const SINGLE_DEVICE_STANDARD = 3000;
const SINGLE_DEVICE_SHINY = 3500;

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

  // Always show individual surfaces
  if (selectedCount > 0) {
    coverage.forEach((item) => {
      const label = COVERAGE_OPTIONS.find((option) => option.value === item)?.label ?? item;
      lineItems.push({ label, price: sheetPrice });
    });
  }

  if (customText.trim()) {
    lineItems.push({ label: 'Custom name / monogram', price: NAME_PRINT });
  }

  const hasFullLaptopDiscount = selectedCount === 3 && !installRequested;
  if (hasFullLaptopDiscount) {
    lineItems.push({ label: 'Self-application', price: -DIY_DISCOUNT });
  }

  const total = lineItems.reduce((sum, item) => sum + item.price, 0);
  return { lineItems, total };
}

function getSingleDevicePricing(device: DeviceType, finish: FinishType, customText: string, mode: OrderMode) {
  const singlePrice = mode === 'wholesale' ? getSheetPrice(finish, mode) : finish === 'standard' ? SINGLE_DEVICE_STANDARD : SINGLE_DEVICE_SHINY;
  const lineItems: LineItem[] = [
    {
      label: `${DEVICE_OPTIONS.find((item) => item.value === device)?.label ?? 'Device'} - ${finish === 'standard' ? 'Standard (- ₦500)' : 'Premium'}`,
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

type OrderModeSelectorProps = {
  mode: OrderMode | null;
  onChange: (mode: OrderMode) => void;
};

function OrderModeSelector({ mode, onChange }: OrderModeSelectorProps) {
  return (
    <section className="mb-8 rounded-[2rem] border border-black/10 bg-white/90 p-5 shadow-glow backdrop-blur sm:p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#2f7777]">Order type</p>
          <div className="mt-2 text-2xl font-black tracking-[-0.03em] text-black">How are you ordering?</div>
        </div>
        <div className="grid w-full gap-2 md:max-w-xl md:grid-cols-2">
          {(['individual', 'wholesale'] as OrderMode[]).map((modeOption) => (
            <button
              key={modeOption}
              type="button"
              onClick={() => onChange(modeOption)}
              aria-pressed={mode === modeOption}
              className={`relative min-h-[4.75rem] rounded-2xl border-2 px-4 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-[#2f8f8f] ${
                mode === modeOption
                  ? 'border-black bg-black text-white shadow-md'
                  : 'border-black/10 bg-[#f7f7f5] text-black hover:border-black/35'
              }`}
            >
              <span className="flex items-center gap-3">
                <i className={`bx ${modeOption === 'individual' ? 'bx-mobile' : 'bx-store'} text-xl ${mode === modeOption ? 'text-[#2f8f8f]' : 'text-black/55'}`} aria-hidden="true" />
                <span>
                  <span className="block text-sm font-black">{modeOption === 'individual' ? 'Personal' : 'Wholesale'}</span>
                  <span className={`mt-1 block text-xs ${mode === modeOption ? 'text-white/65' : 'text-black/55'}`}>{modeOption === 'individual' ? 'One device for yourself' : 'Bulk orders for your store'}</span>
                </span>
              </span>
              {mode === modeOption ? <i className="bx bx-check absolute right-3 top-3 text-lg text-[#2f8f8f]" aria-hidden="true" /> : null}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const standalone = usePathname() === '/customize';
  const prefersReducedMotion = useReducedMotion();
  const sectionReveal = {
    initial: prefersReducedMotion ? false : { opacity: 0, y: 22 },
    whileInView: prefersReducedMotion ? undefined : { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.14 },
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  };
  const [form, setForm] = useState<FormState>({
    device: 'laptop',
    coverage: ['top-lid', 'keyboard-deck', 'bottom-base'],
    finish: 'shiny-stones',
    customText: '',
    uploadLabel: 'No design uploaded yet',
    installRequested: true,
    quantity: 1,
    surfaceDesigns: DEFAULT_SURFACE_DESIGNS,
    mode: 'individual',
    storeName: '',
  });
  const [selectedOrderMode, setSelectedOrderMode] = useState<OrderMode | null>(null);
  const [showFloatingPricing, setShowFloatingPricing] = useState(false);
  const [builderLineItems, setBuilderLineItems] = useState<Array<{ label: string; price: number }>>([]);

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
    const finishLabel = form.finish === 'standard' ? 'Standard (- ₦500)' : 'Premium';
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

  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [catalogSurface, setCatalogSurface] = useState<LaptopSurface | null>(null);
  const [catalogSelection, setCatalogSelection] = useState<{ surface: LaptopSurface; imageUrl: string } | null>(null);
  const [builderPrice, setBuilderPrice] = useState<number | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalBuilderSubmitting, setGlobalBuilderSubmitting] = useState(false);
  const [customerDetails, setCustomerDetails] = useState<{ name: string; phone: string; category: string }>({
    name: '',
    phone: '',
    category: 'laptop',
  });

  const handleReceiptOpen = (receipt: ReceiptData) => {
    setReceiptData(receipt);
    setReceiptOpen(true);
  };

  const handleReceiptClose = () => {
    setReceiptOpen(false);
    setReceiptData(null);
  };

  const handleHelpOpen = () => {
    setHelpOpen(true);
  };

  const handleCatalogOpen = (surface: LaptopSurface) => {
    setCatalogSurface(surface);
    setCatalogOpen(true);
  };

  const handleCatalogSelect = (imageUrl: string) => {
    if (!catalogSurface) return;
    setCatalogSelection({ surface: catalogSurface, imageUrl });
    setCatalogOpen(false);
    setCatalogSurface(null);
  };

  const handleCustomerDetailsChange = (details: { name: string; phone: string; category: string }) => {
    setCustomerDetails(details);
  };

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
Finish: ${form.finish === 'standard' ? 'Standard (- ₦500)' : 'Premium'}
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

  if (standalone) {
    return (
      <main className="min-h-screen overflow-x-hidden bg-[#f3f3f1] px-4 pb-24 pt-6 text-black md:px-8 md:py-10">
        <div className="customize-shell mx-auto w-full max-w-5xl">
          <header className="customize-header mb-6 flex items-center justify-between gap-3 border-b border-black/10 py-2 sm:mb-8 sm:gap-4 sm:py-3">
            <a href="/" className="flex min-w-0 items-center gap-3" aria-label="Back to STUN-FI Skins home">
              <div className="flex h-9 w-9 min-w-[2.25rem] items-center justify-center rounded-lg bg-black p-1.5 sm:h-10 sm:w-10 sm:min-w-[2.5rem] sm:rounded-xl">
                <Image src="/img/stunfi-logo-white.png" alt="STUN-FI logo" className="h-full w-full object-contain" width={44} height={44} priority />
              </div>
              <div className="min-w-0">
                <BrandedLogo size="compact" />
                <p className="hidden text-[10px] font-semibold uppercase tracking-[0.24em] text-black/55 sm:block">your tech. your style</p>
              </div>
            </a>
            <a href="/" className="inline-flex min-h-9 items-center rounded-full border border-black/15 px-3 text-xs font-semibold text-black transition hover:border-black sm:min-h-10 sm:px-4 sm:text-sm">
              <i className="bx bx-arrow-back mr-2" aria-hidden="true" /> Back home
            </a>
          </header>

          {selectedOrderMode === null ? (
            <>
              <section className="customize-intro mb-8 max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#2f7777]">STUN-FI SKINS / CUSTOMIZER</p>
                <h1 className="mt-3 text-4xl font-black leading-[0.98] tracking-[-0.05em] sm:text-6xl">Design your skin.</h1>
                <p className="mt-4 text-base font-medium text-black/60 sm:text-lg">Make your device yours.</p>
              </section>

              <div className="animate-page-enter">
                <OrderModeSelector
                mode={selectedOrderMode}
                onChange={(mode) => {
                  setSelectedOrderMode(mode);
                  setForm((current) => ({ ...current, mode }));
                }}
                />
              </div>
            </>
          ) : null}

          {selectedOrderMode === 'individual' ? (
            <ClientBuilder
              onReceiptOpen={handleReceiptOpen}
              onPriceChange={setBuilderPrice}
              onLineItemsChange={setBuilderLineItems}
              onStepChange={(step) => setShowFloatingPricing(step >= 3)}
              onHelpOpen={handleHelpOpen}
              onCatalogOpen={handleCatalogOpen}
              catalogSelection={catalogSelection}
              onSubmittingChange={setGlobalBuilderSubmitting}
              onCustomerDetailsChange={handleCustomerDetailsChange}
            />
          ) : selectedOrderMode === 'wholesale' ? (
            <section className="rounded-[2.5rem] border border-black/10 bg-white/90 p-5 shadow-glow backdrop-blur sm:p-6">
              <WholesaleForm />
            </section>
          ) : null}
        </div>

        {(selectedOrderMode === 'wholesale' || (selectedOrderMode === 'individual' && showFloatingPricing)) && (
          <FloatingPricingButton
            price={form.mode === 'wholesale' ? orderTotal : builderPrice}
            summaryItems={
              form.mode === 'wholesale'
                ? [{ label: 'Wholesale order', price: orderTotal }]
                : builderLineItems
            }
            customerName={form.mode === 'individual' ? customerDetails.name : undefined}
            customerPhone={form.mode === 'individual' ? customerDetails.phone : undefined}
            customerCategory={form.mode === 'individual' ? customerDetails.category : undefined}
          />
        )}

        {globalBuilderSubmitting ? (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4 rounded-[2rem] border border-white/10 bg-white/5 px-8 py-7 shadow-2xl backdrop-blur-md">
              <div className="rounded-full bg-white/10 p-4 shadow-lg shadow-black/30">
                <BrandedLogo className="text-white" size="lg" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">Processing order</p>
            </div>
          </div>
        ) : null}

        {receiptData && (
          <ReceiptModal
            isOpen={receiptOpen}
            orderId={receiptData.orderId}
            clientName={receiptData.clientName}
            deviceModel={receiptData.deviceModel}
            date={receiptData.date}
            category={receiptData.category}
            lineItems={receiptData.lineItems}
            totalPrice={receiptData.totalPrice}
            surfacePreviews={receiptData.surfacePreviews}
            onClose={handleReceiptClose}
          />
        )}

        <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
        <CatalogGalleryModal
          isOpen={catalogOpen}
          onClose={() => {
            setCatalogOpen(false);
            setCatalogSurface(null);
          }}
          onSelectArtwork={handleCatalogSelect}
        />
      </main>
    );
  }

  return (
    <main className="scroll-smooth min-h-screen overflow-x-hidden bg-[#f3f3f1] px-4 pb-24 pt-6 text-black md:px-8 md:py-10">
      <div className="w-full mx-auto max-w-6xl">
        <header className="landing-nav mb-6 border-b border-black/10 py-4 sm:mb-10">
          <div className="flex items-center justify-between gap-6">
            <a href="#top" className="flex min-w-0 items-center gap-3" aria-label="STUN-FI Skins home">
              <div className="flex h-10 w-10 min-w-[2.5rem] items-center justify-center rounded-xl bg-black p-2 sm:h-11 sm:w-11 sm:min-w-[2.75rem] sm:rounded-2xl">
                <Image src="/img/stunfi-logo-white.png" alt="STUN-FI logo" className="h-full w-full object-contain" width={44} height={44} priority />
              </div>
              <div className="min-w-0">
                <BrandedLogo size="base" />
                <p className="hidden text-[10px] font-semibold uppercase tracking-[0.24em] text-black/55 sm:block">your tech. your style</p>
              </div>
            </a>
            <nav className="hidden items-center gap-7 text-sm font-semibold text-black/65 lg:flex" aria-label="Primary navigation">
              <a className="transition hover:text-black" href="/customize">Customize</a>
              <a className="transition hover:text-black" href="#gallery">Gallery</a>
              <a className="transition hover:text-black" href="#how-it-works">How it works</a>
              <a className="transition hover:text-black" href="#showcase">Showcase</a>
              <a className="transition hover:text-black" href="/customize">Wholesale</a>
            </nav>
            <div className="flex items-center gap-2">
              <details className="relative lg:hidden">
                <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full border border-black/15 text-black focus:outline-none focus:ring-2 focus:ring-[#2f8f8f]" aria-label="Open navigation menu">
                  <i className="bx bx-menu text-xl" aria-hidden="true" />
                </summary>
                <nav className="absolute right-0 top-14 z-30 w-52 rounded-2xl border border-black/10 bg-white p-2 shadow-xl" aria-label="Mobile navigation">
                  <a className="block rounded-xl px-4 py-3 text-sm font-semibold hover:bg-[#f1f2ef]" href="/customize">Customize</a>
                  <a className="block rounded-xl px-4 py-3 text-sm font-semibold hover:bg-[#f1f2ef]" href="#gallery">Gallery</a>
                  <a className="block rounded-xl px-4 py-3 text-sm font-semibold hover:bg-[#f1f2ef]" href="#how-it-works">How it works</a>
                  <a className="block rounded-xl px-4 py-3 text-sm font-semibold hover:bg-[#f1f2ef]" href="#showcase">Showcase</a>
                  <a className="block rounded-xl px-4 py-3 text-sm font-semibold hover:bg-[#f1f2ef]" href="/customize">Wholesale</a>
                  <a className="mt-1 block rounded-xl bg-black px-4 py-3 text-center text-sm font-bold text-white hover:bg-neutral-800" href="/customize">Design Your Skin</a>
                </nav>
              </details>
              <a href="/customize" className="hidden rounded-full bg-black px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-neutral-800 sm:px-5 sm:text-sm lg:inline-flex">
                Design Your Skin
              </a>
            </div>
          </div>
        </header>

        <section id="top" className="landing-hero mb-10 overflow-hidden rounded-[2rem] bg-black text-white sm:rounded-[2.5rem]">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col justify-center p-7 sm:p-10 lg:p-14 xl:p-16"
            >
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.28em] text-[#66cccc]">Custom device wraps</p>
              <h1 className="max-w-xl text-5xl font-black leading-[0.94] tracking-[-0.055em] sm:text-6xl xl:text-7xl">Your device.<br />Your design.</h1>
              <p className="mt-6 max-w-md text-base leading-7 text-white/65 sm:text-lg">
                Premium custom skins precisely fitted to your device.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a href="/customize" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#66cccc] px-6 text-sm font-bold text-black transition hover:bg-[#8de0e0]">
                  Design Your Skin
                </a>
                <a href="#gallery" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 px-6 text-sm font-semibold text-white transition hover:border-white/50">
                  Explore Designs
                </a>
              </div>
              <p className="mt-8 border-t border-white/15 pt-5 text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
                Custom designs <span className="px-2 text-white/25">•</span> Precision fit <span className="px-2 text-white/25">•</span> Professional installation
              </p>
            </motion.div>
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.97 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="landing-hero-media relative min-h-[24rem] bg-[#d9ddda] sm:min-h-[30rem] lg:min-h-[36rem]"
            >
              <Image src="/img/ggg.jpg" alt="Custom STUN-FI skin applied to a laptop lid" fill priority className="object-cover object-center" sizes="(max-width: 1024px) 100vw, 60vw" />
              <div className="absolute bottom-5 left-5 rounded-full border border-black/10 bg-white/90 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-black backdrop-blur sm:bottom-7 sm:left-7">
                Precision fit / premium finish
              </div>
            </motion.div>
          </div>
        </section>

        <motion.section id="gallery" className="mb-10 scroll-mt-6" {...sectionReveal}>
          <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#2f7777]">STUN-FI Showcase</p>
              <h2 className="mt-2 max-w-xl text-3xl font-black leading-tight tracking-[-0.04em] text-black sm:text-4xl">Your design. On your device.</h2>
              <p className="mt-3 max-w-lg text-sm leading-6 text-black/60">Real skins, real devices, made to look like they belong there.</p>
            </div>
            <a href="/customize" className="inline-flex min-h-11 w-fit items-center rounded-full bg-black px-5 text-sm font-bold text-white transition hover:bg-neutral-800">
              Design yours <i className="bx bx-right-arrow-alt ml-2 text-lg" aria-hidden="true" />
            </a>
          </div>

          <div className="grid auto-rows-[10rem] grid-cols-2 gap-3 sm:auto-rows-[12rem] sm:gap-4 lg:grid-cols-4">
            <figure className="group relative col-span-2 row-span-2 overflow-hidden rounded-[1.75rem] bg-black sm:rounded-[2rem]">
              <Image src="/img/uuuu.jpg" alt="Custom skin applied to a laptop lid" fill className="object-cover transition duration-700 group-hover:scale-105" sizes="(max-width: 1024px) 50vw, 50vw" />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-5 pt-14 text-white sm:p-6 sm:pt-16">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#66cccc]">STUN-FI / CUSTOM</span>
                <strong className="mt-2 block text-xl font-black">Laptop transformation</strong>
                <span className="mt-1 block text-xs text-white/65">Laptop &bull; Premium finish</span>
              </figcaption>
            </figure>
            <figure className="group relative col-span-1 row-span-2 overflow-hidden rounded-[1.75rem] bg-black sm:rounded-[2rem]">
              <Image src="/img/Keyboard.jpg" alt="Custom skin applied across a laptop keyboard area" fill className="object-cover transition duration-700 group-hover:scale-105" sizes="(max-width: 1024px) 25vw, 25vw" />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12 text-white">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#66cccc]">STUN-FI / DETAIL</span>
                <strong className="mt-2 block text-base font-black">Built around the keys</strong>
              </figcaption>
            </figure>
            <figure className="group relative col-span-1 row-span-1 overflow-hidden rounded-[1.75rem] bg-black sm:rounded-[2rem]">
              <Image src="/img/jjj.jpg" alt="Striped custom skin design" fill className="object-cover transition duration-700 group-hover:scale-105" sizes="(max-width: 1024px) 25vw, 25vw" />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-10 text-white">
                <strong className="block text-sm font-black">Signature stripes</strong>
              </figcaption>
            </figure>
            <figure className="group relative col-span-1 row-span-1 overflow-hidden rounded-[1.75rem] bg-black sm:rounded-[2rem]">
              <Image src="/img/Bottom.jpg" alt="Custom skin applied to the underside of a laptop" fill className="object-cover transition duration-700 group-hover:scale-105" sizes="(max-width: 1024px) 25vw, 25vw" />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-10 text-white">
                <strong className="block text-sm font-black">Finished underneath</strong>
              </figcaption>
            </figure>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Made to be seen. Made to be yours.</p>
            <a href="/customize" className="inline-flex min-h-11 w-fit items-center text-sm font-bold text-black transition hover:text-[#2f7777]">
              Explore all designs <i className="bx bx-right-arrow-alt ml-2 text-lg" aria-hidden="true" />
            </a>
          </div>
        </motion.section>

        <motion.section id="showcase" className="mb-10 border-y border-black/10 py-10 scroll-mt-6 sm:py-14" {...sectionReveal}>
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-black/55">Why STUN-FI</p>
              <h2 className="mt-3 max-w-sm text-3xl font-black leading-tight tracking-[-0.04em] sm:text-4xl">Made to look right. Made to fit right.</h2>
            </div>
            <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2">
              {[
                ['01', 'Precision fit', 'Exact cutouts for ports, cameras, buttons, and edges.'],
                ['02', 'Premium materials', 'A considered finish that protects without adding bulk.'],
                ['03', 'Custom artwork', 'Choose from the catalog or bring a design that is yours.'],
                ['04', 'Professional fitting', 'Get a clean, bubble-free finish with on-site installation.'],
              ].map(([number, title, description]) => (
                <div key={number} className="border-t border-black/15 pt-4">
                  <span className="text-xs font-bold tracking-[0.2em] text-[#2f7777]">{number}</span>
                  <h3 className="mt-3 text-lg font-black">{title}</h3>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-black/62">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section id="finishes" className="mb-10 overflow-hidden rounded-[2rem] bg-[#e3e6e3] scroll-mt-6 sm:rounded-[2.5rem]" {...sectionReveal}>
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="p-7 sm:p-10 lg:p-14">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-black/55">Choose your finish</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">The final detail changes everything.</h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-black/65 sm:text-base">Keep it clean with Standard, or catch the light with our Shiny Stones premium finish.</p>
              <a href="/customize" className="mt-7 inline-flex min-h-11 items-center rounded-full bg-black px-5 text-sm font-semibold text-white transition hover:bg-neutral-800">Choose a finish</a>
            </div>
            <div className="grid min-h-[18rem] grid-cols-2">
              <div className="flex flex-col justify-end border-r border-black/10 bg-[#f5f5f3] p-6 sm:p-8">
                <div className="relative h-44 w-full overflow-hidden rounded-2xl border border-black/15 bg-white shadow-[inset_12px_12px_28px_rgba(0,0,0,0.12)] sm:h-56">
                  <Image src="/img/Standard%20(1).png" alt="Standard finish texture" fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover transition duration-700 hover:scale-105" />
                </div>
                <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-black/45">Matte finish</p>
                <p className="mt-1 text-sm font-bold uppercase tracking-[0.18em]">Standard</p>
                <p className="mt-2 text-sm text-black/60">Clean, understated, everyday.</p>
              </div>
              <div className="finish-shine flex flex-col justify-end bg-black p-6 text-white sm:p-8">
                <div className="relative h-44 w-full overflow-hidden rounded-2xl border border-white/35 bg-[#66cccc] shadow-[0_0_34px_rgba(102,204,204,0.55)] sm:h-56">
                  <Image src="/img/Shiny.png" alt="Shiny Stones finish texture" fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover transition duration-700 hover:scale-105" />
                </div>
                <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#66cccc]">Reflective finish</p>
                <p className="mt-1 text-sm font-bold uppercase tracking-[0.18em]">Shiny Stones</p>
                <p className="mt-2 text-sm text-white/60">Light-catching, unmistakably yours.</p>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section id="customization" className="mb-10 scroll-mt-6" {...sectionReveal}>
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="relative min-h-[20rem] overflow-hidden rounded-[2rem] bg-black sm:min-h-[28rem] sm:rounded-[2.5rem]">
              <Image src="/img/Stripes.jpg" alt="STUN-FI skin applied across a laptop keyboard area" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 55vw" />
              <div className="absolute bottom-5 left-5 rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-black">Preview before you order</div>
            </div>
            <div className="lg:pl-6">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-black/55">Make it personal</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Start with a design. Finish with your signature.</h2>
              <p className="mt-5 text-base leading-7 text-black/65">Pick a catalog artwork, upload your own image, or add custom text. Your choices stay visible as you build, so the finished skin never feels like a guess.</p>
              <div className="mt-7 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.14em] text-black/60">
                <span className="rounded-full border border-black/15 px-3 py-2">Catalog artwork</span>
                <span className="rounded-full border border-black/15 px-3 py-2">Your upload</span>
                <span className="rounded-full border border-black/15 px-3 py-2">Custom text</span>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section id="how-it-works" className="mb-10 rounded-[2rem] bg-black px-7 py-10 text-white scroll-mt-6 sm:rounded-[2.5rem] sm:px-10 sm:py-14" {...sectionReveal}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#58adad]">How it works</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Four steps from idea to device.</h2>
            </div>
            <a href="/customize" className="inline-flex min-h-11 w-fit items-center rounded-full bg-[#2f8f8f] px-5 text-sm font-bold text-white transition hover:bg-[#58adad]">Start building</a>
          </div>
          <div className="mt-10 grid gap-8 border-t border-white/15 pt-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['01', 'Choose your device'],
              ['02', 'Select your surfaces'],
              ['03', 'Make the design yours'],
              ['04', 'Confirm and get it fitted'],
            ].map(([number, title]) => (
              <div key={number}>
                <span className="text-sm font-bold text-[#58adad]">{number}</span>
                <h3 className="mt-4 max-w-[12rem] text-lg font-black leading-snug">{title}</h3>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section className="mt-12 overflow-hidden rounded-[2rem] bg-[#2f8f8f] px-7 py-10 text-white sm:rounded-[2.5rem] sm:px-10 sm:py-14" {...sectionReveal}>
          <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-black/60">Make the next move</p>
              <h2 className="mt-3 text-4xl font-black leading-[0.98] tracking-[-0.05em] sm:text-5xl">Ready to make your device yours?</h2>
              <p className="mt-5 max-w-lg text-base leading-7 text-black/65">Choose your device, bring your design, and see the full order before you commit.</p>
            </div>
            <a href="/customize" className="inline-flex min-h-12 w-fit items-center rounded-full bg-black px-6 text-sm font-bold text-white transition hover:bg-neutral-800">Design Your Skin</a>
          </div>
        </motion.section>

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
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-black/70">Follow us</p>
                <div className="mt-3 flex items-center gap-3">
                  <a
                    href="https://www.tiktok.com/@stunfihub?_r=1&_t=ZS-98vB2MbyYWS"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="TikTok"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-black transition hover:border-black hover:bg-black hover:text-white"
                  >
                    <i className="bx bxl-tiktok text-xl" />
                  </a>
                  <a
                    href="https://www.instagram.com/stunfihub?igsh=MWdwanc4cGJsZzFibw==&igsi=MWdwanc4cGJsZzFibw=="
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Instagram"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-black transition hover:border-black hover:bg-black hover:text-white"
                  >
                    <i className="bx bxl-instagram-alt text-xl" />
                  </a>
                  <a
                    href="https://x.com/Favor_2da_wrld"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="X"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-black transition hover:border-black hover:bg-black hover:text-white"
                  >
                    <i className="bx bxl-twitter text-xl" />
                  </a>
                </div>
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

      {globalBuilderSubmitting ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-[2rem] border border-white/10 bg-white/5 px-8 py-7 shadow-2xl backdrop-blur-md">
            <div className="animate-bounce rounded-full bg-white/10 p-4 shadow-lg shadow-black/30">
              <BrandedLogo className="text-white" size="lg" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">Processing order</p>
          </div>
        </div>
      ) : null}

      {receiptData && (
        <ReceiptModal
          isOpen={receiptOpen}
          orderId={receiptData.orderId}
          clientName={receiptData.clientName}
          deviceModel={receiptData.deviceModel}
          date={receiptData.date}
          category={receiptData.category}
          lineItems={receiptData.lineItems}
          totalPrice={receiptData.totalPrice}
          surfacePreviews={receiptData.surfacePreviews}
          onClose={handleReceiptClose}
        />
      )}

      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
      <CatalogGalleryModal
        isOpen={catalogOpen}
        onClose={() => {
          setCatalogOpen(false);
          setCatalogSurface(null);
        }}
        onSelectArtwork={handleCatalogSelect}
      />

      {showOrderModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4"
          onClick={() => setShowOrderModal(false)}
        >
          <div
            className="max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto rounded-3xl border border-black/10 bg-white p-4 shadow-2xl sm:p-5"
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
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 text-black focus:outline-none focus:ring-2 focus:ring-[#2f8f8f]"
                aria-label="Close order modal"
              >
                <i className="bx bx-x text-lg" />
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

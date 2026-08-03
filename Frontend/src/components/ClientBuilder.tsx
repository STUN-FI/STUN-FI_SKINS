'use client';

import { useMemo, useState } from 'react';
import { submitOrder } from '../lib/api';
import {
  calculateClientOrderPricing,
  Category,
  ControllerSubtype,
  FinishType,
  InstallationOption,
  LaptopSurface,
  PhoneCoverage,
  formatCurrency,
} from '../lib/pricing';
import LaptopPreviewModal from './LaptopPreviewModal';
import ReceiptModal from './ReceiptModal';

const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: 'laptop', label: 'Laptop' },
  { value: 'phone', label: 'Phone' },
  { value: 'controller', label: 'Controller' },
  { value: 'others', label: 'Others' },
];

const LAPTOP_SURFACES: { value: LaptopSurface; label: string }[] = [
  { value: 'top-lid', label: 'Top Lid' },
  { value: 'keyboard-deck', label: 'Keyboard Deck' },
  { value: 'bottom-base', label: 'Bottom Base' },
];

const PHONE_COVERAGE_OPTIONS: { value: PhoneCoverage; label: string }[] = [
  { value: 'back-panel', label: 'Back Panel Only' },
  { value: 'full-body', label: 'Full Body Wrap (+₦1,000)' },
];

const CONTROLLER_SUBTYPES: { value: ControllerSubtype; label: string }[] = [
  { value: 'ps3', label: 'PS3' },
  { value: 'ps4', label: 'PS4' },
  { value: 'ps5-dualsense', label: 'PS5 DualSense' },
  { value: 'xbox-360', label: 'Xbox 360' },
  { value: 'xbox-one', label: 'Xbox One' },
  { value: 'xbox-series', label: 'Xbox Series X/S' },
  { value: 'switch-pro', label: 'Nintendo Switch Pro' },
];

const ARTWORK_CATALOG = [
  { value: 'abstract-wave', label: 'Abstract Wave' },
  { value: 'neon-grid', label: 'Neon Grid' },
  { value: 'safari-print', label: 'Safari Print' },
];

const DEFAULT_LAPTOP_FINISHES: Record<LaptopSurface, FinishType> = {
  'top-lid': 'standard',
  'keyboard-deck': 'standard',
  'bottom-base': 'standard',
};

const DEFAULT_LAPTOP_TEXTS: Record<LaptopSurface, string> = {
  'top-lid': '',
  'keyboard-deck': '',
  'bottom-base': '',
};

const DEFAULT_LAPTOP_CATALOG: Record<LaptopSurface, string> = {
  'top-lid': '',
  'keyboard-deck': '',
  'bottom-base': '',
};

export default function ClientBuilder() {
  const [currentStep, setCurrentStep] = useState(1);
  const [clientName, setClientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [laptopModel, setLaptopModel] = useState('');
  const [category, setCategory] = useState<Category>('laptop');
  const [itemName, setItemName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [laptopSelectedSurfaces, setLaptopSelectedSurfaces] = useState<LaptopSurface[]>(['top-lid']);
  const [laptopFinishes, setLaptopFinishes] = useState<Record<LaptopSurface, FinishType>>(DEFAULT_LAPTOP_FINISHES);
  const [laptopTexts, setLaptopTexts] = useState<Record<LaptopSurface, string>>(DEFAULT_LAPTOP_TEXTS);
  const [laptopArtworkCatalog, setLaptopArtworkCatalog] = useState<Record<LaptopSurface, string>>(DEFAULT_LAPTOP_CATALOG);
  const [laptopArtworkFiles, setLaptopArtworkFiles] = useState<Record<LaptopSurface, File | null>>({
    'top-lid': null,
    'keyboard-deck': null,
    'bottom-base': null,
  });
  const [laptopInstallOption, setLaptopInstallOption] = useState<InstallationOption>('professional');

  const [phoneCoverage, setPhoneCoverage] = useState<PhoneCoverage>('back-panel');
  const [phoneFinish, setPhoneFinish] = useState<FinishType>('standard');
  const [phoneArtworkCatalog, setPhoneArtworkCatalog] = useState('');
  const [phoneArtworkFile, setPhoneArtworkFile] = useState<File | null>(null);
  const [phoneCustomText, setPhoneCustomText] = useState('');
  const [phoneInstallOption, setPhoneInstallOption] = useState<InstallationOption>('professional');

  const [controllerSubtype, setControllerSubtype] = useState<ControllerSubtype>('ps5-dualsense');
  const [controllerFinish, setControllerFinish] = useState<FinishType>('standard');
  const [controllerArtworkCatalog, setControllerArtworkCatalog] = useState('');
  const [controllerArtworkFile, setControllerArtworkFile] = useState<File | null>(null);
  const [controllerGamerTag, setControllerGamerTag] = useState('');
  const [controllerInstallOption, setControllerInstallOption] = useState<InstallationOption>('professional');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<string | null>(null);
  const [hasStartedSelection, setHasStartedSelection] = useState(false);
  const [previewSurface, setPreviewSurface] = useState<LaptopSurface | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    orderId: string;
    clientName: string;
    deviceModel: string;
    date: string;
    category: string;
    lineItems: Array<{ label: string; price: number }>;
    totalPrice: number;
  } | null>(null);

  const markSelectionStarted = () => setHasStartedSelection(true);

  const laptopsArtworkLabel = (surface: LaptopSurface) =>
    laptopArtworkFiles[surface]?.name || laptopArtworkCatalog[surface] || 'Choose artwork';

  const phoneArtworkLabel = phoneArtworkFile?.name || phoneArtworkCatalog || 'Choose artwork';
  const controllerArtworkLabel = controllerArtworkFile?.name || controllerArtworkCatalog || 'Choose artwork';

  const pricing = useMemo(
    () =>
      calculateClientOrderPricing({
        category,
        laptop: {
          selectedSurfaces: laptopSelectedSurfaces,
          finishes: laptopFinishes,
          customTexts: laptopTexts,
          installOption: laptopInstallOption,
        },
        phone: {
          coverage: phoneCoverage,
          finish: phoneFinish,
          customText: phoneCustomText,
          installOption: phoneInstallOption,
        },
        controller: {
          subtype: controllerSubtype,
          finish: controllerFinish,
          gamerTag: controllerGamerTag,
          installOption: controllerInstallOption,
        },
        others: {
          itemName,
          instructions,
        },
      }),
    [
      category,
      laptopSelectedSurfaces,
      laptopFinishes,
      laptopTexts,
      laptopInstallOption,
      phoneCoverage,
      phoneFinish,
      phoneCustomText,
      phoneInstallOption,
      controllerSubtype,
      controllerFinish,
      controllerGamerTag,
      controllerInstallOption,
      itemName,
      instructions,
    ],
  );

  const pricingQuotePending = 'quotePending' in pricing && pricing.quotePending;

  const canAdvanceToStep2 = clientName.trim() !== '' && phoneNumber.trim() !== '';
  const canAdvanceToStep3 =
    category !== 'others' || (itemName.trim() !== '' && instructions.trim() !== '');

  const isLaptopValid = laptopSelectedSurfaces.length > 0;
  const isPhoneValid = !!phoneCoverage;
  const isControllerValid = !!controllerSubtype;
  const isOthersValid = itemName.trim() !== '' && instructions.trim() !== '';

  const canAdvance = () => {
    if (currentStep === 1) return canAdvanceToStep2;
    if (currentStep === 2) {
      if (category === 'laptop') return isLaptopValid;
      if (category === 'phone') return isPhoneValid;
      if (category === 'controller') return isControllerValid;
      return isOthersValid;
    }
    return true;
  };

  const handleToggleLaptopSurface = (surface: LaptopSurface) => {
    markSelectionStarted();
    setLaptopSelectedSurfaces((current) =>
      current.includes(surface) ? current.filter((item) => item !== surface) : [...current, surface],
    );
  };

  const handleArtworkFileChange = (field: string, file: File | null) => {
    markSelectionStarted();
    if (category === 'phone' && field === 'phone') {
      setPhoneArtworkFile(file);
      if (!file) setPhoneArtworkCatalog('');
      return;
    }

    if (category === 'controller' && field === 'controller') {
      setControllerArtworkFile(file);
      if (!file) setControllerArtworkCatalog('');
      return;
    }

    if (field.startsWith('laptop-')) {
      const surface = field.replace('laptop-', '') as LaptopSurface;
      setLaptopArtworkFiles((current) => ({ ...current, [surface]: file }));
      if (!file) {
        setLaptopArtworkCatalog((current) => ({ ...current, [surface]: '' }));
      }
    }

    if (field === 'photo') {
      setPhotoFile(file);
    }
  };

  const handlePriceJump = () => {
    document.getElementById('price-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handlePreviewClose = () => {
    if (previewImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewImageUrl);
    }
    setPreviewSurface(null);
    setPreviewImageUrl('');
  };

  const buildOrderId = () => `STN-${Math.floor(1000 + Math.random() * 9000)}`;

  const buildArtworkDetails = () => {
    switch (category) {
      case 'laptop':
        return laptopSelectedSurfaces.map((surface) => {
          const label = laptopsArtworkLabel(surface);
          return `${LAPTOP_SURFACES.find((item) => item.value === surface)?.label ?? surface}: ${label}`;
        });
      case 'phone':
        return [`Artwork: ${phoneArtworkLabel}`];
      case 'controller':
        return [`Artwork: ${controllerArtworkLabel}`];
      case 'others':
        return [photoFile ? `Dimension photo: ${photoFile.name}` : 'No reference photo uploaded'];
      default:
        return [];
    }
  };

  const buildOrderPayload = () => {
    const payload: Record<string, any> = {
      clientName,
      phoneNumber,
      category,
      installationType:
        category === 'laptop'
          ? laptopInstallOption
          : category === 'phone'
          ? phoneInstallOption
          : category === 'controller'
          ? controllerInstallOption
          : undefined,
      orderSummary: pricing.lineItems.map((item) => `${item.label}: ${item.price >= 0 ? formatCurrency(item.price) : `-${formatCurrency(Math.abs(item.price))}`}`),
      totalPrice: pricingQuotePending ? 'Pending Quote' : formatCurrency(pricing.total),
    };

    if (category === 'laptop') {
      payload.laptop = {
        model: laptopModel,
        selectedSurfaces: laptopSelectedSurfaces,
        finishes: laptopSelectedSurfaces.map((surface) => ({ surface, finish: laptopFinishes[surface] })),
        customTexts: laptopSelectedSurfaces.map((surface) => ({ surface, text: laptopTexts[surface] })),
      };
    }

    if (category === 'phone') {
      payload.phone = {
        coverage: phoneCoverage,
        finish: phoneFinish,
        customText: phoneCustomText,
      };
    }

    if (category === 'controller') {
      payload.controller = {
        subtype: controllerSubtype,
        finish: controllerFinish,
        gamerTag: controllerGamerTag,
      };
    }

    if (category === 'others') {
      payload.others = {
        itemName,
        instructions,
      };
    }

    return payload;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const orderId = buildOrderId();
    const orderPayload = buildOrderPayload();
    const formData = new FormData();
    formData.append('clientName', clientName);
    formData.append('phoneNumber', phoneNumber);
    formData.append('category', category);
    formData.append('orderPayload', JSON.stringify(orderPayload));

    if (category === 'laptop') {
      laptopSelectedSurfaces.forEach((surface) => {
        const file = laptopArtworkFiles[surface];
        if (file) {
          formData.append(`artwork_${surface}`, file);
        }
      });
    }

    if (category === 'phone' && phoneArtworkFile) {
      formData.append('artwork_phone', phoneArtworkFile);
    }

    if (category === 'controller' && controllerArtworkFile) {
      formData.append('artwork_controller', controllerArtworkFile);
    }

    if (category === 'others' && photoFile) {
      formData.append('reference_photo', photoFile);
    }

    try {
      const result = await submitOrder(formData);
      const finalOrderId = result.orderId || orderId;

      if (result.success) {
        setSubmissionResult(`Order submitted successfully as #${finalOrderId}.`);
      } else {
        setSubmissionResult(`Order queued with reference #${finalOrderId}.`);
      }

      setReceiptData({
        orderId: finalOrderId,
        clientName,
        deviceModel:
          category === 'laptop'
            ? laptopModel || 'Laptop'
            : category === 'phone'
            ? PHONE_COVERAGE_OPTIONS.find((item) => item.value === phoneCoverage)?.label || 'Phone'
            : category === 'controller'
            ? CONTROLLER_SUBTYPES.find((item) => item.value === controllerSubtype)?.label || 'Controller'
            : itemName || 'Other',
        date: new Date().toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' }),
        category,
        lineItems: pricing.lineItems,
        totalPrice: pricingQuotePending ? 0 : pricing.total,
      });
      setReceiptOpen(true);
    } catch (error) {
      console.error('Order submission failed:', error);
      setSubmissionResult('Unable to send your order right now. Please try again or contact support.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="builder" className="mb-10 rounded-[2.5rem] border border-black/10 bg-white/90 p-6 shadow-glow backdrop-blur">
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-black/70">Client Order Configurator</p>
          <h2 className="mt-2 text-3xl font-black text-black">Build a custom device order</h2>
        </div>

        <div className="rounded-3xl border border-black/10 bg-[#f7f7f5] p-6">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-black">Order Category</span>
            <select
              value={category}
              onChange={(event) => {
                markSelectionStarted();
                setCategory(event.target.value as Category);
              }}
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black outline-none focus:border-black"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-black">Client Name</span>
              <input
                type="text"
                value={clientName}
                onChange={(event) => {
                  markSelectionStarted();
                  setClientName(event.target.value);
                }}
                placeholder="Enter client name"
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black outline-none focus:border-black"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-black">Phone Number</span>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(event) => {
                  markSelectionStarted();
                  setPhoneNumber(event.target.value);
                }}
                placeholder="Enter phone number"
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black outline-none focus:border-black"
              />
            </label>
          </div>
        </div>

        <div className="grid gap-6">
          {category === 'laptop' && (
            <div className="space-y-6 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-black/70">Laptop Customization</p>
                <p className="mt-2 text-base text-black/80">Select the surfaces you want wrapped and customize each.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-black">Laptop Model</span>
                  <input
                    type="text"
                    value={laptopModel}
                    onChange={(event) => {
                      markSelectionStarted();
                      setLaptopModel(event.target.value);
                    }}
                    placeholder="e.g. MacBook Pro 16"
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black outline-none focus:border-black"
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {LAPTOP_SURFACES.map((surface) => {
                  const selected = laptopSelectedSurfaces.includes(surface.value);
                  return (
                    <button
                      key={surface.value}
                      type="button"
                      onClick={() => handleToggleLaptopSurface(surface.value)}
                      className={`relative rounded-3xl border px-4 py-4 text-left text-sm font-semibold transition ${
                        selected
                          ? 'border-black bg-white text-black shadow-sm'
                          : 'border-black/10 bg-[#f7f7f5] text-black hover:border-black'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span>{surface.label}</span>
                        {selected ? (
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-black bg-black/5 text-black/80">
                            ✓
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>

              {laptopSelectedSurfaces.length === 0 ? (
                <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">Select at least one laptop surface to continue.</div>
              ) : (
                laptopSelectedSurfaces.map((surface) => (
                  <div key={surface} className="rounded-3xl border border-black/10 bg-[#f7f7f5] p-5">
                    <p className="text-sm font-semibold text-black">{LAPTOP_SURFACES.find((item) => item.value === surface)?.label}</p>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-sm text-black/70">Artwork upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) => handleArtworkFileChange(`laptop-${surface}`, event.target.files?.[0] ?? null)}
                          className="hidden"
                          id={`laptop-artwork-${surface}`}
                        />
                        <div className="flex items-center gap-3">
                          <label htmlFor={`laptop-artwork-${surface}`} className="inline-flex flex-1 cursor-pointer items-center justify-between rounded-2xl border border-dashed border-black/20 bg-white px-4 py-3 text-sm font-medium text-black transition hover:border-black/40">
                            <span>{laptopsArtworkLabel(surface)}</span>
                            <span className="text-black/60">Browse</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const file = laptopArtworkFiles[surface];
                              if (file) {
                                setPreviewSurface(surface);
                                setPreviewImageUrl(URL.createObjectURL(file));
                              }
                            }}
                            disabled={!laptopArtworkFiles[surface]}
                            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-black/10 bg-white text-black transition hover:border-black disabled:cursor-not-allowed disabled:border-black/10 disabled:text-black/30"
                            title="Preview artwork"
                          >
                            <i className="bx bx-show text-xl" />
                          </button>
                        </div>
                      </label>
                      <label className="space-y-2">
                        <span className="text-sm text-black/70">Catalog art</span>
                        <select
                          value={laptopArtworkCatalog[surface]}
                          onChange={(event) => {
                            const selected = event.target.value;
                            setLaptopArtworkCatalog((current) => ({ ...current, [surface]: selected }));
                            if (selected) {
                              setLaptopArtworkFiles((current) => ({ ...current, [surface]: null }));
                            }
                          }}
                          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black outline-none focus:border-black"
                        >
                          <option value="">Select artwork</option>
                          {ARTWORK_CATALOG.map((item) => (
                            <option key={item.value} value={item.value}>{item.label}</option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-sm text-black/70">Surface finish</span>
                        <select
                          value={laptopFinishes[surface]}
                          onChange={(event) => {
                            markSelectionStarted();
                            setLaptopFinishes((current) => ({ ...current, [surface]: event.target.value as FinishType }));
                          }}
                          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black outline-none focus:border-black"
                        >
                          <option value="standard">Standard</option>
                          <option value="shiny-stones">Shiny Stones (+₦500)</option>
                        </select>
                      </label>
                      <label className="space-y-2">
                        <span className="text-sm text-black/70">Custom text (optional)</span>
                        <input
                          type="text"
                          value={laptopTexts[surface]}
                          onChange={(event) => {
                            markSelectionStarted();
                            setLaptopTexts((current) => ({ ...current, [surface]: event.target.value }));
                          }}
                          placeholder="Enter text for this surface"
                          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black outline-none focus:border-black"
                        />
                      </label>
                    </div>
                  </div>
                ))
              )}

              <div className="space-y-3 rounded-3xl border border-black/10 bg-white p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-black/70">Installation</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(['professional', 'diy'] as InstallationOption[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        markSelectionStarted();
                        setLaptopInstallOption(option);
                      }}
                      className={`rounded-3xl border px-4 py-4 text-left transition ${
                        laptopInstallOption === option
                          ? 'border-black bg-black text-white'
                          : 'border-black/10 bg-[#f7f7f5] text-black hover:border-black'
                      }`}
                    >
                      <div className="font-semibold">{option === 'professional' ? 'Professional Installation' : 'DIY discount (-₦1,500 if all 3 surfaces selected)'}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {category === 'phone' && (
            <div className="space-y-6 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-black/70">Phone Customization</p>
                <p className="mt-2 text-base text-black/80">Choose wrap coverage, finish, and optional custom text.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {PHONE_COVERAGE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPhoneCoverage(option.value)}
                    className={`rounded-3xl border px-4 py-4 text-left transition ${
                      phoneCoverage === option.value
                        ? 'border-black bg-black text-white'
                        : 'border-black/10 bg-[#f7f7f5] text-black hover:border-black'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm text-black/70">Surface finish</span>
                  <select
                    value={phoneFinish}
                    onChange={(event) => {
                      markSelectionStarted();
                      setPhoneFinish(event.target.value as FinishType);
                    }}
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black outline-none focus:border-black"
                  >
                    <option value="standard">Standard</option>
                    <option value="shiny-stones">Shiny Stones (+₦500)</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-black/70">Artwork upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => handleArtworkFileChange('phone', event.target.files?.[0] ?? null)}
                    className="hidden"
                    id="phone-artwork"
                  />
                  <label htmlFor="phone-artwork" className="inline-flex w-full cursor-pointer items-center justify-between rounded-2xl border border-dashed border-black/20 bg-white px-4 py-3 text-sm font-medium text-black transition hover:border-black/40">
                    <span>{phoneArtworkLabel}</span>
                    <span className="text-black/60">Browse</span>
                  </label>
                </label>
              </div>
              <label className="space-y-2">
                <span className="text-sm text-black/70">Catalog art</span>
                <select
                  value={phoneArtworkCatalog}
                  onChange={(event) => {
                    setPhoneArtworkCatalog(event.target.value);
                    if (event.target.value) setPhoneArtworkFile(null);
                  }}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black outline-none focus:border-black"
                >
                  <option value="">Select artwork</option>
                  {ARTWORK_CATALOG.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm text-black/70">Custom text (optional)</span>
                <input
                  type="text"
                  value={phoneCustomText}
                  onChange={(event) => {
                    markSelectionStarted();
                    setPhoneCustomText(event.target.value);
                  }}
                  placeholder="Enter custom text"
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black outline-none focus:border-black"
                />
              </label>
              <div className="space-y-3 rounded-3xl border border-black/10 bg-white p-5">
                <div className="text-sm font-semibold uppercase tracking-[0.2em] text-black/70">Installation</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(['professional', 'diy'] as InstallationOption[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        markSelectionStarted();
                        setPhoneInstallOption(option);
                      }}
                      className={`rounded-3xl border px-4 py-4 text-left transition ${
                        phoneInstallOption === option
                          ? 'border-black bg-black text-white'
                          : 'border-black/10 bg-[#f7f7f5] text-black hover:border-black'
                      }`}
                    >
                      <div className="font-semibold">{option === 'professional' ? 'Professional Installation' : 'DIY discount (-₦500)'}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {category === 'controller' && (
            <div className="space-y-6 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-black/70">Controller Customization</p>
                <p className="mt-2 text-base text-black/80">Pick your controller type, finish, and gamer tag.</p>
              </div>
              <label className="space-y-2">
                <span className="text-sm text-black/70">Controller subtype</span>
                <select
                  value={controllerSubtype}
                  onChange={(event) => {
                    markSelectionStarted();
                    setControllerSubtype(event.target.value as ControllerSubtype);
                  }}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black outline-none focus:border-black"
                >
                  {CONTROLLER_SUBTYPES.map((subtype) => (
                    <option key={subtype.value} value={subtype.value}>{subtype.label}</option>
                  ))}
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm text-black/70">Surface finish</span>
                  <select
                    value={controllerFinish}
                    onChange={(event) => {
                      markSelectionStarted();
                      setControllerFinish(event.target.value as FinishType);
                    }}
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black outline-none focus:border-black"
                  >
                    <option value="standard">Standard</option>
                    <option value="shiny-stones">Shiny Stones (+₦500)</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-black/70">Artwork upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => handleArtworkFileChange('controller', event.target.files?.[0] ?? null)}
                    className="hidden"
                    id="controller-artwork"
                  />
                  <label htmlFor="controller-artwork" className="inline-flex w-full cursor-pointer items-center justify-between rounded-2xl border border-dashed border-black/20 bg-white px-4 py-3 text-sm font-medium text-black transition hover:border-black/40">
                    <span>{controllerArtworkLabel}</span>
                    <span className="text-black/60">Browse</span>
                  </label>
                </label>
              </div>
              <label className="space-y-2">
                <span className="text-sm text-black/70">Catalog art</span>
                <select
                  value={controllerArtworkCatalog}
                  onChange={(event) => {
                    setControllerArtworkCatalog(event.target.value);
                    if (event.target.value) setControllerArtworkFile(null);
                  }}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black outline-none focus:border-black"
                >
                  <option value="">Select artwork</option>
                  {ARTWORK_CATALOG.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm text-black/70">GamerTag / Custom text</span>
                <input
                  type="text"
                  value={controllerGamerTag}
                  onChange={(event) => {
                    markSelectionStarted();
                    setControllerGamerTag(event.target.value);
                  }}
                  placeholder="Enter gamer tag"
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black outline-none focus:border-black"
                />
              </label>
              <div className="space-y-3 rounded-3xl border border-black/10 bg-white p-5">
                <div className="text-sm font-semibold uppercase tracking-[0.2em] text-black/70">Installation</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(['professional', 'diy'] as InstallationOption[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        markSelectionStarted();
                        setControllerInstallOption(option);
                      }}
                      className={`rounded-3xl border px-4 py-4 text-left transition ${
                        controllerInstallOption === option
                          ? 'border-black bg-black text-white'
                          : 'border-black/10 bg-[#f7f7f5] text-black hover:border-black'
                      }`}
                    >
                      <div className="font-semibold">{option === 'professional' ? 'Professional Installation' : 'DIY discount (-₦500)'}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {category === 'others' && (
            <div className="space-y-6 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-black/70">Custom Item Request</p>
                <p className="mt-2 text-base text-black/80">Tell us what you want wrapped and we’ll quote it separately.</p>
              </div>
              <label className="space-y-2">
                <span className="text-sm text-black/70">Item Name</span>
                <input
                  type="text"
                  value={itemName}
                  onChange={(event) => {
                    markSelectionStarted();
                    setItemName(event.target.value);
                  }}
                  placeholder="e.g. Anker Power Bank"
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black outline-none focus:border-black"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-black/70">Instructions / Coverage details</span>
                <textarea
                  value={instructions}
                  onChange={(event) => {
                    markSelectionStarted();
                    setInstructions(event.target.value);
                  }}
                  rows={5}
                  placeholder="Describe the coverage and any reference measurements"
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black outline-none focus:border-black"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-black/70">Reference photo (optional)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleArtworkFileChange('photo', event.target.files?.[0] ?? null)}
                  className="hidden"
                  id="others-photo"
                />
                <label htmlFor="others-photo" className="inline-flex w-full cursor-pointer items-center justify-between rounded-2xl border border-dashed border-black/20 bg-white px-4 py-3 text-sm font-medium text-black transition hover:border-black/40">
                  <span>{photoFile?.name || 'Upload reference photo'}</span>
                  <span className="text-black/60">Browse</span>
                </label>
              </label>
            </div>
          )}
        </div>

        <div id="price-section" className="rounded-3xl border border-black/10 bg-[#fafafa] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-black/70">Order Summary</p>
              <p className="mt-2 text-base text-black/80">Review your line items before generating your receipt.</p>
            </div>
            <div className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white">
              {pricingQuotePending ? 'Pending Quote' : formatCurrency(pricing.total)}
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {pricing.lineItems.map((item, index) => (
              <div key={`${item.label}-${index}`} className="flex items-center justify-between rounded-3xl border border-black/10 bg-white px-4 py-3">
                <span className="text-sm text-black/80">{item.label}</span>
                <span className="text-sm font-semibold text-black">{item.price >= 0 ? formatCurrency(item.price) : `- ${formatCurrency(Math.abs(item.price))}`}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm text-black/60">Final total</div>
              <div className="text-2xl font-black text-black">{pricingQuotePending ? 'Custom Quote' : formatCurrency(pricing.total)}</div>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !canAdvance()}
              className="rounded-3xl bg-black px-6 py-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-black/40"
            >
              {isSubmitting ? 'Generating receipt...' : 'Generate Receipt'}
            </button>
          </div>
          {submissionResult ? <p className="mt-4 text-sm text-black/70">{submissionResult}</p> : null}
        </div>
      </div>

      {hasStartedSelection ? (
        <button
          type="button"
          onClick={handlePriceJump}
          className="fixed top-4 right-4 z-[9999] flex items-center gap-3 rounded-full border border-black/10 bg-white/95 px-4 py-3 shadow-2xl shadow-black/15 backdrop-blur-sm transition hover:-translate-y-0.5"
          style={{ pointerEvents: 'auto' }}
        >
          <span className="rounded-full bg-black px-2.5 py-1 text-xs font-semibold text-white">{pricingQuotePending ? 'Quote' : formatCurrency(pricing.total)}</span>
          <span className="text-sm font-semibold text-black">View Price</span>
        </button>
      ) : null}

      {previewSurface && previewImageUrl ? (
        <LaptopPreviewModal
          imageUrl={previewImageUrl}
          surface={previewSurface}
          onClose={handlePreviewClose}
        />
      ) : null}

      {receiptOpen && receiptData ? (
        <ReceiptModal
          isOpen={receiptOpen}
          orderId={receiptData.orderId}
          clientName={receiptData.clientName}
          deviceModel={receiptData.deviceModel}
          date={receiptData.date}
          category={receiptData.category}
          lineItems={receiptData.lineItems}
          totalPrice={receiptData.totalPrice}
          onClose={() => setReceiptOpen(false)}
        />
      ) : null}
    </section>
  );
}

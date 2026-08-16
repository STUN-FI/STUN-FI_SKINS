'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useRef } from 'react';
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
import BrandedLogo from './BrandedLogo';
import LaptopPreviewModal from './LaptopPreviewModal';

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
  'top-lid': 'shiny-stones',
  'keyboard-deck': 'shiny-stones',
  'bottom-base': 'shiny-stones',
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

type SurfaceDesign = {
  previewUrl: string;
};

const DEFAULT_LAPTOP_DESIGNS: Record<LaptopSurface, SurfaceDesign> = {
  'top-lid': { previewUrl: '' },
  'keyboard-deck': { previewUrl: '' },
  'bottom-base': { previewUrl: '' },
};

export type ReceiptData = {
  orderId: string;
  clientName: string;
  deviceModel: string;
  date: string;
  category: string;
  lineItems: Array<{ label: string; price: number }>;
  totalPrice: number;
  surfacePreviews?: Array<{ label: string; previewUrl: string }>;
};

type ClientBuilderProps = {
  onReceiptOpen: (receipt: ReceiptData) => void;
  onPriceChange?: (price: number | null) => void;
  onHelpOpen: () => void;
  onCatalogOpen: (surface: LaptopSurface) => void;
  catalogSelection: { surface: LaptopSurface; imageUrl: string } | null;
  onSubmittingChange?: (isSubmitting: boolean) => void;
};

export default function ClientBuilder({ onReceiptOpen, onPriceChange, onHelpOpen, onCatalogOpen, catalogSelection, onSubmittingChange }: ClientBuilderProps) {
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
  const [laptopArtworkMode, setLaptopArtworkMode] = useState<Record<LaptopSurface, 'upload' | 'catalog'>>({
    'top-lid': 'catalog',
    'keyboard-deck': 'catalog',
    'bottom-base': 'catalog',
  });
  const [surfaceDesigns, setSurfaceDesigns] = useState<Record<LaptopSurface, SurfaceDesign>>(DEFAULT_LAPTOP_DESIGNS);
  const uploadPreviewUrlsRef = useRef<Record<LaptopSurface, string>>({
    'top-lid': '',
    'keyboard-deck': '',
    'bottom-base': '',
  });
  const [laptopInstallOption, setLaptopInstallOption] = useState<InstallationOption>('professional');

  const [phoneCoverage, setPhoneCoverage] = useState<PhoneCoverage>('back-panel');
  const [phoneFinish, setPhoneFinish] = useState<FinishType>('shiny-stones');
  const [phoneArtworkCatalog, setPhoneArtworkCatalog] = useState('');
  const [phoneArtworkFile, setPhoneArtworkFile] = useState<File | null>(null);
  const [phoneCustomText, setPhoneCustomText] = useState('');
  const [phoneInstallOption, setPhoneInstallOption] = useState<InstallationOption>('professional');

  const [controllerSubtype, setControllerSubtype] = useState<ControllerSubtype>('ps5-dualsense');
  const [controllerFinish, setControllerFinish] = useState<FinishType>('shiny-stones');
  const [controllerArtworkCatalog, setControllerArtworkCatalog] = useState('');
  const [controllerArtworkFile, setControllerArtworkFile] = useState<File | null>(null);
  const [controllerGamerTag, setControllerGamerTag] = useState('');
  const [controllerInstallOption, setControllerInstallOption] = useState<InstallationOption>('professional');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<string | null>(null);
  const [submissionType, setSubmissionType] = useState<'success' | 'error' | null>(null);
  const [customerValidation, setCustomerValidation] = useState({ name: false, phone: false });
  const [customerTouched, setCustomerTouched] = useState({ name: false, phone: false });
  const [hasStartedSelection, setHasStartedSelection] = useState(false);
  const [previewSurface, setPreviewSurface] = useState<LaptopSurface | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [laptopTextToggle, setLaptopTextToggle] = useState<Record<LaptopSurface, boolean>>({
    'top-lid': false,
    'keyboard-deck': false,
    'bottom-base': false,
  });
  const [phoneTextToggle, setPhoneTextToggle] = useState(false);
  const [controllerTagToggle, setControllerTagToggle] = useState(false);
  const [priceNotification, setPriceNotification] = useState(false);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);
  const previousPriceRef = useRef<number | null>(null);

  const markSelectionStarted = () => setHasStartedSelection(true);

  useEffect(() => {
    onSubmittingChange?.(isSubmitting);
  }, [isSubmitting, onSubmittingChange]);

  useEffect(() => {
    if (!catalogSelection) return;
    const { surface, imageUrl } = catalogSelection;

    const currentUploadUrl = uploadPreviewUrlsRef.current[surface];
    if (currentUploadUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(currentUploadUrl);
      uploadPreviewUrlsRef.current[surface] = '';
    }

    setLaptopArtworkCatalog((current) => ({ ...current, [surface]: imageUrl }));
    setLaptopArtworkFiles((current) => ({ ...current, [surface]: null }));
    setLaptopArtworkMode((current) => ({ ...current, [surface]: 'catalog' }));
    setSurfaceDesigns((current) => ({ ...current, [surface]: { previewUrl: imageUrl } }));
  }, [catalogSelection]);

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

  // Price change notification with sound and animation
  useEffect(() => {
    if (pricingQuotePending || !hasStartedSelection) {
      previousPriceRef.current = pricing.total;
      return;
    }

    if (previousPriceRef.current !== null && previousPriceRef.current !== pricing.total) {
      // Play notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();

      oscillator.connect(gain);
      gain.connect(audioContext.destination);

      // Soft "ding" sound
      oscillator.frequency.value = 800;
      gain.gain.setValueAtTime(0.1, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);

      // Trigger animation
      setPriceNotification(true);
      setTimeout(() => setPriceNotification(false), 600);
    }

    previousPriceRef.current = pricing.total;
  }, [pricing.total, pricingQuotePending, hasStartedSelection]);

  useEffect(() => {
    if (!onPriceChange) {
      return;
    }

    onPriceChange(pricingQuotePending ? 0 : pricing.total);
  }, [onPriceChange, pricingQuotePending, pricing.total]);

  const normalizedPhone = phoneNumber.replace(/\D/g, '');
  const hasValidPhoneNumber = normalizedPhone.length >= 10 && normalizedPhone.length <= 15;
  const hasRequiredCustomerInfo = clientName.trim() !== '' && hasValidPhoneNumber;
  const canAdvanceToStep2 = hasRequiredCustomerInfo;
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
      const previousUploadUrl = uploadPreviewUrlsRef.current[surface];
      if (previousUploadUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previousUploadUrl);
        uploadPreviewUrlsRef.current[surface] = '';
      }

      const previewUrl = file ? URL.createObjectURL(file) : '';
      if (file) {
        uploadPreviewUrlsRef.current[surface] = previewUrl;
      }

      setLaptopArtworkFiles((current) => ({ ...current, [surface]: file }));
      setLaptopArtworkCatalog((current) => ({ ...current, [surface]: '' }));
      setLaptopArtworkMode((m) => ({ ...m, [surface]: file ? 'upload' : m[surface] }));
      setSurfaceDesigns((current) => ({ ...current, [surface]: { previewUrl } }));
    }

    if (field === 'photo') {
      setPhotoFile(file);
    }
  };


  const handlePreviewClose = () => {
    if (previewImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewImageUrl);
    }
    setPreviewSurface(null);
    setPreviewImageUrl('');
  };

  useEffect(() => {
    const current = uploadPreviewUrlsRef.current;
    return () => {
      const urls = Object.values(current);
      urls.forEach((url) => {
        if (typeof url === 'string' && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  const buildOrderId = () => `STN-${Math.floor(1000 + Math.random() * 9000)}`;

  const resetBuilderForm = () => {
    setCurrentStep(1);
    setClientName('');
    setPhoneNumber('');
    setLaptopModel('');
    setCategory('laptop');
    setItemName('');
    setInstructions('');
    setPhotoFile(null);
    setLaptopSelectedSurfaces(['top-lid']);
    setLaptopFinishes(DEFAULT_LAPTOP_FINISHES);
    setLaptopTexts(DEFAULT_LAPTOP_TEXTS);
    setLaptopArtworkCatalog(DEFAULT_LAPTOP_CATALOG);
    setLaptopArtworkFiles({
      'top-lid': null,
      'keyboard-deck': null,
      'bottom-base': null,
    });
    setLaptopArtworkMode({
      'top-lid': 'catalog',
      'keyboard-deck': 'catalog',
      'bottom-base': 'catalog',
    });
    setSurfaceDesigns(DEFAULT_LAPTOP_DESIGNS);
    setLaptopInstallOption('professional');
    setPhoneCoverage('back-panel');
    setPhoneFinish('shiny-stones');
    setPhoneArtworkCatalog('');
    setPhoneArtworkFile(null);
    setPhoneCustomText('');
    setPhoneInstallOption('professional');
    setControllerSubtype('ps5-dualsense');
    setControllerFinish('shiny-stones');
    setControllerArtworkCatalog('');
    setControllerArtworkFile(null);
    setControllerGamerTag('');
    setControllerInstallOption('professional');
    setCustomerValidation({ name: false, phone: false });
    setCustomerTouched({ name: false, phone: false });
    setHasStartedSelection(false);
    setPreviewSurface(null);
    setPreviewImageUrl('');
  };

  const getDeviceModelLabel = () => {
    if (category === 'laptop') {
      return laptopModel || 'Laptop';
    }

    if (category === 'phone') {
      return PHONE_COVERAGE_OPTIONS.find((item) => item.value === phoneCoverage)?.label || 'Phone';
    }

    if (category === 'controller') {
      return CONTROLLER_SUBTYPES.find((item) => item.value === controllerSubtype)?.label || 'Controller';
    }

    return itemName || 'Other';
  };

  const buildSurfaces = () => {
    if (category === 'laptop') {
      return laptopSelectedSurfaces.map((surface) => ({
        name: LAPTOP_SURFACES.find((item) => item.value === surface)?.label || surface,
        imageUrl: '',
        monogramText: laptopTexts[surface] || '',
      }));
    }

    if (category === 'phone') {
      return [
        {
          name: PHONE_COVERAGE_OPTIONS.find((item) => item.value === phoneCoverage)?.label || 'Phone Artwork',
          imageUrl: '',
          monogramText: phoneCustomText || '',
        },
      ];
    }

    if (category === 'controller') {
      return [
        {
          name: CONTROLLER_SUBTYPES.find((item) => item.value === controllerSubtype)?.label || 'Controller Artwork',
          imageUrl: '',
          monogramText: controllerGamerTag || '',
        },
      ];
    }

    if (category === 'others') {
      return [
        {
          name: 'Reference Photo',
          imageUrl: '',
          monogramText: instructions || '',
        },
      ];
    }

    return [];
  };

  const buildOrderPayload = (orderId: string) => {
    const payload: Record<string, any> = {
      orderId,
      clientName,
      whatsappNumber: phoneNumber,
      category,
      deviceModel: getDeviceModelLabel(),
      surfaces: buildSurfaces(),
      items: pricing.lineItems,
      totalAmount: pricingQuotePending ? 0 : pricing.total,
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

  const getCustomerFieldErrors = (nameValue = clientName, phoneValue = phoneNumber) => {
    const normalizedPhone = phoneValue.replace(/\D/g, '');
    return {
      name: !nameValue.trim(),
      phone: normalizedPhone.length < 10 || normalizedPhone.length > 15,
    };
  };

  const scrollToFirstInvalidCustomerField = (errors: ReturnType<typeof getCustomerFieldErrors>) => {
    if (errors.name) {
      nameInputRef.current?.focus();
      nameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (errors.phone) {
      phoneInputRef.current?.focus();
      phoneInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleSubmit = async () => {
    const errors = getCustomerFieldErrors();
    setCustomerTouched({ name: true, phone: true });
    setCustomerValidation(errors);

    if (errors.name || errors.phone) {
      scrollToFirstInvalidCustomerField(errors);
      const errorMsg = errors.name && errors.phone
        ? 'Please enter your name and a valid phone number before submitting your order.'
        : errors.name
        ? 'Please enter your name before submitting your order.'
        : 'Please enter a valid phone number before submitting your order.';
      setSubmissionResult(errorMsg);
      setSubmissionType('error');
      return;
    }

    setIsSubmitting(true);
    setSubmissionResult(null);
    setSubmissionType(null);
    const orderId = buildOrderId();
    const orderPayload = buildOrderPayload(orderId);
    const formData = new FormData();
    formData.append('clientName', clientName);
    formData.append('whatsappNumber', phoneNumber);
    formData.append('category', category);
    formData.append('orderId', orderId);
    formData.append('deviceModel', orderPayload.deviceModel);
    formData.append('surfaces', JSON.stringify(orderPayload.surfaces));
    formData.append('items', JSON.stringify(orderPayload.items));
    formData.append('totalAmount', String(orderPayload.totalAmount));
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
      if (!result.success) {
        throw new Error(result.error || 'Order submission failed');
      }

      const finalOrderId = result.orderId || orderId;
      resetBuilderForm();
      setSubmissionResult(`Order submitted successfully as #${finalOrderId}.`);
      setSubmissionType('success');

      onReceiptOpen({
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
        surfacePreviews:
          category === 'laptop'
            ? laptopSelectedSurfaces.map((surface) => ({
                label: LAPTOP_SURFACES.find((item) => item.value === surface)?.label || surface,
                previewUrl: surfaceDesigns[surface]?.previewUrl || laptopArtworkCatalog[surface] || '',
              }))
            : [],
      });
    } catch (error) {
      console.error('Order submission failed:', error);
      setSubmissionResult('Unable to send your order right now. Please try again or contact support.');
      setSubmissionType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="builder" className="mb-10 rounded-[2.5rem] border border-black/10 bg-white/90 p-6 shadow-glow backdrop-blur">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-black/70">Client Order Configurator</p>
            <h2 className="mt-2 text-3xl font-black text-black">Build a custom device order</h2>
          </div>
          <Link
            href="/orders"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-black px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-black/15 transition hover:-translate-y-0.5 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-black/20 sm:px-5"
          >
            <i className="bx bx-history text-base" />
            <span>View Order History</span>
          </Link>
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
              <span className="text-sm font-semibold text-black">Name</span>
              <input
                ref={nameInputRef}
                type="text"
                value={clientName}
                onChange={(event) => {
                  markSelectionStarted();
                  const nextValue = event.target.value;
                  setClientName(nextValue);
                  if (customerTouched.name) {
                    setCustomerValidation((current) => ({ ...current, name: !nextValue.trim() }));
                  }
                  if (submissionResult) {
                    setSubmissionResult(null);
                  }
                }}
                onBlur={() => {
                  const errors = getCustomerFieldErrors();
                  setCustomerTouched((current) => ({ ...current, name: true }));
                  setCustomerValidation((current) => ({ ...current, name: errors.name }));
                }}
                placeholder="Input your name"
                className={`w-full rounded-2xl border bg-white px-4 py-3 text-black outline-none focus:border-black ${customerTouched.name && customerValidation.name ? 'border-red-500 bg-red-50' : 'border-black/10 bg-white'}`}
              />
              {customerTouched.name && customerValidation.name ? <p className="text-xs text-red-600">Name is required.</p> : null}
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-black">Phone Number</span>
              <input
                ref={phoneInputRef}
                type="tel"
                value={phoneNumber}
                onChange={(event) => {
                  markSelectionStarted();
                  const nextValue = event.target.value;
                  setPhoneNumber(nextValue);
                  if (customerTouched.phone) {
                    const nextDigits = nextValue.replace(/\D/g, '');
                    setCustomerValidation((current) => ({ ...current, phone: nextDigits.length < 10 || nextDigits.length > 15 }));
                  }
                  if (submissionResult) {
                    setSubmissionResult(null);
                  }
                }}
                onBlur={() => {
                  const errors = getCustomerFieldErrors();
                  setCustomerTouched((current) => ({ ...current, phone: true }));
                  setCustomerValidation((current) => ({ ...current, phone: errors.phone }));
                }}
                placeholder="Input your phone number"
                className={`w-full rounded-2xl border bg-white px-4 py-3 text-black outline-none focus:border-black ${customerTouched.phone && customerValidation.phone ? 'border-red-500 bg-red-50' : 'border-black/10 bg-white'}`}
              />
              {customerTouched.phone && customerValidation.phone ? (
                <p className="text-xs text-red-600">Please enter a valid phone number with 10–15 digits.</p>
              ) : null}
            </label>
          </div>
        </div>

        <div className="grid gap-6">
          {category === 'laptop' && (
            <div className="space-y-6 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-black/70">Laptop Customization</p>
                <p className="mt-2 text-base text-black/80">
                  Select one or more surfaces you want wrapped. For a full custom finish, you can choose all three: Top Lid, Keyboard Deck, and Bottom Base.
                </p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-200 text-[10px] font-bold text-amber-900">✓</span>
                  Multi-select enabled: choose all 3 for full customization
                </div>
                <button type="button" onClick={onHelpOpen} className="mt-3 inline-flex items-center gap-1 text-sm text-blue-600">
                  <i className="bx bx-info-circle" /> Which parts are these?
                </button>
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

              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
                Choose any combination you want — for a full customization, select all three surfaces together.
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
                        <div className="flex items-center gap-3">
                          <div className="text-2xl text-amber-400">
                            {surface.value !== 'top-lid' ? (
                              <i
                                className={`bx ${
                                  surface.value === 'keyboard-deck'
                                    ? 'bx-keyboard'
                                    : 'bx-hard-drive'
                                }`}
                              />
                            ) : null}
                          </div>
                          <div>
                            <div>{surface.label}</div>
                            <div className="text-xs text-black/60">
                              {surface.value === 'top-lid'
                                ? 'Outer back cover'
                                : surface.value === 'keyboard-deck'
                                ? 'Palm rest & trackpad'
                                : 'Underneath laptop'}
                            </div>
                          </div>
                        </div>
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
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-black">{LAPTOP_SURFACES.find((item) => item.value === surface)?.label}</p>
                      <button type="button" onClick={() => setPreviewSurface(surface)} className="text-sm text-black/60">Preview</button>
                    </div>

                    <div className="mt-4">
                      <div className="inline-flex rounded-full bg-[#efefef] p-1">
                        <button
                          type="button"
                          onClick={() => {
                            setLaptopArtworkMode((c) => ({ ...c, [surface]: 'upload' }));
                            setLaptopArtworkCatalog((cur) => ({ ...cur, [surface]: '' }));
                          }}
                          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${laptopArtworkMode[surface] === 'upload' ? 'bg-white' : 'text-black/70'}`}
                        >
                          <i className="bx bx-upload mr-2" /> Upload Own Artwork
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setLaptopArtworkMode((c) => ({ ...c, [surface]: 'catalog' }));
                            setLaptopArtworkFiles((cur) => ({ ...cur, [surface]: null }));
                          }}
                          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${laptopArtworkMode[surface] === 'catalog' ? 'bg-white' : 'text-black/70'}`}
                        >
                          <i className="bx bx-palette mr-2" /> Choose Existing Design
                        </button>
                      </div>

                      <div className="mt-4">
                        {laptopArtworkMode[surface] === 'upload' ? (
                          <label className="space-y-2">
                            <span className="text-sm text-black/70">Upload own image</span>

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
                        ) : (
                          <div className="space-y-2">
                            <span className="text-sm text-black/70">Catalog art</span>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => onCatalogOpen(surface)}
                                className="rounded-2xl border px-4 py-3 text-sm bg-white"
                              >
                                <i className="bx bx-palette mr-2" /> Choose Existing Design
                              </button>
                              {laptopArtworkCatalog[surface] && laptopArtworkCatalog[surface].trim() ? (
                                <div className="flex items-center gap-2">
                                  <img src={laptopArtworkCatalog[surface]} alt="selected" className="h-12 w-20 rounded-md object-cover" />
                                  <button type="button" onClick={() => { setLaptopArtworkCatalog((c) => ({ ...c, [surface]: '' })); }} className="text-sm text-red-600">Remove</button>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <span className="text-sm text-black/70">Surface finish</span>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                markSelectionStarted();
                                setLaptopFinishes((current) => ({ ...current, [surface]: 'shiny-stones' }));
                              }}
                              className={`relative rounded-2xl border-2 px-3 py-4 text-center font-bold transition-all duration-200 ${
                                laptopFinishes[surface] === 'shiny-stones'
                                  ? 'border-black bg-black text-white shadow-lg scale-105'
                                  : 'border-black/20 bg-white text-black hover:border-black hover:shadow-md'
                              }`}
                            >
                              <div className="flex items-center justify-center mb-2">
                                <i className="bx bxs-star text-lg" />
                              </div>
                              <div className="text-xs mb-1 opacity-75">PREMIUM</div>
                              <div className="text-sm font-black">Quality</div>
                              {laptopFinishes[surface] === 'shiny-stones' && (
                                <div className="absolute top-2 right-2">
                                  <i className="bx bx-check text-xl" />
                                </div>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                markSelectionStarted();
                                setLaptopFinishes((current) => ({ ...current, [surface]: 'standard' }));
                              }}
                              className={`relative rounded-2xl border-2 px-3 py-4 text-center font-bold transition-all duration-200 ${
                                laptopFinishes[surface] === 'standard'
                                  ? 'border-black bg-black text-white shadow-lg scale-105'
                                  : 'border-black/20 bg-white text-black hover:border-black hover:shadow-md'
                              }`}
                            >
                              <div className="flex items-center justify-center mb-2">
                                <i className="bx bx-layer text-lg" />
                              </div>
                              <div className="text-xs mb-1 opacity-75">STANDARD</div>
                              <div className="text-sm font-black">(- ₦500)</div>
                              {laptopFinishes[surface] === 'standard' && (
                                <div className="absolute top-2 right-2">
                                  <i className="bx bx-check text-xl" />
                                </div>
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {!laptopTextToggle[surface] ? (
                            <button
                              type="button"
                              onClick={() => setLaptopTextToggle((current) => ({ ...current, [surface]: true }))}
                              className="w-full rounded-2xl border border-black/10 bg-[#f7f7f5] px-4 py-3 text-sm text-black/70 transition hover:border-black"
                            >
                              <i className="bx bx-plus mr-2" />Add custom text?
                            </button>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-black/70">Custom text</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setLaptopTextToggle((current) => ({ ...current, [surface]: false }));
                                    setLaptopTexts((current) => ({ ...current, [surface]: '' }));
                                  }}
                                  className="text-sm text-red-600 hover:text-red-700"
                                >
                                  <i className="bx bx-x" />Remove
                                </button>
                              </div>
                              <input
                                type="text"
                                value={laptopTexts[surface]}
                                onChange={(event) => {
                                  markSelectionStarted();
                                  setLaptopTexts((current) => ({ ...current, [surface]: event.target.value }));
                                }}
                                placeholder="Enter text for this surface"
                                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black outline-none focus:border-black"
                                autoFocus
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}

              <div className="space-y-4 rounded-3xl border-2 border-black/10 bg-white p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-black/70">Installation</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {(['professional', 'diy'] as InstallationOption[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        markSelectionStarted();
                        setLaptopInstallOption(option);
                      }}
                      className={`relative rounded-3xl border-2 px-6 py-5 text-left font-bold transition-all duration-200 ${
                        laptopInstallOption === option
                          ? 'border-black bg-black text-white shadow-lg scale-105'
                          : 'border-black/20 bg-white text-black hover:border-black hover:shadow-md hover:scale-102'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-xl">{option === 'professional' ? '🔧' : '✋'}</div>
                        <div>
                          <div className="text-base font-bold">{option === 'professional' ? 'Professional Installation' : 'Self-application'}</div>
                          <div className={`text-xs mt-1 ${laptopInstallOption === option ? 'text-white/80' : 'text-black/60'}`}>{option === 'professional' ? 'We apply it' : '(- ₦1,500 if all 3 surfaces)'}</div>
                        </div>
                      </div>
                      {laptopInstallOption === option && (
                        <div className="absolute top-3 right-3 text-white">
                          <i className="bx bx-check text-2xl" />
                        </div>
                      )}
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
                <div className="space-y-2">
                  <span className="text-sm text-black/70">Surface finish</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        markSelectionStarted();
                        setPhoneFinish('shiny-stones');
                      }}
                      className={`relative rounded-2xl border-2 px-3 py-4 text-center font-bold transition-all duration-200 ${
                        phoneFinish === 'shiny-stones'
                          ? 'border-black bg-black text-white shadow-lg scale-105'
                          : 'border-black/20 bg-white text-black hover:border-black hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-center mb-2">
                        <i className="bx bxs-star text-lg" />
                      </div>
                      <div className="text-xs mb-1 opacity-75">PREMIUM</div>
                      <div className="text-sm font-black">Quality</div>
                      {phoneFinish === 'shiny-stones' && (
                        <div className="absolute top-2 right-2">
                          <i className="bx bx-check text-xl" />
                        </div>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        markSelectionStarted();
                        setPhoneFinish('standard');
                      }}
                      className={`relative rounded-2xl border-2 px-3 py-4 text-center font-bold transition-all duration-200 ${
                        phoneFinish === 'standard'
                          ? 'border-black bg-black text-white shadow-lg scale-105'
                          : 'border-black/20 bg-white text-black hover:border-black hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-center mb-2">
                        <i className="bx bx-layer text-lg" />
                      </div>
                      <div className="text-xs mb-1 opacity-75">STANDARD</div>
                      <div className="text-sm font-black">(- ₦500)</div>
                      {phoneFinish === 'standard' && (
                        <div className="absolute top-2 right-2">
                          <i className="bx bx-check text-xl" />
                        </div>
                      )}
                    </button>
                  </div>
                </div>
                <label className="space-y-2">
                  <span className="text-sm text-black/70">Upload own image</span>

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
              <div className="space-y-2">
                {!phoneTextToggle ? (
                  <button
                    type="button"
                    onClick={() => setPhoneTextToggle(true)}
                    className="w-full rounded-2xl border border-black/10 bg-[#f7f7f5] px-4 py-3 text-sm text-black/70 transition hover:border-black"
                  >
                    <i className="bx bx-plus mr-2" />Add custom text?
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-black/70">Custom text</span>
                      <button
                        type="button"
                        onClick={() => {
                          setPhoneTextToggle(false);
                          setPhoneCustomText('');
                        }}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        <i className="bx bx-x" />Remove
                      </button>
                    </div>
                    <input
                      type="text"
                      value={phoneCustomText}
                      onChange={(event) => {
                        markSelectionStarted();
                        setPhoneCustomText(event.target.value);
                      }}
                      placeholder="Enter custom text"
                      className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black outline-none focus:border-black"
                      autoFocus
                    />
                  </div>
                )}
              </div>
              <div className="space-y-4 rounded-3xl border-2 border-black/10 bg-white p-6">
                <div className="text-sm font-semibold uppercase tracking-[0.2em] text-black/70">Installation</div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {(['professional', 'diy'] as InstallationOption[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        markSelectionStarted();
                        setPhoneInstallOption(option);
                      }}
                      className={`relative rounded-3xl border-2 px-6 py-5 text-left font-bold transition-all duration-200 ${
                        phoneInstallOption === option
                          ? 'border-black bg-black text-white shadow-lg scale-105'
                          : 'border-black/20 bg-white text-black hover:border-black hover:shadow-md hover:scale-102'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-xl">{option === 'professional' ? '🔧' : '✋'}</div>
                        <div>
                          <div className="text-base font-bold">{option === 'professional' ? 'Professional Installation' : 'Self-application'}</div>
                          <div className={`text-xs mt-1 ${phoneInstallOption === option ? 'text-white/80' : 'text-black/60'}`}>{option === 'professional' ? 'We apply it' : '(- ₦500)'}</div>
                        </div>
                      </div>
                      {phoneInstallOption === option && (
                        <div className="absolute top-3 right-3 text-white">
                          <i className="bx bx-check text-2xl" />
                        </div>
                      )}
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
                <div className="space-y-2">
                  <span className="text-sm text-black/70">Surface finish</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        markSelectionStarted();
                        setControllerFinish('shiny-stones');
                      }}
                      className={`relative rounded-2xl border-2 px-3 py-4 text-center font-bold transition-all duration-200 ${
                        controllerFinish === 'shiny-stones'
                          ? 'border-black bg-black text-white shadow-lg scale-105'
                          : 'border-black/20 bg-white text-black hover:border-black hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-center mb-2">
                        <i className="bx bxs-star text-lg" />
                      </div>
                      <div className="text-xs mb-1 opacity-75">PREMIUM</div>
                      <div className="text-sm font-black">Quality</div>
                      {controllerFinish === 'shiny-stones' && (
                        <div className="absolute top-2 right-2">
                          <i className="bx bx-check text-xl" />
                        </div>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        markSelectionStarted();
                        setControllerFinish('standard');
                      }}
                      className={`relative rounded-2xl border-2 px-3 py-4 text-center font-bold transition-all duration-200 ${
                        controllerFinish === 'standard'
                          ? 'border-black bg-black text-white shadow-lg scale-105'
                          : 'border-black/20 bg-white text-black hover:border-black hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-center mb-2">
                        <i className="bx bx-layer text-lg" />
                      </div>
                      <div className="text-xs mb-1 opacity-75">STANDARD</div>
                      <div className="text-sm font-black">(- ₦500)</div>
                      {controllerFinish === 'standard' && (
                        <div className="absolute top-2 right-2">
                          <i className="bx bx-check text-xl" />
                        </div>
                      )}
                    </button>
                  </div>
                </div>
                <label className="space-y-2">
                  <span className="text-sm text-black/70">Upload own image</span>
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
              <div className="space-y-2">
                {!controllerTagToggle ? (
                  <button
                    type="button"
                    onClick={() => setControllerTagToggle(true)}
                    className="w-full rounded-2xl border border-black/10 bg-[#f7f7f5] px-4 py-3 text-sm text-black/70 transition hover:border-black"
                  >
                    <i className="bx bx-plus mr-2" />Add gamer tag?
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-black/70">Gamer tag / Custom text</span>
                      <button
                        type="button"
                        onClick={() => {
                          setControllerTagToggle(false);
                          setControllerGamerTag('');
                        }}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        <i className="bx bx-x" />Remove
                      </button>
                    </div>
                    <input
                      type="text"
                      value={controllerGamerTag}
                      onChange={(event) => {
                        markSelectionStarted();
                        setControllerGamerTag(event.target.value);
                      }}
                      placeholder="Enter gamer tag"
                      className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black outline-none focus:border-black"
                      autoFocus
                    />
                  </div>
                )}
              </div>
              <div className="space-y-4 rounded-3xl border-2 border-black/10 bg-white p-6">
                <div className="text-sm font-semibold uppercase tracking-[0.2em] text-black/70">Installation</div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {(['professional', 'diy'] as InstallationOption[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        markSelectionStarted();
                        setControllerInstallOption(option);
                      }}
                      className={`relative rounded-3xl border-2 px-6 py-5 text-left font-bold transition-all duration-200 ${
                        controllerInstallOption === option
                          ? 'border-black bg-black text-white shadow-lg scale-105'
                          : 'border-black/20 bg-white text-black hover:border-black hover:shadow-md hover:scale-102'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-xl">{option === 'professional' ? '🔧' : '✋'}</div>
                        <div>
                          <div className="text-base font-bold">{option === 'professional' ? 'Professional Installation' : 'Self-application'}</div>
                          <div className={`text-xs mt-1 ${controllerInstallOption === option ? 'text-white/80' : 'text-black/60'}`}>{option === 'professional' ? 'We apply it' : '(- ₦500)'}</div>
                        </div>
                      </div>
                      {controllerInstallOption === option && (
                        <div className="absolute top-3 right-3 text-white">
                          <i className="bx bx-check text-2xl" />
                        </div>
                      )}
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
              <div
                className={`text-2xl font-black text-black transition-all duration-300 ${
                  priceNotification ? 'scale-110' : 'scale-100'
                }`}
                style={
                  priceNotification
                    ? {
                        boxShadow: '0 0 20px rgba(0, 0, 0, 0.3)',
                        borderRadius: '8px',
                        padding: '4px 8px',
                      }
                    : {}
                }
              >
                {pricingQuotePending ? 'Custom Quote' : formatCurrency(pricing.total)}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="rounded-3xl bg-black px-6 py-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-black/40"
              >
                {isSubmitting ? 'Placing order...' : 'Place Order'}
              </button>
            </div>
          </div>
          {submissionResult ? (
            <p className={`mt-4 rounded-2xl border px-3 py-2 text-sm font-medium ${
              submissionType === 'success'
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}>{submissionResult}</p>
          ) : null}
        </div>
      </div>

      {previewSurface && previewImageUrl ? (
        <LaptopPreviewModal
          imageUrl={previewImageUrl}
          surface={previewSurface}
          onClose={handlePreviewClose}
        />
      ) : null}

    </section>
  );
}

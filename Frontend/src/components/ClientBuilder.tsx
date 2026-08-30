'use client';

import Image from 'next/image';
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
  surfacePreviews?: Array<{ label: string; previewUrl: string; text?: string }>;
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

  const [laptopSelectedSurfaces, setLaptopSelectedSurfaces] = useState<LaptopSurface[]>(['top-lid', 'keyboard-deck', 'bottom-base']);
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

  // Phase 3: Per-surface design source mode
  const [surfaceDesignSourceMode, setSurfaceDesignSourceMode] = useState<Record<LaptopSurface, 'upload' | 'gallery' | 'color' | null>>({
    'top-lid': null,
    'keyboard-deck': null,
    'bottom-base': null,
  });
  const [surfaceColorDesignType, setSurfaceColorDesignType] = useState<Record<LaptopSurface, 'solid' | 'gradient'>>({
    'top-lid': 'solid',
    'keyboard-deck': 'solid',
    'bottom-base': 'solid',
  });
  const [surfaceSolidColor, setSurfaceSolidColor] = useState<Record<LaptopSurface, string>>({
    'top-lid': '#ffffff',
    'keyboard-deck': '#ffffff',
    'bottom-base': '#ffffff',
  });
  const [surfaceGradientColor1, setSurfaceGradientColor1] = useState<Record<LaptopSurface, string>>({
    'top-lid': '#000000',
    'keyboard-deck': '#000000',
    'bottom-base': '#000000',
  });
  const [surfaceGradientColor2, setSurfaceGradientColor2] = useState<Record<LaptopSurface, string>>({
    'top-lid': '#ffffff',
    'keyboard-deck': '#ffffff',
    'bottom-base': '#ffffff',
  });
  const [surfaceGradientDirection, setSurfaceGradientDirection] = useState<Record<LaptopSurface, 'left' | 'top-left' | 'top' | 'top-right' | 'right'>>({
    'top-lid': 'right',
    'keyboard-deck': 'right',
    'bottom-base': 'right',
  });
  const [surfaceUploadedFile, setSurfaceUploadedFile] = useState<Record<LaptopSurface, File | null>>({
    'top-lid': null,
    'keyboard-deck': null,
    'bottom-base': null,
  });
  const [surfaceSelectedGalleryUrl, setSurfaceSelectedGalleryUrl] = useState<Record<LaptopSurface, string>>({
    'top-lid': '',
    'keyboard-deck': '',
    'bottom-base': '',
  });

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
  const [highlightedDesignSurface, setHighlightedDesignSurface] = useState<LaptopSurface | null>(null);
  const [expandedLaptopSurface, setExpandedLaptopSurface] = useState<LaptopSurface | null>('top-lid');
  const [laptopCopiedSettings, setLaptopCopiedSettings] = useState(false);
  const [showCopyPrompt, setShowCopyPrompt] = useState(false);
  const [syncLaptopSurfaces, setSyncLaptopSurfaces] = useState(false);
  const [phoneTextToggle, setPhoneTextToggle] = useState(false);
  const [controllerTagToggle, setControllerTagToggle] = useState(false);
  const [priceNotification, setPriceNotification] = useState(false);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);
  const previousPriceRef = useRef<number | null>(null);
  const surfaceAccordionRefs = useRef<Record<LaptopSurface, HTMLDivElement | null>>({
    'top-lid': null,
    'keyboard-deck': null,
    'bottom-base': null,
  });
  const surfaceDesignEditorRefs = useRef<Record<LaptopSurface, HTMLDivElement | null>>({
    'top-lid': null,
    'keyboard-deck': null,
    'bottom-base': null,
  });

  const markSelectionStarted = () => setHasStartedSelection(true);

  // Helper: Get field errors
  const getCustomerFieldErrors = () => ({
    name: clientName.trim() === '',
    phone: (() => {
      const digits = phoneNumber.replace(/\D/g, '');
      return digits.length < 10 || digits.length > 15;
    })(),
  });

  // Pricing
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

  // Price change notification
  useEffect(() => {
    if (pricingQuotePending || !hasStartedSelection) {
      previousPriceRef.current = pricing.total;
      return;
    }

    if (previousPriceRef.current !== null && previousPriceRef.current !== pricing.total) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();

      oscillator.connect(gain);
      gain.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      gain.gain.setValueAtTime(0.1, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);

      setPriceNotification(true);
      setTimeout(() => setPriceNotification(false), 600);
    }

    previousPriceRef.current = pricing.total;
  }, [pricing.total, pricingQuotePending, hasStartedSelection]);

  useEffect(() => {
    if (!onPriceChange) {
      return;
    }

    onPriceChange(pricingQuotePending ? null : pricing.total);
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

  const stepLabels = ['Details', 'Device', 'Surfaces', 'Artwork', 'Install', 'Review'] as const;

  const isStepComplete = (stepNumber: number) => {
    switch (stepNumber) {
      case 1:
        return hasRequiredCustomerInfo;
      case 2:
        if (category === 'laptop') return !!laptopModel.trim();
        if (category === 'phone') return !!phoneCoverage;
        if (category === 'controller') return !!controllerSubtype;
        return !!(itemName.trim() && instructions.trim());
      case 3:
        if (category === 'laptop') return laptopSelectedSurfaces.length > 0;
        if (category === 'phone') return !!phoneCoverage;
        if (category === 'controller') return !!controllerSubtype;
        return !!(itemName.trim() && instructions.trim());
      case 4:
        if (category === 'laptop') {
          return laptopSelectedSurfaces.length > 0 && laptopSelectedSurfaces.every((surface) => {
            const mode = surfaceDesignSourceMode[surface];
            if (!mode) return false;
            if (mode === 'upload') return !!(surfaceUploadedFile[surface] || laptopArtworkFiles[surface]);
            if (mode === 'gallery') return !!(laptopArtworkCatalog[surface]?.trim());
            return !!surfaceDesigns[surface]?.previewUrl;
          });
        }
        if (category === 'phone') {
          return !!(phoneArtworkFile || phoneArtworkCatalog.trim() || phoneCustomText.trim());
        }
        if (category === 'controller') {
          return !!(controllerArtworkFile || controllerArtworkCatalog.trim() || controllerGamerTag.trim());
        }
        return !!(itemName.trim() && instructions.trim() && photoFile);
      case 5:
        if (category === 'laptop') return !!laptopInstallOption;
        if (category === 'phone') return !!phoneInstallOption;
        if (category === 'controller') return !!controllerInstallOption;
        return true;
      case 6:
        return true;
      default:
        return false;
    }
  };

  const goToStep = (targetStep: number) => {
    if (targetStep === currentStep || targetStep > currentStep) {
      return;
    }

    if (targetStep === 1 || isStepComplete(targetStep)) {
      setCurrentStep(targetStep);
    }
  };

  const handleContinue = () => {
    if (currentStep >= 6) {
      return;
    }

    if (!isStepComplete(currentStep)) {
      setSubmissionResult('Please complete the current step before continuing.');
      setSubmissionType('error');
      return;
    }

    setCurrentStep((step) => Math.min(6, step + 1));
  };

  const handleBack = () => {
    if (currentStep <= 1) {
      return;
    }

    for (let step = currentStep - 1; step >= 1; step -= 1) {
      if (step === 1 || isStepComplete(step)) {
        setCurrentStep(step);
        return;
      }
    }
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
    }
  };

  const handleSelectDesignMode = (surface: LaptopSurface, mode: 'upload' | 'gallery' | 'color') => {
    markSelectionStarted();
    setSurfaceDesignSourceMode((current) => ({ ...current, [surface]: mode }));
    focusSurfaceDesignEditor(surface);
  };

  const applyUploadToSurface = (surface: LaptopSurface, file: File) => {
    markSelectionStarted();
    handleArtworkFileChange(`laptop-${surface}`, file);
    setSurfaceUploadedFile((current) => ({ ...current, [surface]: file }));
    setSurfaceDesigns((current) => ({
      ...current,
      [surface]: { previewUrl: URL.createObjectURL(file) },
    }));
  };

  const applyColorToSurface = (surface: LaptopSurface) => {
    markSelectionStarted();
    const colorValue =
      surfaceColorDesignType[surface] === 'solid'
        ? surfaceSolidColor[surface]
        : `linear-gradient(to ${surfaceGradientDirection[surface]}, ${surfaceGradientColor1[surface]}, ${surfaceGradientColor2[surface]})`;

    setSurfaceDesigns((current) => ({
      ...current,
      [surface]: { previewUrl: colorValue },
    }));
  };

  const focusSurfaceDesignEditor = (surface: LaptopSurface) => {
    setHighlightedDesignSurface(surface);
    requestAnimationFrame(() => {
      surfaceDesignEditorRefs.current[surface]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });

    window.setTimeout(() => {
      setHighlightedDesignSurface((current) => (current === surface ? null : current));
    }, 1200);
  };

  const toggleLaptopSurface = (surface: LaptopSurface) => {
    const nextExpanded = expandedLaptopSurface === surface ? null : surface;
    setExpandedLaptopSurface(nextExpanded);

    if (nextExpanded) {
      requestAnimationFrame(() => {
        surfaceAccordionRefs.current[surface]?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      });
    }
  };

  const handlePreviewClose = () => {
    setPreviewSurface(null);
    setPreviewImageUrl('');
  };

  const handleSubmit = async () => {
    if (!hasRequiredCustomerInfo) {
      setSubmissionResult('Please fill in your name and phone number.');
      setSubmissionType('error');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalOrderId = 'order-' + Date.now();
      await submitOrder({
        orderId: finalOrderId,
        clientName,
        phoneNumber,
        category,
        laptopModel,
        laptopSelectedSurfaces,
        laptopFinishes,
        laptopTexts,
        laptopArtworkCatalog,
        laptopArtworkFiles,
        laptopInstallOption,
        phoneCoverage,
        phoneFinish,
        phoneArtworkCatalog,
        phoneArtworkFile,
        phoneCustomText,
        phoneInstallOption,
        controllerSubtype,
        controllerFinish,
        controllerArtworkCatalog,
        controllerArtworkFile,
        controllerGamerTag,
        controllerInstallOption,
        itemName,
        instructions,
        photoFile,
        surfaceDesigns,
        surfaceDesignSourceMode,
        surfaceUploadedFile,
        surfaceColorDesignType,
        surfaceSolidColor,
        surfaceGradientColor1,
        surfaceGradientColor2,
        surfaceGradientDirection,
      });

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
                text: laptopTexts[surface] || '',
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

  const phoneArtworkLabel = phoneArtworkFile ? phoneArtworkFile.name : 'Upload your artwork';
  const controllerArtworkLabel = controllerArtworkFile ? controllerArtworkFile.name : 'Upload your artwork';

  const laptopSyncSourceSurface = laptopSelectedSurfaces[0] ?? null;
  const laptopSyncSourceLabel = laptopSyncSourceSurface
    ? LAPTOP_SURFACES.find((item) => item.value === laptopSyncSourceSurface)?.label ?? 'Top Lid'
    : 'Top Lid';

  const handleBreakSync = (surface: LaptopSurface) => {
    if (syncLaptopSurfaces && surface !== laptopSyncSourceSurface) {
      setSyncLaptopSurfaces(false);
    }
  };

  const syncSelectedSurfaceToOtherSurfaces = (sourceSurface: LaptopSurface) => {
    const sourceFinish = laptopFinishes[sourceSurface];
    const sourceText = laptopTexts[sourceSurface];
    const sourceMode = surfaceDesignSourceMode[sourceSurface];

    laptopSelectedSurfaces.forEach((surface) => {
      if (surface !== sourceSurface) {
        setLaptopFinishes((current) => ({ ...current, [surface]: sourceFinish }));
        setLaptopTexts((current) => ({ ...current, [surface]: sourceText }));
        setSurfaceDesignSourceMode((current) => ({ ...current, [surface]: sourceMode }));
      }
    });

    setLaptopCopiedSettings(true);
    setTimeout(() => setLaptopCopiedSettings(false), 2000);
  };

  // Placeholder laptop artwork content (simplified for Step 4)
  const renderLaptopArtworkContent = () => (
    <div className="builder-panel space-y-6 rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-black/70">Choose artwork for each surface</p>
      </div>

      {laptopSelectedSurfaces.length === 0 ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          Select surfaces in the previous step to continue.
        </div>
      ) : (
        <div className="space-y-3">
          {laptopSelectedSurfaces.map((surface) => {
            const isExpanded = expandedLaptopSurface === surface;
            const surfaceLabel = LAPTOP_SURFACES.find((item) => item.value === surface)?.label;

            return (
              <div key={surface} ref={(node) => { surfaceAccordionRefs.current[surface] = node; }}>
                <button
                  type="button"
                  onClick={() => toggleLaptopSurface(surface)}
                  className="w-full rounded-3xl border border-black/10 bg-white p-5 transition hover:border-black/30 text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-black">{surfaceLabel}</span>
                    <i className={`bx bx-chevron-down transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="rounded-b-3xl border border-t-0 border-black/10 bg-[#f7f7f5] p-5 space-y-4">
                    <div
                      ref={(node) => { surfaceDesignEditorRefs.current[surface] = node; }}
                      className={`space-y-4 rounded-2xl border p-3 transition-all duration-300 ${
                        highlightedDesignSurface === surface ? 'border-[#2f7777] bg-[#edf5f5] ring-2 ring-[#2f7777]/35' : 'border-transparent bg-transparent'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-black/70 mb-3">Choose design</p>
                        {surfaceDesignSourceMode[surface] ? (
                          <div className="rounded-2xl border border-black/10 bg-white p-3">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/60">Selected format</p>
                                <p className="mt-1 text-sm font-bold text-black">
                                  {surfaceDesignSourceMode[surface] === 'upload' && 'Your Own'}
                                  {surfaceDesignSourceMode[surface] === 'gallery' && 'Gallery'}
                                  {surfaceDesignSourceMode[surface] === 'color' && 'Color'}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setSurfaceDesignSourceMode((current) => ({ ...current, [surface]: null }))}
                                className="rounded-full border border-black/10 bg-[#f7f7f5] px-3 py-1.5 text-xs font-semibold text-black transition hover:border-black/30"
                              >
                                Change design format
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid gap-3 sm:grid-cols-3">
                            <button
                              type="button"
                              onClick={() => handleSelectDesignMode(surface, 'upload')}
                              className="group relative overflow-hidden rounded-2xl border-2 border-black/10 bg-white p-0 text-left transition-all duration-200 hover:border-black/30"
                            >
                              <div className="relative overflow-hidden rounded-t-xl bg-gradient-to-br from-[#f0f1ee] to-[#e8e8e5] flex items-center justify-center h-32">
                                <div className="text-center">
                                  <div className="text-3xl text-black/20 mb-1">
                                    <i className="bx bx-upload" />
                                  </div>
                                  <p className="text-xs text-black/40">Upload</p>
                                </div>
                              </div>
                              <div className="space-y-2 p-3">
                                <span className="text-sm font-bold text-black">Your Own</span>
                                <p className="text-xs text-black/60">Upload artwork</p>
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSelectDesignMode(surface, 'gallery')}
                              className="group relative overflow-hidden rounded-2xl border-2 border-black/10 bg-white p-0 text-left transition-all duration-200 hover:border-black/30"
                            >
                              <div className="relative overflow-hidden rounded-t-xl bg-gradient-to-br from-[#f0f1ee] to-[#e8e8e5] flex items-center justify-center h-32">
                                <div className="text-center">
                                  <div className="text-3xl text-black/20 mb-1">
                                    <i className="bx bx-palette" />
                                  </div>
                                  <p className="text-xs text-black/40">Gallery</p>
                                </div>
                              </div>
                              <div className="space-y-2 p-3">
                                <span className="text-sm font-bold text-black">Gallery</span>
                                <p className="text-xs text-black/60">STUN-FI designs</p>
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSelectDesignMode(surface, 'color')}
                              className="group relative overflow-hidden rounded-2xl border-2 border-black/10 bg-white p-0 text-left transition-all duration-200 hover:border-black/30"
                            >
                              <div className="relative overflow-hidden rounded-t-xl bg-gradient-to-br from-[#f0f1ee] to-[#e8e8e5] flex items-center justify-center h-32">
                                <div className="text-center">
                                  <div className="text-3xl text-black/20 mb-1">
                                    <i className="bx bx-droplet" />
                                  </div>
                                  <p className="text-xs text-black/40">Color</p>
                                </div>
                              </div>
                              <div className="space-y-2 p-3">
                                <span className="text-sm font-bold text-black">Color</span>
                                <p className="text-xs text-black/60">Solid or gradient</p>
                              </div>
                            </button>
                          </div>
                        )}
                      </div>

                      {surfaceDesignSourceMode[surface] === 'upload' && (
                        <div className="rounded-2xl border border-black/10 bg-white p-4 space-y-3">
                          <span className="text-sm text-black/70">Your artwork file</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (file) applyUploadToSurface(surface, file);
                            }}
                            className="hidden"
                            id={`phase3-surface-upload-${surface}`}
                          />
                          <label htmlFor={`phase3-surface-upload-${surface}`} className="inline-flex w-full cursor-pointer items-center justify-between rounded-xl border border-dashed border-black/20 bg-white px-3 py-2 text-sm font-medium text-black transition hover:border-black/40">
                            <span>{surfaceUploadedFile[surface]?.name || 'Choose file'}</span>
                            <span className="text-black/60">Browse</span>
                          </label>
                        </div>
                      )}

                      {surfaceDesignSourceMode[surface] === 'gallery' && (
                        <div className="rounded-2xl border border-black/10 bg-white p-4 space-y-3">
                          <button
                            type="button"
                            onClick={() => onCatalogOpen(surface)}
                            className="w-full min-h-10 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-medium text-black transition hover:border-black/40"
                          >
                            <i className="bx bx-palette mr-2" /> Browse Gallery
                          </button>
                        </div>
                      )}

                      {surfaceDesignSourceMode[surface] === 'color' && (
                        <div className="rounded-2xl border border-black/10 bg-white p-4 space-y-3">
                          <div className="flex gap-1 rounded-xl bg-[#efefef] p-1 w-auto">
                            <button
                              type="button"
                              onClick={() => setSurfaceColorDesignType((m) => ({ ...m, [surface]: 'solid' }))}
                              className={`min-h-9 rounded-lg px-3 py-1 text-xs font-bold transition ${surfaceColorDesignType[surface] === 'solid' ? 'bg-black text-white' : 'text-black/70'}`}
                            >
                              Solid
                            </button>
                            <button
                              type="button"
                              onClick={() => setSurfaceColorDesignType((m) => ({ ...m, [surface]: 'gradient' }))}
                              className={`min-h-9 rounded-lg px-3 py-1 text-xs font-bold transition ${surfaceColorDesignType[surface] === 'gradient' ? 'bg-black text-white' : 'text-black/70'}`}
                            >
                              Gradient
                            </button>
                          </div>

                          {surfaceColorDesignType[surface] === 'solid' && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={surfaceSolidColor[surface]}
                                  onChange={(e) => setSurfaceSolidColor((m) => ({ ...m, [surface]: e.target.value }))}
                                  className="h-10 w-12 rounded-lg border border-black/10 cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={surfaceSolidColor[surface]}
                                  onChange={(e) => setSurfaceSolidColor((m) => ({ ...m, [surface]: e.target.value }))}
                                  className="flex-1 rounded-lg border border-black/10 bg-white px-2 py-1 text-xs font-mono uppercase"
                                />
                              </div>
                              <div className="h-16 rounded-lg border border-black/10" style={{ backgroundColor: surfaceSolidColor[surface] }} />
                            </div>
                          )}

                          {surfaceColorDesignType[surface] === 'gradient' && (
                            <div className="space-y-2">
                              <div className="space-y-1.5">
                                <span className="text-xs text-black/60 font-semibold">Color 1</span>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    value={surfaceGradientColor1[surface]}
                                    onChange={(e) => setSurfaceGradientColor1((m) => ({ ...m, [surface]: e.target.value }))}
                                    className="h-10 w-12 rounded-lg border border-black/10 cursor-pointer"
                                  />
                                  <input
                                    type="text"
                                    value={surfaceGradientColor1[surface]}
                                    onChange={(e) => setSurfaceGradientColor1((m) => ({ ...m, [surface]: e.target.value }))}
                                    className="flex-1 rounded-lg border border-black/10 bg-white px-2 py-1 text-xs font-mono uppercase"
                                  />
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <span className="text-xs text-black/60 font-semibold">Color 2</span>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    value={surfaceGradientColor2[surface]}
                                    onChange={(e) => setSurfaceGradientColor2((m) => ({ ...m, [surface]: e.target.value }))}
                                    className="h-10 w-12 rounded-lg border border-black/10 cursor-pointer"
                                  />
                                  <input
                                    type="text"
                                    value={surfaceGradientColor2[surface]}
                                    onChange={(e) => setSurfaceGradientColor2((m) => ({ ...m, [surface]: e.target.value }))}
                                    className="flex-1 rounded-lg border border-black/10 bg-white px-2 py-1 text-xs font-mono uppercase"
                                  />
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <span className="text-xs text-black/60 font-semibold">Direction</span>
                                <div className="grid grid-cols-5 gap-1">
                                  {(['left', 'top-left', 'top', 'top-right', 'right'] as const).map((dir) => (
                                    <button
                                      key={dir}
                                      type="button"
                                      onClick={() => setSurfaceGradientDirection((m) => ({ ...m, [surface]: dir }))}
                                      className={`h-8 rounded-lg text-xs font-bold transition ${surfaceGradientDirection[surface] === dir ? 'bg-black text-white' : 'border border-black/10 bg-white text-black'}`}
                                    >
                                      {dir === 'left' && '←'}
                                      {dir === 'top-left' && '↖'}
                                      {dir === 'top' && '↑'}
                                      {dir === 'top-right' && '↗'}
                                      {dir === 'right' && '→'}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div
                                className="h-16 rounded-lg border border-black/10 transition-all"
                                style={{
                                  background: `linear-gradient(to ${surfaceGradientDirection[surface]}, ${surfaceGradientColor1[surface]}, ${surfaceGradientColor2[surface]})`,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <span className="text-sm font-semibold text-black/70">Choose finish</span>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => {
                              markSelectionStarted();
                              setLaptopFinishes((current) => ({ ...current, [surface]: 'shiny-stones' }));
                            }}
                            className={`relative rounded-2xl border-2 px-4 py-3 text-left font-bold transition-colors duration-200 ${
                              laptopFinishes[surface] === 'shiny-stones'
                                ? 'border-[#2f7777] bg-[#edf5f5] text-black shadow-sm'
                                : 'border-black/15 bg-white text-black hover:border-black/45'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="finish-swatch finish-swatch-shiny" aria-hidden="true"><i className="bx bxs-star" /></span>
                              <span><span className="block text-sm font-black">Shiny Stones</span><span className="mt-1 block text-xs font-medium text-black/55">+ ₦500</span></span>
                            </div>
                            {laptopFinishes[surface] === 'shiny-stones' && (
                              <div className="absolute right-3 top-3 text-[#2f7777]">
                                <i className="bx bx-check text-lg" aria-hidden="true" />
                              </div>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              markSelectionStarted();
                              setLaptopFinishes((current) => ({ ...current, [surface]: 'standard' }));
                            }}
                            className={`relative rounded-2xl border-2 px-4 py-3 text-left font-bold transition-colors duration-200 ${
                              laptopFinishes[surface] === 'standard'
                                ? 'border-[#2f7777] bg-[#edf5f5] text-black shadow-sm'
                                : 'border-black/15 bg-white text-black hover:border-black/45'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="finish-swatch finish-swatch-standard" aria-hidden="true" />
                              <span><span className="block text-sm font-black">Standard</span><span className="mt-1 block text-xs font-medium text-black/55">Save ₦500</span></span>
                            </div>
                            {laptopFinishes[surface] === 'standard' && (
                              <div className="absolute right-3 top-3 text-[#2f7777]">
                                <i className="bx bx-check text-lg" aria-hidden="true" />
                              </div>
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {!laptopTextToggle[surface] ? (
                          <button
                            type="button"
                            onClick={() => {
                              setLaptopTextToggle((current) => ({ ...current, [surface]: true }));
                            }}
                            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black/70 transition hover:border-black"
                          >
                            <i className="bx bx-plus mr-2" />Add text
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
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // MAIN RENDER
  return (
    <section id="builder" className="builder-shell mb-10 overflow-hidden rounded-[2.5rem] border border-black/10 bg-white/90 p-4 shadow-glow backdrop-blur sm:p-6">
      <div className="builder-content space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#2f7777]">Your device / Your design</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-black">Customize your skin</h2>
          </div>
        </div>

        {/* Stepper */}
        <div className="builder-progress" aria-label="Customization steps">
          <div className="builder-progress-mobile-status">
            <span>Step {String(currentStep).padStart(2, '0')} of 06</span>
            <strong>{stepLabels[currentStep - 1]}</strong>
          </div>
          {stepLabels.map((step, index) => {
            const stepNumber = index + 1;
            const isComplete = isStepComplete(stepNumber);
            const isCurrent = currentStep === stepNumber;
            const isLocked = stepNumber > currentStep;
            const isClickable = !isCurrent && !isLocked && isComplete;

            return (
              <button
                key={step}
                type="button"
                onClick={() => goToStep(stepNumber)}
                disabled={isLocked || isCurrent || !isClickable}
                aria-current={isCurrent ? 'step' : undefined}
                aria-disabled={isLocked || !isClickable}
                className={`builder-progress-step ${isCurrent ? 'is-active' : ''} ${isComplete ? 'is-complete' : ''} ${isLocked ? 'is-locked' : ''}`}
              >
                <span>{String(stepNumber).padStart(2, '0')}</span>
                <strong>{step}</strong>
              </button>
            );
          })}
        </div>

        {/* STEP 1: Details */}
        {currentStep === 1 && (
          <div className="builder-panel rounded-3xl border border-black/10 bg-[#f7f7f5] p-5 sm:p-6 animate-fade-in">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-black">Your Details</h3>
              <p className="text-sm text-black/60 mt-1">Start by telling us about yourself</p>
            </div>

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

            <div className="grid gap-4 sm:grid-cols-2 mt-4">
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
                  className={`w-full rounded-2xl border bg-white px-4 py-3 text-black outline-none focus:border-black ${
                    customerTouched.name && customerValidation.name ? 'border-red-500 bg-red-50' : 'border-black/10 bg-white'
                  }`}
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
                  className={`w-full rounded-2xl border bg-white px-4 py-3 text-black outline-none focus:border-black ${
                    customerTouched.phone && customerValidation.phone ? 'border-red-500 bg-red-50' : 'border-black/10 bg-white'
                  }`}
                />
                {customerTouched.phone && customerValidation.phone ? (
                  <p className="text-xs text-red-600">Please enter a valid phone number with 10–15 digits.</p>
                ) : null}
              </label>
            </div>

            {submissionResult && submissionType === 'error' ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {submissionResult}
              </div>
            ) : null}
          </div>
        )}

        {/* STEP 2: Device */}
        {currentStep === 2 && (
          <div className="builder-panel rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6 animate-fade-in">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-black">
                {category === 'laptop' && 'Your Laptop'}
                {category === 'phone' && 'Your Phone'}
                {category === 'controller' && 'Your Controller'}
                {category === 'others' && 'Your Item'}
              </h3>
              <p className="text-sm text-black/60 mt-1">
                {category === 'laptop' && 'Enter your laptop model'}
                {category === 'phone' && 'Select your phone coverage'}
                {category === 'controller' && 'Pick your controller type'}
                {category === 'others' && 'Tell us about your item'}
              </p>
            </div>

            {category === 'laptop' && (
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
            )}

            {category === 'phone' && (
              <div className="space-y-4">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-black">Phone Coverage</span>
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
                </label>
              </div>
            )}

            {category === 'controller' && (
              <label className="space-y-2">
                <span className="text-sm font-semibold text-black">Controller Type</span>
                <select
                  value={controllerSubtype}
                  onChange={(event) => {
                    markSelectionStarted();
                    setControllerSubtype(event.target.value as ControllerSubtype);
                  }}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black outline-none focus:border-black"
                >
                  {CONTROLLER_SUBTYPES.map((subtype) => (
                    <option key={subtype.value} value={subtype.value}>
                      {subtype.label}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {category === 'others' && (
              <div className="space-y-4">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-black">Item Name</span>
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
                  <span className="text-sm font-semibold text-black">Coverage Details</span>
                  <textarea
                    value={instructions}
                    onChange={(event) => {
                      markSelectionStarted();
                      setInstructions(event.target.value);
                    }}
                    rows={4}
                    placeholder="Describe the coverage and any reference measurements"
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black outline-none focus:border-black"
                  />
                </label>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Surfaces (Laptop only) */}
        {currentStep === 3 && category === 'laptop' && (
          <div className="builder-panel space-y-6 rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6 animate-fade-in">
            <div>
              <h3 className="text-lg font-bold text-black">Which surfaces?</h3>
              <p className="text-sm text-black/60 mt-1">Select the parts you want to cover</p>
              <button type="button" onClick={onHelpOpen} className="mt-3 inline-flex items-center gap-1 text-sm text-blue-600">
                <i className="bx bx-info-circle" /> Which parts are these?
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {LAPTOP_SURFACES.map((surface) => {
                const selected = laptopSelectedSurfaces.includes(surface.value);
                const imagePath =
                  surface.value === 'top-lid'
                    ? '/img/Top.png'
                    : surface.value === 'keyboard-deck'
                    ? '/img/Keyboard.png'
                    : '/img/Bottom.png';

                const description =
                  surface.value === 'top-lid'
                    ? 'Outer back cover'
                    : surface.value === 'keyboard-deck'
                    ? 'Palm rest & trackpad'
                    : 'Underside of laptop';

                return (
                  <button
                    key={surface.value}
                    type="button"
                    onClick={() => handleToggleLaptopSurface(surface.value)}
                    className={`group relative overflow-hidden rounded-[1.75rem] border-2 bg-white p-0 text-left transition-all duration-200 ${
                      selected
                        ? 'border-[#66cccc] bg-[#f4fbfb] shadow-[0_0_0_1px_rgba(102,204,204,0.25)]'
                        : 'border-black/10 hover:border-black/30 hover:bg-[#fafaf9]'
                    }`}
                    aria-pressed={selected}
                  >
                    <div className="relative overflow-hidden rounded-t-[1.5rem] bg-[#f0f1ee]">
                      <div className="relative h-44 w-full overflow-hidden sm:h-48">
                        <Image
                          src={imagePath}
                          alt={`${surface.label} surface preview`}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className={`object-cover transition duration-200 ${selected ? 'scale-[1.02]' : 'group-hover:scale-[1.04]'}`}
                        />
                      </div>
                      {selected && (
                        <span className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#2f7777] bg-[#66cccc] text-white shadow-sm">
                          <i className="bx bx-check text-lg" aria-hidden="true" />
                        </span>
                      )}
                    </div>

                    <div className="space-y-3 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-base font-black tracking-[-0.03em] text-black">{surface.label}</span>
                        {!selected && (
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-black/10 bg-white text-black/50">
                            <i className="bx bx-plus text-lg" aria-hidden="true" />
                          </span>
                        )}
                      </div>
                      <p className="text-sm leading-5 text-black/60">{description}</p>
                      <div
                        className={`inline-flex items-center rounded-full border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] ${
                          selected
                            ? 'border-[#66cccc] bg-[#dff7f7] text-[#1f5f5f]'
                            : 'border-black/10 bg-[#f7f7f5] text-black/60'
                        }`}
                      >
                        {selected ? 'Selected' : 'Select'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {laptopSelectedSurfaces.length === 0 ? (
              <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                Select at least one laptop surface to continue.
              </div>
            ) : null}
          </div>
        )}

        {/* STEP 4: Artwork */}
        {currentStep === 4 && (
          <div className="animate-fade-in">
            {category === 'laptop' && renderLaptopArtworkContent()}

            {category === 'phone' && (
              <div className="builder-panel space-y-6 rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
                <div>
                  <h3 className="text-lg font-bold text-black">Phone Design</h3>
                  <p className="text-sm text-black/60 mt-1">Choose artwork and optional custom text</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-black">Your Artwork</span>
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

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-black">Gallery Artwork</span>
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
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="space-y-2">
                  {!phoneTextToggle ? (
                    <button
                      type="button"
                      onClick={() => setPhoneTextToggle(true)}
                      className="w-full rounded-2xl border border-black/10 bg-[#f7f7f5] px-4 py-3 text-sm text-black/70 transition hover:border-black"
                    >
                      <i className="bx bx-plus mr-2" />Add text
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-black">Custom Text</span>
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
              </div>
            )}

            {category === 'controller' && (
              <div className="builder-panel space-y-6 rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
                <div>
                  <h3 className="text-lg font-bold text-black">Controller Design</h3>
                  <p className="text-sm text-black/60 mt-1">Choose artwork and optional gamer tag</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-black">Your Artwork</span>
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

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-black">Gallery Artwork</span>
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
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="space-y-2">
                  {!controllerTagToggle ? (
                    <button
                      type="button"
                      onClick={() => setControllerTagToggle(true)}
                      className="w-full rounded-2xl border border-black/10 bg-[#f7f7f5] px-4 py-3 text-sm text-black/70 transition hover:border-black"
                    >
                      <i className="bx bx-plus mr-2" />Add gamer tag
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-black">Gamer Tag</span>
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
              </div>
            )}

            {category === 'others' && (
              <div className="builder-panel space-y-6 rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
                <div>
                  <h3 className="text-lg font-bold text-black">Reference Photo</h3>
                  <p className="text-sm text-black/60 mt-1">Upload a reference image for your item</p>
                </div>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-black">Photo</span>
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
        )}

        {/* STEP 5: Install */}
        {currentStep === 5 && (
          <div className="builder-panel space-y-6 rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6 animate-fade-in">
            <div>
              <h3 className="text-lg font-bold text-black">Installation</h3>
              <p className="text-sm text-black/60 mt-1">How would you like it installed?</p>
            </div>

            {(category === 'laptop' || category === 'phone' || category === 'controller') && (
              <div className="grid gap-4 sm:grid-cols-2">
                {(['professional', 'diy'] as InstallationOption[]).map((option) => {
                  const isSelected =
                    (category === 'laptop' && laptopInstallOption === option) ||
                    (category === 'phone' && phoneInstallOption === option) ||
                    (category === 'controller' && controllerInstallOption === option);

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        markSelectionStarted();
                        if (category === 'laptop') setLaptopInstallOption(option);
                        if (category === 'phone') setPhoneInstallOption(option);
                        if (category === 'controller') setControllerInstallOption(option);
                      }}
                      className={`relative rounded-3xl border-2 px-6 py-5 text-left font-bold transition-all duration-200 ${
                        isSelected
                          ? 'border-black bg-black text-white shadow-lg scale-105'
                          : 'border-black/20 bg-white text-black hover:border-black hover:shadow-md hover:scale-102'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-xl">{option === 'professional' ? '🔧' : '✋'}</div>
                        <div>
                          <div className="text-base font-bold">{option === 'professional' ? 'Professional fitting' : 'Apply it yourself'}</div>
                          <div className={`text-xs mt-1 ${isSelected ? 'text-white/80' : 'text-black/60'}`}>
                            {option === 'professional' ? 'Free' : '- ₦500 discount'}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="absolute top-3 right-3 text-white">
                          <i className="bx bx-check text-2xl" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* STEP 6: Review */}
        {currentStep === 6 && (
          <div className="animate-fade-in space-y-6">
            <div className="builder-panel rounded-3xl border border-black/10 bg-[#f7f7f5] p-5 sm:p-6">
              <h3 className="text-lg font-bold text-black mb-4">Review Your Order</h3>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-black/60">Name</span>
                  <span className="font-semibold text-black">{clientName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-black/60">Phone</span>
                  <span className="font-semibold text-black">{phoneNumber}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-black/10 pt-3 mt-3">
                  <span className="text-black/60">Category</span>
                  <span className="font-semibold text-black capitalize">{category}</span>
                </div>
              </div>
            </div>

            <div id="price-section" className="builder-summary rounded-3xl border border-black/10 bg-[#fafafa] p-5 sm:p-6">
              <div className="flex flex-col gap-4 border-b border-black/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#2f7777]">Your skin</p>
                  <h3 className="mt-2 text-2xl font-black tracking-[-0.03em] text-black">Order summary</h3>
                </div>
                <div className={`rounded-full px-4 py-2 text-sm font-bold ${pricingQuotePending ? 'border border-amber-200 bg-amber-50 text-amber-900' : 'bg-black text-white'}`}>
                  {pricingQuotePending ? 'Quote required' : formatCurrency(pricing.total)}
                </div>
              </div>
              <div className="mt-6 space-y-2">
                {pricing.lineItems.length === 0 ? (
                  <div className="text-sm text-black/60 py-4">No items selected yet</div>
                ) : (
                  <>
                    {pricing.lineItems.map((item, index) => {
                      const isAdjustment = item.price < 0;
                      const isLast = index === pricing.lineItems.length - 1;
                      return (
                        <div
                          key={`${item.label}-${index}`}
                          className={`flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 transition ${
                            isAdjustment
                              ? 'border-green-200 bg-green-50'
                              : 'border-black/10 bg-white hover:border-black/20'
                          } ${isLast ? 'border-t-2 border-black/20 mt-3 pt-4' : ''}`}
                        >
                          <span className={`text-sm ${isAdjustment ? 'text-green-700 font-medium' : 'text-black/80'}`}>
                            {item.label}
                          </span>
                          <span
                            className={`text-sm font-semibold ${
                              isAdjustment ? 'text-green-700' : 'text-black'
                            }`}
                          >
                            {item.price >= 0 ? formatCurrency(item.price) : `- ${formatCurrency(Math.abs(item.price))}`}
                          </span>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
              <div className="mt-6 flex flex-col gap-5 border-t border-black/10 pt-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-black/50">Total</div>
                  <div className="mt-1 text-3xl font-black tracking-[-0.04em] text-black">
                    {pricingQuotePending ? 'Custom quote' : formatCurrency(pricing.total)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="min-h-12 rounded-full bg-[#66cccc] px-6 py-4 text-sm font-bold text-black transition hover:bg-[#8de0e0] focus:outline-none focus:ring-2 focus:ring-[#2f8f8f] disabled:cursor-not-allowed disabled:bg-black/40"
                >
                  {isSubmitting ? 'Booking your skin...' : 'Book My Skin'}
                </button>
              </div>
              {submissionResult ? (
                <p
                  className={`mt-4 rounded-2xl border px-3 py-2 text-sm font-medium ${
                    submissionType === 'success'
                      ? 'border-green-200 bg-green-50 text-green-700'
                      : 'border-red-200 bg-red-50 text-red-700'
                  }`}
                >
                  {submissionResult}
                </p>
              ) : null}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex flex-col gap-3 border-t border-black/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="min-h-11 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-bold text-black transition hover:border-black"
            >
              ← Back
            </button>
          )}

          {currentStep < 6 && (
            <button
              type="button"
              onClick={handleContinue}
              className="min-h-11 rounded-full bg-[#66cccc] px-6 py-3 text-sm font-bold text-black transition hover:bg-[#8de0e0] disabled:cursor-not-allowed disabled:bg-black/20 disabled:text-black/40"
            >
              Continue →
            </button>
          )}
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

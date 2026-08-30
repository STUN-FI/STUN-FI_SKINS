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

  const laptopSyncSourceSurface = laptopSelectedSurfaces[0] ?? null;
  const laptopSyncSourceLabel = laptopSyncSourceSurface
    ? LAPTOP_SURFACES.find((item) => item.value === laptopSyncSourceSurface)?.label ?? 'Top Lid'
    : 'Top Lid';

  // Auto-open accordion for the first selected surface
  useEffect(() => {
    if (laptopSelectedSurfaces.length > 0) {
      const firstSurface = laptopSelectedSurfaces[0];
      setExpandedLaptopSurface(firstSurface);
    }
    // Disable sync if only one surface remains or there is no active source surface
    if (laptopSelectedSurfaces.length <= 1 || !laptopSyncSourceSurface) {
      setSyncLaptopSurfaces(false);
    }
  }, [laptopSelectedSurfaces, laptopSyncSourceSurface]);

  // Sync the first selected surface's changes to the other surfaces when sync is enabled
  useEffect(() => {
    if (syncLaptopSurfaces && laptopSyncSourceSurface && laptopSelectedSurfaces.length > 1) {
      syncSelectedSurfaceToOtherSurfaces(laptopSyncSourceSurface);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    syncLaptopSurfaces,
    laptopSelectedSurfaces.length,
    laptopFinishes,
    laptopTexts,
    laptopArtworkCatalog,
    laptopArtworkFiles,
    laptopArtworkMode,
  ]);

  useEffect(() => {
    onSubmittingChange?.(isSubmitting);
  }, [isSubmitting, onSubmittingChange]);

  useEffect(() => {
    if (!catalogSelection) return;
    const { surface, imageUrl } = catalogSelection;

    // Always apply per-surface
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

  // Break sync when a non-source surface is edited
  const handleBreakSync = (editedSurface?: LaptopSurface) => {
    if (syncLaptopSurfaces && (!editedSurface || editedSurface !== laptopSyncSourceSurface)) {
      setSyncLaptopSurfaces(false);
    }
  };

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
      if (surface !== 'top-lid') {
        setSyncLaptopSurfaces(false);
      }
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

  // Per-surface design source handlers (Phase 3)
  const handleSelectDesignMode = (surface: LaptopSurface, mode: 'upload' | 'gallery' | 'color') => {
    markSelectionStarted();
    handleBreakSync(surface);
    setSurfaceDesignSourceMode((current) => ({ ...current, [surface]: mode }));
    focusSurfaceDesignEditor(surface);
  };

  const applyUploadToSurface = (surface: LaptopSurface, file: File) => {
    setSurfaceUploadedFile((current) => ({ ...current, [surface]: file }));
    const previewUrl = URL.createObjectURL(file);
    
    const previousUrl = uploadPreviewUrlsRef.current[surface];
    if (previousUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(previousUrl);
    }
    
    uploadPreviewUrlsRef.current[surface] = previewUrl;
    setLaptopArtworkFiles((current) => ({ ...current, [surface]: file }));
    setLaptopArtworkCatalog((current) => ({ ...current, [surface]: '' }));
    setLaptopArtworkMode((m) => ({ ...m, [surface]: 'upload' }));
    setSurfaceDesigns((current) => ({ ...current, [surface]: { previewUrl } }));
  };

  const applyColorToSurface = (surface: LaptopSurface) => {
    const colorType = surfaceColorDesignType[surface];
    const solidC = surfaceSolidColor[surface];
    const grad1 = surfaceGradientColor1[surface];
    const grad2 = surfaceGradientColor2[surface];
    const dir = surfaceGradientDirection[surface];
    
    const colorSource = colorType === 'solid'
      ? solidC
      : `linear-gradient(to ${dir}, ${grad1}, ${grad2})`;
    
    const previousUrl = uploadPreviewUrlsRef.current[surface];
    if (previousUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(previousUrl);
      uploadPreviewUrlsRef.current[surface] = '';
    }
    
    setLaptopArtworkFiles((current) => ({ ...current, [surface]: null }));
    setLaptopArtworkCatalog((current) => ({ ...current, [surface]: '' }));
    setLaptopArtworkMode((m) => ({ ...m, [surface]: 'catalog' }));
    setSurfaceDesigns((current) => ({ ...current, [surface]: { previewUrl: colorSource } }));
  };

  // Auto-apply color changes when in color mode
  useEffect(() => {
    LAPTOP_SURFACES.forEach((s) => {
      if (surfaceDesignSourceMode[s.value] === 'color') {
        applyColorToSurface(s.value);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surfaceColorDesignType, surfaceSolidColor, surfaceGradientColor1, surfaceGradientColor2, surfaceGradientDirection]);

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
    setLaptopSelectedSurfaces(['top-lid', 'keyboard-deck', 'bottom-base']);
    setLaptopFinishes(DEFAULT_LAPTOP_FINISHES);
    setLaptopTexts(DEFAULT_LAPTOP_TEXTS);
    setLaptopTextToggle({
      'top-lid': false,
      'keyboard-deck': false,
      'bottom-base': false,
    });
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
    setExpandedLaptopSurface('top-lid');
    setLaptopCopiedSettings(false);
    setShowCopyPrompt(false);
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
    
    // Reset Phase 3 per-surface design mode state
    setSurfaceDesignSourceMode({ 'top-lid': null, 'keyboard-deck': null, 'bottom-base': null });
    setSurfaceColorDesignType({ 'top-lid': 'solid', 'keyboard-deck': 'solid', 'bottom-base': 'solid' });
    setSurfaceSolidColor({ 'top-lid': '#ffffff', 'keyboard-deck': '#ffffff', 'bottom-base': '#ffffff' });
    setSurfaceGradientColor1({ 'top-lid': '#000000', 'keyboard-deck': '#000000', 'bottom-base': '#000000' });
    setSurfaceGradientColor2({ 'top-lid': '#ffffff', 'keyboard-deck': '#ffffff', 'bottom-base': '#ffffff' });
    setSurfaceGradientDirection({ 'top-lid': 'right', 'keyboard-deck': 'right', 'bottom-base': 'right' });
    setSurfaceUploadedFile({ 'top-lid': null, 'keyboard-deck': null, 'bottom-base': null });
    setSurfaceSelectedGalleryUrl({ 'top-lid': '', 'keyboard-deck': '', 'bottom-base': '' });
    setSyncLaptopSurfaces(false);
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
        imageUrl: laptopArtworkCatalog[surface] || surfaceDesigns[surface]?.previewUrl || '',
        monogramText: laptopTexts[surface] || '',
      }));
    }

    if (category === 'phone') {
      return [
        {
          name: PHONE_COVERAGE_OPTIONS.find((item) => item.value === phoneCoverage)?.label || 'Phone Artwork',
          imageUrl: phoneArtworkCatalog || '',
          monogramText: phoneCustomText || '',
        },
      ];
    }

    if (category === 'controller') {
      return [
        {
          name: CONTROLLER_SUBTYPES.find((item) => item.value === controllerSubtype)?.label || 'Controller Artwork',
          imageUrl: controllerArtworkCatalog || '',
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

  const syncSelectedSurfaceToOtherSurfaces = (sourceSurface: LaptopSurface) => {
    const sourcePreviewUrl =
      uploadPreviewUrlsRef.current[sourceSurface] ||
      surfaceDesigns[sourceSurface]?.previewUrl ||
      laptopArtworkCatalog[sourceSurface] ||
      '';

    const otherSurfaces = laptopSelectedSurfaces.filter((surface) => surface !== sourceSurface);

    // Copy artwork settings
    setLaptopArtworkMode((curr) => ({
      ...curr,
      ...Object.fromEntries(otherSurfaces.map((surface) => [surface, laptopArtworkMode[sourceSurface]])),
    }));

    // Copy artwork files/catalog
    setLaptopArtworkFiles((curr) => ({
      ...curr,
      ...Object.fromEntries(otherSurfaces.map((surface) => [surface, laptopArtworkFiles[sourceSurface]])),
    }));

    setLaptopArtworkCatalog((curr) => ({
      ...curr,
      ...Object.fromEntries(otherSurfaces.map((surface) => [surface, laptopArtworkCatalog[sourceSurface]])),
    }));

    setSurfaceDesigns((curr) => ({
      ...curr,
      ...Object.fromEntries(otherSurfaces.map((surface) => [surface, { previewUrl: sourcePreviewUrl }])),
    }));

    otherSurfaces.forEach((surface) => {
      uploadPreviewUrlsRef.current[surface] = sourcePreviewUrl.startsWith('blob:') ? sourcePreviewUrl : '';
    });

    // Copy finishes
    setLaptopFinishes((curr) => ({
      ...curr,
      ...Object.fromEntries(otherSurfaces.map((surface) => [surface, laptopFinishes[sourceSurface]])),
    }));

    // Copy text settings
    setLaptopTextToggle((curr) => ({
      ...curr,
      ...Object.fromEntries(otherSurfaces.map((surface) => [surface, laptopTextToggle[sourceSurface]])),
    }));

    setLaptopTexts((curr) => ({
      ...curr,
      ...Object.fromEntries(otherSurfaces.map((surface) => [surface, laptopTexts[sourceSurface]])),
    }));
  };

  const handleCopyLaptopSettings = () => {
    if (laptopSyncSourceSurface) {
      syncSelectedSurfaceToOtherSurfaces(laptopSyncSourceSurface);
    }
    setLaptopCopiedSettings(true);
    setShowCopyPrompt(false);
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
        const catalogUrl = laptopArtworkCatalog[surface]?.trim();

        if (file) {
          formData.append(`artwork_${surface}`, file);
          return;
        }

        if (catalogUrl) {
          formData.append(`artwork_${surface}`, catalogUrl);
        }
      });
    }

    if (category === 'phone') {
      if (phoneArtworkFile) {
        formData.append('artwork_phone', phoneArtworkFile);
      } else if (phoneArtworkCatalog.trim()) {
        formData.append('artwork_phone', phoneArtworkCatalog.trim());
      }
    }

    if (category === 'controller') {
      if (controllerArtworkFile) {
        formData.append('artwork_controller', controllerArtworkFile);
      } else if (controllerArtworkCatalog.trim()) {
        formData.append('artwork_controller', controllerArtworkCatalog.trim());
      }
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

  return (
    <section id="builder" className="builder-shell mb-10 overflow-hidden rounded-[2.5rem] border border-black/10 bg-white/90 p-4 shadow-glow backdrop-blur sm:p-6">
      <div className="builder-content space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#2f7777]">Your device / Your design</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-black">Customize your skin</h2>
          </div>
        </div>

        <div className="builder-progress" aria-label="Customization steps">
          <div className="builder-progress-mobile-status"><span>Step 01 of 07</span><strong>Details</strong></div>
          {['Details', 'Device', 'Surfaces', 'Artwork', 'Finish', 'Install', 'Review'].map((step, index) => (
            <div key={step} className={`builder-progress-step ${index === 0 ? 'is-active' : ''}`}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{step}</strong>
            </div>
          ))}
        </div>

        <div className="builder-panel rounded-3xl border border-black/10 bg-[#f7f7f5] p-5 sm:p-6">
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
            <div className="builder-panel space-y-6 rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
              <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-black/70">What do you want to cover?</p>
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
                        <div className={`inline-flex items-center rounded-full border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] ${
                          selected
                            ? 'border-[#66cccc] bg-[#dff7f7] text-[#1f5f5f]'
                            : 'border-black/10 bg-[#f7f7f5] text-black/60'
                        }`}>
                          {selected ? 'Selected' : 'Select'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {laptopSelectedSurfaces.length === 0 ? (
                <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">Select at least one laptop surface to continue.</div>
              ) : (
                <>
                  <div className="space-y-3">
                  {laptopSelectedSurfaces.map((surface, index) => {
                    const isExpanded = expandedLaptopSurface === surface;
                    const surfaceLabel = LAPTOP_SURFACES.find((item) => item.value === surface)?.label;
                    const hasCatalogArt = laptopArtworkCatalog[surface]?.trim().length > 0;
                    const hasCustomText = laptopTextToggle[surface];
                    
                    return (
                      <div key={surface} ref={(node) => { surfaceAccordionRefs.current[surface] = node; }}>
                        {/* Accordion Header */}
                        <button
                          type="button"
                          onClick={() => toggleLaptopSurface(surface)}
                          className="w-full rounded-3xl border border-black/10 bg-white p-5 transition hover:border-black/30"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 text-left">
                              <span className="text-lg font-semibold text-black">{surfaceLabel}</span>
                              {!isExpanded && laptopCopiedSettings && surface !== laptopSelectedSurfaces[0] && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Copied</span>
                              )}
                              {!isExpanded && (
                                <div className="flex min-w-0 flex-wrap gap-x-2 text-xs text-black/60">
                                  {laptopFinishes[surface] === 'shiny-stones' ? (
                                    <span>Premium</span>
                                  ) : (
                                    <span>Standard</span>
                                  )}
                                  {hasCatalogArt && <span>•</span>}
                                  {hasCatalogArt && <span>Catalog Art</span>}
                                  {hasCustomText && <span>•</span>}
                                  {hasCustomText && <span>Custom Text</span>}
                                </div>
                              )}
                            </div>
                            <i className={`bx bx-chevron-down shrink-0 pt-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </button>

                        {/* Accordion Content */}
                        {isExpanded && (
                          <div className="rounded-b-3xl border border-t-0 border-black/10 bg-[#f7f7f5] p-5 space-y-4">
                            {/* Sync indicator for synced surfaces */}
                            {syncLaptopSurfaces && laptopSyncSourceSurface && surface !== laptopSyncSourceSurface && (
                              <div className="rounded-2xl border border-[#66cccc] bg-[#e6fffe] px-4 py-3">
                                <p className="text-xs font-semibold text-[#2f7777]">
                                  Synced to {laptopSyncSourceLabel} · Changes here will break the sync
                                </p>
                              </div>
                            )}
                            
                            {/* Phase 3: Per-Surface Design Selection */}
                            <div
                              ref={(node) => {
                                surfaceDesignEditorRefs.current[surface] = node;
                              }}
                              className={`space-y-4 rounded-2xl border p-3 transition-all duration-300 ${highlightedDesignSurface === surface ? 'border-[#2f7777] bg-[#edf5f5] ring-2 ring-[#2f7777]/35' : 'border-transparent bg-transparent'}`}
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
                                    {/* Upload Card */}
                                    <button
                                      type="button"
                                      onClick={() => handleSelectDesignMode(surface, 'upload')}
                                      className={`group relative overflow-hidden rounded-2xl border-2 p-0 text-left transition-all duration-200 ${surfaceDesignSourceMode[surface] === 'upload' ? 'border-[#66cccc] bg-[#e6fffe]' : 'border-black/10 bg-white hover:border-black/30'}`}
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

                                    {/* Gallery Card */}
                                    <button
                                      type="button"
                                      onClick={() => handleSelectDesignMode(surface, 'gallery')}
                                      className={`group relative overflow-hidden rounded-2xl border-2 p-0 text-left transition-all duration-200 ${surfaceDesignSourceMode[surface] === 'gallery' ? 'border-[#66cccc] bg-[#e6fffe]' : 'border-black/10 bg-white hover:border-black/30'}`}
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

                                    {/* Color Card */}
                                    <button
                                      type="button"
                                      onClick={() => handleSelectDesignMode(surface, 'color')}
                                      className={`group relative overflow-hidden rounded-2xl border-2 p-0 text-left transition-all duration-200 ${surfaceDesignSourceMode[surface] === 'color' ? 'border-[#66cccc] bg-[#e6fffe]' : 'border-black/10 bg-white hover:border-black/30'}`}
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

                              {/* Upload Mode Editor */}
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
                                  {surfaceUploadedFile[surface] && (
                                    <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800">
                                      ✓ File ready for {surfaceLabel}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Gallery Mode Editor */}
                              {surfaceDesignSourceMode[surface] === 'gallery' && (
                                <div className="rounded-2xl border border-black/10 bg-white p-4 space-y-3">
                                  <button
                                    type="button"
                                    onClick={() => onCatalogOpen(surface)}
                                    className="w-full min-h-10 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-medium text-black transition hover:border-black/40"
                                  >
                                    <i className="bx bx-palette mr-2" /> Browse Gallery
                                  </button>
                                  {laptopArtworkCatalog[surface] && laptopArtworkCatalog[surface].trim() && (
                                    <div className="flex items-center gap-3">
                                      <img src={laptopArtworkCatalog[surface]} alt="selected" className="h-12 w-16 rounded-lg object-cover" />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleBreakSync(surface);
                                          setLaptopArtworkCatalog((c) => ({ ...c, [surface]: '' }));
                                          setSurfaceDesignSourceMode((m) => ({ ...m, [surface]: null }));
                                        }}
                                        className="text-sm text-red-600 hover:text-red-700"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Color Mode Editor */}
                              {surfaceDesignSourceMode[surface] === 'color' && (
                                <div className="rounded-2xl border border-black/10 bg-white p-4 space-y-3">
                                  <div className="flex w-full flex-wrap gap-1 rounded-xl bg-[#efefef] p-1 sm:w-auto">
                                    <button
                                      type="button"
                                      onClick={() => setSurfaceColorDesignType((m) => ({ ...m, [surface]: 'solid' }))}
                                      className={`min-h-9 flex-1 rounded-lg px-2.5 py-1 text-xs font-bold transition sm:flex-none sm:px-3 ${surfaceColorDesignType[surface] === 'solid' ? 'bg-black text-white' : 'text-black/70'}`}
                                    >
                                      Solid
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setSurfaceColorDesignType((m) => ({ ...m, [surface]: 'gradient' }))}
                                      className={`min-h-9 flex-1 rounded-lg px-2.5 py-1 text-xs font-bold transition sm:flex-none sm:px-3 ${surfaceColorDesignType[surface] === 'gradient' ? 'bg-black text-white' : 'text-black/70'}`}
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

                            {/* Finish & Text Options */}
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <span className="text-sm font-semibold text-black/70">Choose finish</span>
                                <div className="grid gap-2 sm:grid-cols-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      markSelectionStarted();
                                      handleBreakSync(surface);
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
                                      handleBreakSync(surface);
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
                                      handleBreakSync(surface);
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
                                          handleBreakSync(surface);
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
                                        handleBreakSync(surface);
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

                            {surface === laptopSelectedSurfaces[0] && laptopSelectedSurfaces.length > 1 && (
                              <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-[#f7f7f5] px-4 py-3">
                                <input
                                  type="checkbox"
                                  id={`sync-surfaces-${surface}`}
                                  checked={syncLaptopSurfaces}
                                  onChange={(e) => {
                                    setSyncLaptopSurfaces(e.target.checked);
                                    if (e.target.checked) {
                                      syncSelectedSurfaceToOtherSurfaces(surface);
                                    }
                                  }}
                                  className="h-4 w-4 cursor-pointer"
                                />
                                <label htmlFor={`sync-surfaces-${surface}`} className="flex-1 cursor-pointer text-sm font-medium text-black">
                                  Sync this design to the other selected surfaces
                                  <div className="mt-0.5 text-xs text-black/55">Changes to {laptopSyncSourceLabel} will update the other selected surfaces</div>
                                </label>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  </div>
                </>
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
                          <div className="text-base font-bold">{option === 'professional' ? 'Professional fitting' : 'Apply it yourself'}</div>
                          <div className={`text-xs mt-1 ${laptopInstallOption === option ? 'text-white/80' : 'text-black/60'}`}>{option === 'professional' ? 'Free' : '- ₦500 discount'}</div>
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
            <div className="builder-panel space-y-6 rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
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
                  <span className="text-sm font-semibold text-black/70">Choose finish</span>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => {
                        markSelectionStarted();
                        setPhoneFinish('shiny-stones');
                      }}
                      className={`relative rounded-2xl border-2 px-4 py-3 text-left font-bold transition-colors duration-200 ${
                        phoneFinish === 'shiny-stones'
                          ? 'border-[#2f7777] bg-[#edf5f5] text-black shadow-sm'
                          : 'border-black/15 bg-white text-black hover:border-black/45'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="finish-swatch finish-swatch-shiny" aria-hidden="true"><i className="bx bxs-star" /></span>
                        <span><span className="block text-sm font-black">Shiny Stones</span><span className="mt-1 block text-xs font-medium text-black/55">+ ₦500</span></span>
                      </div>
                      {phoneFinish === 'shiny-stones' && (
                        <div className="absolute right-3 top-3 text-[#2f7777]">
                          <i className="bx bx-check text-lg" aria-hidden="true" />
                        </div>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        markSelectionStarted();
                        setPhoneFinish('standard');
                      }}
                      className={`relative rounded-2xl border-2 px-4 py-3 text-left font-bold transition-colors duration-200 ${
                        phoneFinish === 'standard'
                          ? 'border-[#2f7777] bg-[#edf5f5] text-black shadow-sm'
                          : 'border-black/15 bg-white text-black hover:border-black/45'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="finish-swatch finish-swatch-standard" aria-hidden="true" />
                        <span><span className="block text-sm font-black">Standard</span><span className="mt-1 block text-xs font-medium text-black/55">Save ₦500</span></span>
                      </div>
                      {phoneFinish === 'standard' && (
                        <div className="absolute right-3 top-3 text-[#2f7777]">
                          <i className="bx bx-check text-lg" aria-hidden="true" />
                        </div>
                      )}
                    </button>
                  </div>
                </div>
                <label className="space-y-2">
                  <span className="text-sm text-black/70">Your artwork</span>

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
                <span className="text-sm text-black/70">Gallery artwork</span>
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
                    <i className="bx bx-plus mr-2" />Add text
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
                          <div className="text-base font-bold">{option === 'professional' ? 'Professional fitting' : 'Apply it yourself'}</div>
                          <div className={`text-xs mt-1 ${phoneInstallOption === option ? 'text-white/80' : 'text-black/60'}`}>{option === 'professional' ? 'Free' : '- ₦500 discount'}</div>
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
            <div className="builder-panel space-y-6 rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
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
                  <span className="text-sm font-semibold text-black/70">Choose finish</span>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => {
                        markSelectionStarted();
                        setControllerFinish('shiny-stones');
                      }}
                      className={`relative rounded-2xl border-2 px-4 py-3 text-left font-bold transition-colors duration-200 ${
                        controllerFinish === 'shiny-stones'
                          ? 'border-[#2f7777] bg-[#edf5f5] text-black shadow-sm'
                          : 'border-black/15 bg-white text-black hover:border-black/45'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="finish-swatch finish-swatch-shiny" aria-hidden="true"><i className="bx bxs-star" /></span>
                        <span><span className="block text-sm font-black">Shiny Stones</span><span className="mt-1 block text-xs font-medium text-black/55">+ ₦500</span></span>
                      </div>
                      {controllerFinish === 'shiny-stones' && (
                        <div className="absolute right-3 top-3 text-[#2f7777]">
                          <i className="bx bx-check text-lg" aria-hidden="true" />
                        </div>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        markSelectionStarted();
                        setControllerFinish('standard');
                      }}
                      className={`relative rounded-2xl border-2 px-4 py-3 text-left font-bold transition-colors duration-200 ${
                        controllerFinish === 'standard'
                          ? 'border-[#2f7777] bg-[#edf5f5] text-black shadow-sm'
                          : 'border-black/15 bg-white text-black hover:border-black/45'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="finish-swatch finish-swatch-standard" aria-hidden="true" />
                        <span><span className="block text-sm font-black">Standard</span><span className="mt-1 block text-xs font-medium text-black/55">Save ₦500</span></span>
                      </div>
                      {controllerFinish === 'standard' && (
                        <div className="absolute right-3 top-3 text-[#2f7777]">
                          <i className="bx bx-check text-lg" aria-hidden="true" />
                        </div>
                      )}
                    </button>
                  </div>
                </div>
                <label className="space-y-2">
                  <span className="text-sm text-black/70">Your artwork</span>
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
                <span className="text-sm text-black/70">Gallery artwork</span>
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
                    <i className="bx bx-plus mr-2" />Add gamer tag
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
                          <div className="text-base font-bold">{option === 'professional' ? 'Professional fitting' : 'Apply it yourself'}</div>
                          <div className={`text-xs mt-1 ${controllerInstallOption === option ? 'text-white/80' : 'text-black/60'}`}>{option === 'professional' ? 'Free' : '- ₦500 discount'}</div>
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
            <div className="builder-panel space-y-6 rounded-3xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-black/70">Custom item</p>
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
                <span className="text-sm text-black/70">Coverage details</span>
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
                <span className="text-sm text-black/70">Reference photo</span>
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

        <div id="price-section" className="builder-summary rounded-3xl border border-black/10 bg-[#fafafa] p-5 sm:p-6">
          <div className="flex flex-col gap-4 border-b border-black/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#2f7777]">Your skin</p>
              <h3 className="mt-2 text-2xl font-black tracking-[-0.03em] text-black">Order summary</h3>
              <p className="mt-2 text-sm text-black/60">A clear breakdown before you book.</p>
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
              <p className="mt-2 text-xs text-black/55">Professional installation is available during setup.</p>
            </div>
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="min-h-12 rounded-full bg-[#66cccc] px-6 py-4 text-sm font-bold text-black transition hover:bg-[#8de0e0] focus:outline-none focus:ring-2 focus:ring-[#2f8f8f] disabled:cursor-not-allowed disabled:bg-black/40"
              >
                {isSubmitting ? 'Booking your skin...' : 'Book My Skin'}
              </button>
              <Link
                href="/orders"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-black/15 bg-white px-5 py-3 text-sm font-bold text-black transition hover:border-black focus:outline-none focus:ring-2 focus:ring-[#2f8f8f]"
              >
                <i className="bx bx-history text-base" />
                <span>View Order History</span>
              </Link>
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

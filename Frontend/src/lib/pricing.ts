export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value);
}

export type FinishType = 'standard' | 'shiny-stones';
export type InstallationOption = 'professional' | 'diy';
export type Category = 'laptop' | 'phone' | 'controller' | 'others';
export type LaptopSurface = 'top-lid' | 'keyboard-deck' | 'bottom-base';
export type PhoneCoverage = 'back-panel' | 'full-body';
export type ControllerSubtype =
  | 'ps3'
  | 'ps4'
  | 'ps5-dualsense'
  | 'xbox-360'
  | 'xbox-one'
  | 'xbox-series'
  | 'switch-pro';
export type OrderMode = 'individual' | 'wholesale';

const LAPTOP_BASE_STANDARD = 3500;
const LAPTOP_BASE_SHINY = 4000;
const LAPTOP_FULL_STANDARD = 10000;
const LAPTOP_FULL_SHINY = 11500;
const LAPTOP_TEXT_FEES = [0, 700, 1400, 1500];
const LAPTOP_DYI_DISCOUNT = 1500;

const PHONE_BASE = 2000;
const PHONE_FULL_BODY_UPGRADE = 1000;
const PHONE_TEXT_FEE = 500;
const PHONE_SHINY_FEE = 500;
const PHONE_DYI_DISCOUNT = 500;

const CONTROLLER_BASE = 2500;
const CONTROLLER_GAMER_TAG_FEE = 500;
const CONTROLLER_SHINY_FEE = 500;
const CONTROLLER_DYI_DISCOUNT = 500;

const CONTROLLER_TYPE_LABELS: Record<ControllerSubtype, string> = {
  'ps3': 'PS3',
  'ps4': 'PS4',
  'ps5-dualsense': 'PS5 DualSense',
  'xbox-360': 'Xbox 360',
  'xbox-one': 'Xbox One',
  'xbox-series': 'Xbox Series X/S',
  'switch-pro': 'Nintendo Switch Pro',
};

export function getSheetPrice(finish: FinishType, mode: OrderMode = 'individual') {
  if (mode === 'wholesale') {
    return finish === 'standard' ? 1500 : 2000;
  }
  return finish === 'standard' ? 3500 : 4000;
}

export function calculateLaptopPricing(options: {
  selectedSurfaces: LaptopSurface[];
  finishes: Record<LaptopSurface, FinishType>;
  customTexts: Record<LaptopSurface, string>;
  installOption: InstallationOption;
}) {
  const lineItems: Array<{ label: string; price: number }> = [];
  const selectedCount = options.selectedSurfaces.length;
  const allSelected = selectedCount === 3;

  if (selectedCount === 0) {
    return { lineItems, total: 0 };
  }

  const textFields = options.selectedSurfaces.filter((surface) => options.customTexts[surface]?.trim()).length;

  if (allSelected) {
    const anyShiny = options.selectedSurfaces.some((surface) => options.finishes[surface] === 'shiny-stones');
    const packagePrice = anyShiny ? LAPTOP_FULL_SHINY : LAPTOP_FULL_STANDARD;
    lineItems.push({ label: 'Full laptop package', price: packagePrice });
  } else {
    options.selectedSurfaces.forEach((surface) => {
      const finish = options.finishes[surface];
      const surfacePrice = finish === 'shiny-stones' ? LAPTOP_BASE_SHINY : LAPTOP_BASE_STANDARD;
      const surfaceLabel = surface
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
      lineItems.push({ label: `${surfaceLabel} ${finish === 'shiny-stones' ? '(Shiny Stones)' : 'wrap'}`, price: surfacePrice });
    });
  }

  if (textFields > 0) {
    const textFee = LAPTOP_TEXT_FEES[Math.min(textFields, LAPTOP_TEXT_FEES.length - 1)];
    lineItems.push({ label: `Text customization (${textFields} field${textFields > 1 ? 's' : ''})`, price: textFee });
  }

  if (allSelected && options.installOption === 'diy') {
    lineItems.push({ label: 'Self-application', price: -LAPTOP_DYI_DISCOUNT });
  }

  return {
    lineItems,
    total: lineItems.reduce((sum, item) => sum + item.price, 0),
  };
}

export function calculatePhonePricing(options: {
  coverage: PhoneCoverage;
  finish: FinishType;
  customText: string;
  installOption: InstallationOption;
}) {
  const lineItems: Array<{ label: string; price: number }> = [];
  const basePrice = PHONE_BASE + (options.coverage === 'full-body' ? PHONE_FULL_BODY_UPGRADE : 0);
  const coverageLabel = options.coverage === 'full-body' ? 'Phone full body wrap' : 'Phone back panel wrap';
  lineItems.push({ label: coverageLabel, price: basePrice });

  if (options.finish === 'shiny-stones') {
    lineItems.push({ label: 'Shiny Stones finish', price: PHONE_SHINY_FEE });
  }

  if (options.customText.trim()) {
    lineItems.push({ label: 'Custom text', price: PHONE_TEXT_FEE });
  }

  if (options.installOption === 'diy') {
    lineItems.push({ label: 'Self-application', price: -PHONE_DYI_DISCOUNT });
  }

  return {
    lineItems,
    total: lineItems.reduce((sum, item) => sum + item.price, 0),
  };
}

export function calculateControllerPricing(options: {
  subtype: ControllerSubtype;
  finish: FinishType;
  gamerTag: string;
  installOption: InstallationOption;
}) {
  const lineItems: Array<{ label: string; price: number }> = [];
  const controllerLabel = CONTROLLER_TYPE_LABELS[options.subtype] || 'Controller';
  lineItems.push({ label: `${controllerLabel} wrap`, price: CONTROLLER_BASE });

  if (options.finish === 'shiny-stones') {
    lineItems.push({ label: 'Shiny Stones finish', price: CONTROLLER_SHINY_FEE });
  }

  if (options.gamerTag.trim()) {
    lineItems.push({ label: 'GamerTag / custom text', price: CONTROLLER_GAMER_TAG_FEE });
  }

  if (options.installOption === 'diy') {
    lineItems.push({ label: 'Self-application', price: -CONTROLLER_DYI_DISCOUNT });
  }

  return {
    lineItems,
    total: lineItems.reduce((sum, item) => sum + item.price, 0),
  };
}

export type PricingResult =
  | {
      lineItems: Array<{ label: string; price: number }>;
      total: number;
    }
  | {
      lineItems: Array<{ label: string; price: number }>;
      total: number;
      quotePending: true;
    };

export function calculateClientOrderPricing(options: {
  category: Category;
  laptop: {
    selectedSurfaces: LaptopSurface[];
    finishes: Record<LaptopSurface, FinishType>;
    customTexts: Record<LaptopSurface, string>;
    installOption: InstallationOption;
  };
  phone: {
    coverage: PhoneCoverage;
    finish: FinishType;
    customText: string;
    installOption: InstallationOption;
  };
  controller: {
    subtype: ControllerSubtype;
    finish: FinishType;
    gamerTag: string;
    installOption: InstallationOption;
  };
  others: {
    itemName: string;
    instructions: string;
  };
}): PricingResult {
  if (options.category === 'laptop') {
    return calculateLaptopPricing(options.laptop);
  }

  if (options.category === 'phone') {
    return calculatePhonePricing(options.phone);
  }

  if (options.category === 'controller') {
    return calculateControllerPricing(options.controller);
  }

  return {
    lineItems: [{ label: 'Custom quote pending via WhatsApp', price: 0 }],
    total: 0,
    quotePending: true,
  };
}

export function calculateOrderPriceSummary(pricing: PricingResult) {
  if ('quotePending' in pricing && pricing.quotePending) {
    return {
      lineItems: pricing.lineItems,
      total: 0,
      quotePending: true,
    };
  }

  return {
    lineItems: pricing.lineItems,
    total: pricing.total,
    quotePending: false,
  };
}

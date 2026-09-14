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
export type ControllerSubtype = 'ps3' | 'ps4';
export type OrderMode = 'individual' | 'wholesale';

const LAPTOP_CLASSIC_PRICE = 3000;
const LAPTOP_SHINY_STONES_PRICE = 3500;
const LAPTOP_TEXT_FEE_PER_SURFACE = 400;
const LAPTOP_TEXT_FEE_3_SURFACES = 1000;
const LAPTOP_MATCHING_FINISH_DISCOUNT = 500;
const LAPTOP_DIY_DISCOUNT = 500;

const WHOLESALE_CLASSIC_PER_SHEET = 1000;
const WHOLESALE_SHINY_STONES_PER_SHEET = 1500;

const PHONE_BASE = 2000;
const PHONE_CUSTOM_TEXT_FEE = 300;
const PHONE_DIY_DISCOUNT = 500;

const CONTROLLER_BASE = 2500;
const CONTROLLER_GAMER_TAG_FEE = 300;
const CONTROLLER_DIY_DISCOUNT = 500;

export interface SurfaceCustomization {
  selected: boolean;
  quality: 'standard' | 'premium';
}

export interface LaptopPricingOptions {
  surfaces: {
    'top-lid': SurfaceCustomization;
    'keyboard-deck': SurfaceCustomization;
    'bottom-base': SurfaceCustomization;
  };
  customTextSurfaceCount: number;
  installationType: 'diy' | 'pro';
}

export interface PriceBreakdown {
  surfaceItems: { name: string; quality: string; price: number }[];
  surfacesSubtotal: number;
  customTextFee: number;
  qualityAdjustment: number;
  installationAdjustment: number;
  finalTotal: number;
}

export function calculateLaptopPrice(options: LaptopPricingOptions): PriceBreakdown {
  const surfaceNames: Record<string, string> = {
    'top-lid': 'Top Lid',
    'keyboard-deck': 'Keyboard Deck',
    'bottom-base': 'Bottom Base',
  };

  const selectedKeys = Object.keys(options.surfaces).filter(
    (key) => options.surfaces[key as keyof typeof options.surfaces].selected
  ) as Array<'top-lid' | 'keyboard-deck' | 'bottom-base'>;

  const surfaceItems = selectedKeys.map((key) => {
    const surface = options.surfaces[key];
    const price = surface.quality === 'standard' ? LAPTOP_CLASSIC_PRICE : LAPTOP_SHINY_STONES_PRICE;

    return {
      name: surfaceNames[key] || key,
      quality: surface.quality === 'standard' ? 'Classic Finish' : 'Shiny Stones Finish',
      price,
    };
  });

  const surfacesSubtotal = surfaceItems.reduce((sum, item) => sum + item.price, 0);

  let customTextFee = 0;
  if (options.customTextSurfaceCount > 0) {
    customTextFee = options.customTextSurfaceCount === 3
      ? LAPTOP_TEXT_FEE_3_SURFACES
      : options.customTextSurfaceCount * LAPTOP_TEXT_FEE_PER_SURFACE;
  }

  const allThreeSelected = selectedKeys.length === 3;
  const matchingQuality = allThreeSelected && selectedKeys.every(
    (key) => options.surfaces[key].quality === options.surfaces[selectedKeys[0]].quality
  );

  let qualityAdjustment = 0;
  if (matchingQuality) {
    qualityAdjustment = -LAPTOP_MATCHING_FINISH_DISCOUNT;
  }

  let installationAdjustment = 0;
  if (options.installationType === 'diy') {
    installationAdjustment = -LAPTOP_DIY_DISCOUNT;
  }

  const finalTotal = Math.max(0, surfacesSubtotal + customTextFee + qualityAdjustment + installationAdjustment);

  return {
    surfaceItems,
    surfacesSubtotal,
    customTextFee,
    qualityAdjustment,
    installationAdjustment,
    finalTotal,
  };
}

const CONTROLLER_TYPE_LABELS: Record<ControllerSubtype, string> = {
  ps3: 'PS3',
  ps4: 'PS4',
};

export function getSheetPrice(finish: FinishType, mode: OrderMode = 'individual') {
  if (mode === 'wholesale') {
    return finish === 'standard' ? WHOLESALE_CLASSIC_PER_SHEET : WHOLESALE_SHINY_STONES_PER_SHEET;
  }

  return finish === 'standard' ? LAPTOP_CLASSIC_PRICE : LAPTOP_SHINY_STONES_PRICE;
}

export function calculatePhonePricing(options: {
  customText: string;
  installOption: InstallationOption;
}) {
  const lineItems: Array<{ label: string; price: number }> = [];

  lineItems.push({ label: 'Phone Skin', price: PHONE_BASE });

  if (options.customText.trim()) {
    lineItems.push({ label: 'Custom text', price: PHONE_CUSTOM_TEXT_FEE });
  }

  if (options.installOption === 'diy') {
    lineItems.push({ label: 'Self-application', price: -PHONE_DIY_DISCOUNT });
  }

  return {
    lineItems,
    total: lineItems.reduce((sum, item) => sum + item.price, 0),
  };
}

export function calculateControllerPricing(options: {
  subtype: ControllerSubtype;
  gamerTag: string;
  installOption: InstallationOption;
}) {
  const lineItems: Array<{ label: string; price: number }> = [];
  const controllerLabel = CONTROLLER_TYPE_LABELS[options.subtype] || 'Controller';

  lineItems.push({ label: `${controllerLabel} Skin`, price: CONTROLLER_BASE });

  if (options.gamerTag.trim()) {
    lineItems.push({ label: 'Custom GamerTag / text', price: CONTROLLER_GAMER_TAG_FEE });
  }

  if (options.installOption === 'diy') {
    lineItems.push({ label: 'Self-application', price: -CONTROLLER_DIY_DISCOUNT });
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
    customText: string;
    installOption: InstallationOption;
  };
  controller: {
    subtype: ControllerSubtype;
    gamerTag: string;
    installOption: InstallationOption;
  };
  others: {
    itemName: string;
    instructions: string;
  };
}): PricingResult {
  if (options.category === 'laptop') {
    const selectedSurfaces = options.laptop.selectedSurfaces;
    const customTextSurfaceCount = selectedSurfaces.filter(
      (surface) => options.laptop.customTexts[surface]?.trim().length > 0
    ).length;

    const laptopOptions: LaptopPricingOptions = {
      surfaces: {
        'top-lid': {
          selected: selectedSurfaces.includes('top-lid'),
          quality: options.laptop.finishes['top-lid'] === 'shiny-stones' ? 'premium' : 'standard',
        },
        'keyboard-deck': {
          selected: selectedSurfaces.includes('keyboard-deck'),
          quality: options.laptop.finishes['keyboard-deck'] === 'shiny-stones' ? 'premium' : 'standard',
        },
        'bottom-base': {
          selected: selectedSurfaces.includes('bottom-base'),
          quality: options.laptop.finishes['bottom-base'] === 'shiny-stones' ? 'premium' : 'standard',
        },
      },
      customTextSurfaceCount,
      installationType: options.laptop.installOption === 'diy' ? 'diy' : 'pro',
    };

    const breakdown = calculateLaptopPrice(laptopOptions);
    const lineItems: Array<{ label: string; price: number }> = [];

    breakdown.surfaceItems.forEach((item) => {
      lineItems.push({
        label: `${item.name} - ${item.quality}`,
        price: item.price,
      });
    });

    if (breakdown.customTextFee > 0) {
      lineItems.push({
        label: 'Custom text overlay',
        price: breakdown.customTextFee,
      });
    }

    if (breakdown.qualityAdjustment !== 0) {
      lineItems.push({
        label: 'Matching finish discount',
        price: breakdown.qualityAdjustment,
      });
    }

    if (breakdown.installationAdjustment !== 0) {
      lineItems.push({
        label: breakdown.installationAdjustment < 0 ? 'Self-application discount' : 'Professional fitting',
        price: breakdown.installationAdjustment,
      });
    }

    return {
      lineItems,
      total: breakdown.finalTotal,
    };
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

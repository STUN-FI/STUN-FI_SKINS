export const getApiBaseUrl = () => {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL;

  if (configuredUrl) {
    return configuredUrl;
  }

  if (process.env.NODE_ENV === 'production') {
    console.warn('NEXT_PUBLIC_API_URL is not configured for production. Set the deployed backend URL in Vercel environment variables.');
  }

  return 'http://localhost:5000/api/orders';
};

const API_URL = getApiBaseUrl();

// Type definitions
export type Status = 'pending' | 'confirmed' | 'in_production' | 'completed';

export type WholesaleDetails = {
  standardQty?: number;
  shinyStonesQty?: number;
  totalPaidUnits?: number;
  totalReceivedUnits?: number;
  freeBonusUnits?: number;
  technicianRequested?: boolean;
};

export type RetailDetails = {
  device?: string;
  coverage?: string[];
  finish?: string;
  customText?: string;
  surfaceDesigns?: Array<Record<string, any>> | Record<string, any> | any;
};

export type CustomerInfo = {
  storeName?: string;
  contactName?: string;
  whatsappNumber?: string;
  storeAddress?: string;
};

export type SurfaceItem = {
  name?: string;
  imageUrl?: string;
  monogramText?: string;
};

export type LineItem = {
  label: string;
  price: number;
};

export type Order = {
  _id?: string;
  orderId: string;
  mode: 'individual' | 'wholesale';
  createdAt?: string;
  clientName?: string;
  whatsappNumber?: string;
  deviceModel?: string;
  category?: string;
  surfaces?: SurfaceItem[];
  items?: LineItem[];
  totalAmount?: number;
  customerInfo: CustomerInfo;
  retailDetails?: RetailDetails;
  wholesaleDetails?: WholesaleDetails;
  pricing: { totalAmount: number; currency?: string };
  status: Status;
};

type SubmitOrderResult = {
  success: boolean;
  orderId: string;
  order: any;
  error?: string;
};

export async function submitOrder(formData: FormData | object): Promise<SubmitOrderResult> {
  const headers: HeadersInit = {};
  let body: BodyInit;

  if (formData instanceof FormData) {
    body = formData;
  } else {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(formData);
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      body,
      headers,
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        orderId: data?.orderId || 'PENDING',
        order: data?.order || null,
        error: data?.error || 'Order submission failed',
      };
    }

    return {
      success: true,
      orderId: data.orderId || 'PENDING',
      order: data.order,
    };
  } catch (error) {
    console.error('submitOrder error', error);
    return {
      success: false,
      orderId: 'PENDING',
      order: null,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

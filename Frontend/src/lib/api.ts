const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/orders';

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

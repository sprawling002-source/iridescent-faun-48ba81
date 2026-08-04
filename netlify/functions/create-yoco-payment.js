/**
 * Sugar & Sage - Yoco Checkout Function
 * This is the server-side piece that talks to Yoco securely
 * Deploy this to Netlify in: netlify/functions/create-yoco-payment.js
 */

export async function handler(event, context) {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const YOCO_SECRET_KEY = process.env.YOCO_SECRET_KEY;

  if (!YOCO_SECRET_KEY) {
    console.error('YOCO_SECRET_KEY not set');
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Yoco not configured. Add YOCO_SECRET_KEY in Netlify Environment Variables.',
        redirectUrl: null 
      })
    };
  }

  try {
    const { amount, items } = JSON.parse(event.body);

    if (!amount || amount < 2) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid amount' }) };
    }

    // Yoco expects amount in CENTS: R50 = 5000
    const amountInCents = Math.round(amount * 100);

    // Build success/cancel URLs from the request origin
    const origin = event.headers.origin || event.headers.referer || process.env.URL || 'https://sugar-and-sage.netlify.app';
    const baseUrl = origin.replace(/\/$/, '');

    const yocoPayload = {
      amount: amountInCents,
      currency: 'ZAR',
      // Where to send customer after payment
      successUrl: `${baseUrl}/?payment=success`,
      cancelUrl: `${baseUrl}/?payment=cancelled`,
      failureUrl: `${baseUrl}/?payment=failed`,
      metadata: {
        items: JSON.stringify(items?.slice(0,5) || []), // First 5 items for reference
        store: 'Sugar & Sage'
      }
    };

    console.log('Creating Yoco checkout for:', amountInCents, 'cents');

    const response = await fetch('https://payments.yoco.com/api/checkouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${YOCO_SECRET_KEY}`
      },
      body: JSON.stringify(yocoPayload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Yoco error:', data);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data.message || 'Yoco checkout failed', details: data })
      };
    }

    // data contains: id, redirectUrl, status
    console.log('Yoco checkout created:', data.id);

    return {
      statusCode: 200,
      body: JSON.stringify({
        redirectUrl: data.redirectUrl,
        id: data.id,
        status: data.status
      })
    };

  } catch (err) {
    console.error('Function error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}

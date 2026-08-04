/**
 * Yoco Webhook Handler
 * Netlify Function: netlify/functions/yoco-webhook.js
 * Add this URL in Yoco Dashboard > Settings > Webhooks:
 * https://YOUR-SITE.netlify.app/.netlify/functions/yoco-webhook
 */

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 200, body: 'Webhook endpoint - use POST' };
  }

  try {
    const payload = JSON.parse(event.body);
    
    // Yoco sends events like: checkout.completed, payment.succeeded
    console.log('Yoco webhook received:', payload.type || payload.event, payload);

    // Example: handle successful payment
    if (payload.type === 'payment.succeeded' || payload.status === 'successful') {
      // TODO: Here you would:
      // 1. Save order to database / Google Sheet
      // 2. Send confirmation email
      // 3. Reduce stock
      // 4. Notify via WhatsApp / Slack
      
      console.log('Payment SUCCESS - fulfill order for checkout:', payload.id);
    }

    // Always return 200 to Yoco, otherwise it will retry
    return {
      statusCode: 200,
      body: JSON.stringify({ received: true })
    };

  } catch (err) {
    console.error('Webhook error:', err);
    return { statusCode: 400, body: JSON.stringify({ error: err.message }) };
  }
}

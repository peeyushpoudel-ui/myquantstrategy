const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const https = require('https');

function sendEmail(templateParams) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      service_id: 'service_3r6dyxy',
      template_id: 'template_8tcy4ov',
      user_id: '6jn5GzkeScXTUhhOP',
      template_params: templateParams
    });

    const options = {
      hostname: 'api.emailjs.com',
      port: 443,
      path: '/api/v1.6/email/send',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (resp) => {
      let body = '';
      resp.on('data', (chunk) => { body += chunk; });
      resp.on('end', () => {
        console.log('EmailJS response:', resp.statusCode, body);
        resolve(body);
      });
    });

    req.on('error', (err) => {
      console.error('EmailJS request error:', err.message);
      reject(err);
    });

    req.write(data);
    req.end();
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const event = req.body;
    console.log('Webhook received:', event.type);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      const customerEmail = session.customer_email || '';
      const firebaseUID = session.metadata?.firebaseUID || '';

      console.log('Processing checkout for:', customerEmail, 'UID:', firebaseUID);

      await sendEmail({
        subscriber_name: session.customer_details?.name || 'Unknown',
        subscriber_email: customerEmail,
        tv_username: 'Check Firebase - UID: ' + firebaseUID,
        strategy_name: 'MNQ Opening Range'
      });

      console.log('Subscriber email sent for:', customerEmail);
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const customer = await stripe.customers.retrieve(subscription.customer);

      console.log('Processing cancellation for:', customer.email);

      await sendEmail({
        subscriber_name: customer.name || 'Unknown',
        subscriber_email: customer.email || '',
        tv_username: 'CANCELLED — remove TradingView access',
        strategy_name: 'MNQ Opening Range'
      });

      console.log('Cancellation email sent for:', customer.email);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(200).json({ received: true });
  }
};

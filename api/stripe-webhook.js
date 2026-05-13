const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const event = req.body;

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      const customerEmail = session.customer_email || '';
      const firebaseUID = session.metadata?.firebaseUID || '';

      const emailData = {
        service_id: 'service_3r6dyxy',
        template_id: 'template_8tcy4ov',
        user_id: '6jn5GzkeScXTUhhOP',
        template_params: {
          subscriber_name: session.customer_details?.name || 'Unknown',
          subscriber_email: customerEmail,
          tv_username: 'Check Firebase - UID: ' + firebaseUID,
          strategy_name: 'MNQ Opening Range'
        }
      };

      await fetch('https://api.emailjs.com/api/v1.6/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData)
      });

      console.log('Subscriber email sent for:', customerEmail);
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const customer = await stripe.customers.retrieve(subscription.customer);
      
      const emailData = {
        service_id: 'service_3r6dyxy',
        template_id: 'template_8tcy4ov',
        user_id: '6jn5GzkeScXTUhhOP',
        template_params: {
          subscriber_name: customer.name || 'Unknown',
          subscriber_email: customer.email || '',
          tv_username: 'CANCELLED — remove TradingView access',
          strategy_name: 'MNQ Opening Range'
        }
      };

      await fetch('https://api.emailjs.com/api/v1.6/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData)
      });

      console.log('Cancellation email sent for:', customer.email);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(200).json({ received: true });
  }
};

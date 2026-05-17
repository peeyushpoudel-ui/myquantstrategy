const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const emailjs = require('@emailjs/nodejs');

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
      const tvUsername = session.metadata?.tradingviewUsername || 'Not provided — check Firebase';

      console.log('Processing checkout for:', customerEmail, 'TV:', tvUsername);

      try {
        const response = await emailjs.send(
          'service_3r6dyxy',
          'template_8tcy4ov',
          {
            subscriber_name: session.customer_details?.name || 'Unknown',
            subscriber_email: customerEmail,
            tv_username: tvUsername,
            strategy_name: 'MNQ Opening Range'
          },
          {
            publicKey: '6jn5GzkeScXTUhhOP',
            privateKey: 'h72164tvNGLVvb6XlBFfZ',
          }
        );
        console.log('EmailJS success:', response.status, response.text);
      } catch (emailErr) {
        console.error('EmailJS error:', emailErr.status, emailErr.text || emailErr.message);
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const customer = await stripe.customers.retrieve(subscription.customer);

      console.log('Processing cancellation for:', customer.email);

      try {
        const response = await emailjs.send(
          'service_3r6dyxy',
          'template_8tcy4ov',
          {
            subscriber_name: customer.name || 'Unknown',
            subscriber_email: customer.email || '',
            tv_username: 'CANCELLED — remove TradingView access',
            strategy_name: 'MNQ Opening Range'
          },
          {
            publicKey: '6jn5GzkeScXTUhhOP',
            privateKey: 'h72164tvNGLVvb6XlBFfZ',
          }
        );
        console.log('EmailJS success:', response.status, response.text);
      } catch (emailErr) {
        console.error('EmailJS error:', emailErr.status, emailErr.text || emailErr.message);
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(200).json({ received: true });
  }
};

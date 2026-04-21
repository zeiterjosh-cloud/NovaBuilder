import express from 'express';
import Stripe from 'stripe';
import { authMiddleware } from '../middleware/auth.js';
import { findById, updateOne, findByField } from '../utils/db.js';

const router = express.Router();

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
}

const PLANS = {
  pro: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro',
    generationsLimit: -1
  },
  studio: {
    name: 'Studio',
    priceId: process.env.STRIPE_STUDIO_PRICE_ID || 'price_studio',
    generationsLimit: -1
  }
};

router.post('/create-checkout', authMiddleware, async (req, res) => {
  try {
    const { plan } = req.body;
    if (!PLANS[plan]) return res.status(400).json({ error: 'Invalid plan' });

    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'your_stripe_secret_key_here') {
      return res.status(503).json({
        error: 'Stripe not configured. Add STRIPE_SECRET_KEY to backend .env file.',
        mock: true
      });
    }

    const stripe = getStripe();
    const user = await findById('users', req.user.id);

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id }
      });
      customerId = customer.id;
      await updateOne('users', user.id, { stripeCustomerId: customerId });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{
        price: PLANS[plan].priceId,
        quantity: 1
      }],
      success_url: `${process.env.FRONTEND_URL}/dashboard?upgraded=true`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
      metadata: { userId: user.id, plan }
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

router.post('/webhook', async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'your_stripe_secret_key_here') {
      return res.json({ received: true });
    }

    const stripe = getStripe();
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;
        if (userId && plan) {
          await updateOne('users', userId, {
            plan,
            stripeSubscriptionId: session.subscription,
            generationsLimit: -1,
            updatedAt: new Date().toISOString()
          });
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const user = await findByField('users', 'stripeSubscriptionId', subscription.id);
        if (user) {
          await updateOne('users', user.id, {
            plan: 'free',
            stripeSubscriptionId: null,
            generationsLimit: 10
          });
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

router.get('/plans', (req, res) => {
  res.json({
    free: {
      name: 'Free',
      price: 0,
      features: ['10 AI generations', 'Monaco editor', 'Live preview', 'Project saving'],
      limitations: ['No Unity export', 'No deployment', 'Limited generations']
    },
    pro: {
      name: 'Pro',
      price: 29,
      features: ['Unlimited AI generations', 'Unity export (.cs + ZIP)', 'Deployment system', 'DevBuddy AI chat', 'All templates'],
      limitations: []
    },
    studio: {
      name: 'Studio',
      price: 79,
      features: ['Everything in Pro', 'Team collaboration', 'Advanced AI models', 'Custom deployment domains', 'Priority support'],
      limitations: []
    }
  });
});

export default router;

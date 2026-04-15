const Stripe = require('stripe');

/**
 * Initialize Stripe with the secret key from environment variables.
 * Used for processing course payments.
 */
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = stripe;

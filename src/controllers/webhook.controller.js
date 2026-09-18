const stripe = require("../config/stripe");
const Checkout = require("../models/Checkout");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const logger = require("../utils/logger");

const handleStripeWebhook = async (req, res, next) => {
  const signature = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body, // must be the raw, unparsed body — see route wiring
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    logger.warn({ err }, "Stripe webhook signature verification failed");
    return res.status(400).send(`Webhook signature verification failed`);
  }

  // Only act on the events we actually care about — ignore the rest
  // (payment_intent.created, charge.succeeded, charge.updated, etc.)
  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;
      await handlePaymentSucceeded(paymentIntent.id);
      break;
    }
    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;
      await handlePaymentFailed(paymentIntent.id);
      break;
    }
    default:
      // Acknowledge receipt even for events we don't act on — Stripe
      // retries delivery if it doesn't get a 200, so ignoring an event
      // type still needs a success response.
      break;
  }

  res.status(200).json({ received: true });
};

async function handlePaymentSucceeded(paymentIntentId) {
  const checkout = await Checkout.findOne({
    stripePaymentIntentId: paymentIntentId,
  });

  if (!checkout) {
    logger.warn(
      { paymentIntentId },
      "No matching Checkout found for succeeded payment",
    );
    return;
  }

  // Idempotency guard — if this webhook is somehow delivered twice,
  // don't decrement stock or process the order a second time.
  if (checkout.paymentStatus === "paid") {
    return;
  }

  checkout.paymentStatus = "paid";
  await checkout.save();

  const orders = await Order.find({ checkout: checkout._id });

  for (const order of orders) {
    order.status = "confirmed";
    await order.save();

    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }
  }

  await Cart.deleteOne({ user: checkout.buyer });
}

async function handlePaymentFailed(paymentIntentId) {
  const checkout = await Checkout.findOne({
    stripePaymentIntentId: paymentIntentId,
  });

  if (!checkout) {
    logger.warn(
      { paymentIntentId },
      "No matching Checkout found for failed payment",
    );
    return;
  }

  if (checkout.paymentStatus === "failed") {
    return; // already processed
  }

  checkout.paymentStatus = "failed";
  await checkout.save();

  await Order.updateMany({ checkout: checkout._id }, { status: "cancelled" });
}

module.exports = { handleStripeWebhook };

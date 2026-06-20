/**
 * ElitePrep Real-time Admin Dashboard - Firebase Cloud Functions
 * Tech Stack: Node.js, Firebase Admin SDK, Razorpay Webhook Signatures
 * 
 * To deploy this folder:
 * $ cd functions
 * $ npm install
 * $ firebase deploy --only functions
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto");

admin.initializeApp();
const db = admin.firestore();

/**
 * 1. Razorpay Webhook HTTP Endpoint
 * Path: https://<your-region>-<your-project-id>.cloudfunctions.net/razorpayWebhook
 *
 * This function securely listens for payments captured from Razorpay, verifies 
 * the signature using your Razorpay Webhook Secret, and writes the verified transaction 
 * to the `payments` collection.
 */
exports.razorpayWebhook = functions.https.onRequest(async (req, res) => {
  try {
    const RAZORPAY_SECRET = functions.config().razorpay?.secret || process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (!RAZORPAY_SECRET) {
      console.error("Razorpay webhook configuration secret is missing inside Firebase Config.");
      return res.status(500).send("Configuration Error");
    }

    const signature = req.headers["x-razorpay-signature"];
    const rawBody = req.rawBody?.toString() || JSON.stringify(req.body);

    // Crypto Verification of Hook Origin
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_SECRET)
      .update(rawBody)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.warn("Invalid webhook signature received. Potential forgery blocked.");
      return res.status(400).send("Signature Verification Failed");
    }

    const event = req.body;
    
    // We only process 'payment.captured' status payloads
    if (event.event === "payment.captured") {
      const paymentPayload = event.payload.payment.entity;
      
      const paymentId = paymentPayload.id;
      const orderId = paymentPayload.order_id || "direct_pay_" + Date.now();
      const amountInRupees = paymentPayload.amount / 100; // Convert Paisa to Rupees
      const email = paymentPayload.email;
      const notes = paymentPayload.notes || {};
      
      const userId = notes.userId || "anonymous_user";
      const userName = notes.userName || email || "Aspirant Rahul";
      const plan = notes.plan || "Mock Subscription tier unlock";

      const paymentDoc = {
        paymentId,
        userId,
        userName,
        amount: amountInRupees,
        status: "captured",
        orderId,
        plan,
        timestamp: new Date().toISOString()
      };

      // Store securely in payments Firestore collection
      await db.collection("payments").doc(paymentId).set(paymentDoc);
      console.log(`Payment transaction ${paymentId} written successfully.`);

      // Create a live activity log to pop up real-time in Admin feed
      const logId = "log_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
      await db.collection("activityLogs").doc(logId).set({
        logId,
        userName,
        type: "premium_activated",
        detail: `Verified Payment received for: ${plan} (₹${amountInRupees})`,
        value: amountInRupees,
        timestamp: new Date().toISOString()
      });
    }

    return res.status(200).json({ status: "success" });
  } catch (error) {
    console.error("Razorpay webhook processor crashed:", error);
    return res.status(500).send("Internal Server Error");
  }
});

/**
 * 2. Real-time Aggregator - Triggers on onCreate of payments
 * Automates sales volume computations into the dashboard/stats document.
 */
exports.aggregateSalesStatistics = functions.firestore
  .document("payments/{paymentId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    if (data.status !== "captured") return;

    const statsRef = db.collection("dashboard").doc("stats");

    return db.runTransaction(async (transaction) => {
      const statsDoc = await transaction.get(statsRef);
      
      const STATIC_BASE_SALES = 375000;
      let currentSales = STATIC_BASE_SALES + Number(data.amount);

      if (statsDoc.exists) {
        const statsData = statsDoc.data();
        currentSales = (statsData.totalSales || STATIC_BASE_SALES) + Number(data.amount);
      }

      transaction.set(statsRef, {
        totalSales: currentSales,
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      console.log(`Aggregated total sales incremented by ₹${data.amount} to ₹${currentSales}`);
    });
  });

/**
 * 3. Real-time Aggregator - Triggers on onCreate of profiles (users collection)
 * Tracks registration logs into the dashboard/stats document.
 */
exports.aggregateUsersStatistics = functions.firestore
  .document("users/{userId}")
  .onCreate(async (snap, context) => {
    const statsRef = db.collection("dashboard").doc("stats");

    return db.runTransaction(async (transaction) => {
      const statsDoc = await transaction.get(statsRef);
      
      const STATIC_BASE_USERS = 1248840;
      let currentUsers = STATIC_BASE_USERS + 1;

      if (statsDoc.exists) {
        const statsData = statsDoc.data();
        currentUsers = (statsData.totalUsers || STATIC_BASE_USERS) + 1;
      }

      transaction.set(statsRef, {
        totalUsers: currentUsers,
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      console.log(`Aggregated total registration count incremented to ${currentUsers}`);
    });
  });

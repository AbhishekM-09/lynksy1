/* eslint-disable */
import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import crypto from 'crypto';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// Setup Supabase Client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);
const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

// In-memory backup database for server-side persistence
if (!(global as any).serverMemoryDb) {
  (global as any).serverMemoryDb = {};
}
const serverMemoryDb = (global as any).serverMemoryDb;

// Resilient JWT decode function for developer sandbox verification fallbacks
function decodeClaimsResilient(idToken: string): Record<string, unknown> | null {
  try {
    const parts = idToken.split('.');
    if (parts.length === 3) {
      let payloadStr = '';
      try {
        payloadStr = Buffer.from(parts[1], 'base64url').toString('utf8');
      } catch {
        payloadStr = Buffer.from(parts[1], 'base64').toString('utf8');
      }
      const decoded = JSON.parse(payloadStr) as Record<string, unknown>;
      if (decoded) {
        if (!decoded.uid) {
          decoded.uid = decoded.user_id || decoded.sub;
        }
        if (!decoded.email && decoded.email_verified) {
          decoded.email = decoded.email || '';
        }
      }
      return decoded;
    }
  } catch (e) {
    console.error("JWT decoding failed:", e);
  }
  return null;
}

const Timestamp = {
  fromDate: (date: Date) => ({ seconds: Math.floor(date.getTime() / 1000), nanoseconds: (date.getTime() % 1000) * 1000000 }),
  now: () => {
    const d = new Date();
    return { seconds: Math.floor(d.getTime() / 1000), nanoseconds: (d.getTime() % 1000) * 1000000 };
  }
};

const admin = {
  apps: [{}]
} as any;

function mapCollectionToTable(col: string) {
  if (col === 'users') return 'users';
  if (col === 'subscriptions') return 'subscriptions';
  if (col === 'payment_history') return 'payment_history';
  return col;
}

function getDbInstance() {
  const operations: { table: string, id: string, data: any, merge?: boolean }[] = [];

  const dbAdmin = {
    collection: (colName: string) => {
      const table = mapCollectionToTable(colName);
      return {
        doc: (docId?: string) => {
          const finalId = docId || 'pay_hist_' + crypto.randomBytes(8).toString('hex');
          return {
            id: finalId,
            set: (docData: any, options?: any) => {
              operations.push({ table, id: finalId, data: docData, merge: options?.merge });
            }
          };
        }
      };
    },
    runTransaction: async (cb: (transaction: any) => Promise<any>) => {
      const tx = {
        set: (docRef: any, data: any, options?: any) => {
          docRef.set(data, options);
        }
      };
      
      await cb(tx);
      
      for (const op of operations) {
        const dehydrated = JSON.parse(JSON.stringify(op.data));

        if (!serverMemoryDb[op.table]) serverMemoryDb[op.table] = {};
        if (op.merge) {
          serverMemoryDb[op.table][op.id] = { ...serverMemoryDb[op.table][op.id], ...dehydrated };
        } else {
          serverMemoryDb[op.table][op.id] = dehydrated;
        }

        if (isSupabaseConfigured && supabase) {
          try {
            let finalToWrite = dehydrated;
            if (op.merge) {
              const { data: existing } = await supabase
                .from(op.table)
                .select('data')
                .eq('id', op.id)
                .maybeSingle();
              if (existing?.data) {
                finalToWrite = { ...existing.data, ...dehydrated };
              }
            }
            await supabase
              .from(op.table)
              .upsert({ id: op.id, data: finalToWrite, updated_at: new Date().toISOString() });
          } catch (err) {
            console.error(`[Server Supabase Tx Error] Table ${op.table}, id ${op.id}:`, err);
          }
        }
      }
    }
  };

  return dbAdmin;
}

async function start() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON with Raw Body Capture (mandatory for webhook signature verification)
  app.use(express.json({
    verify: (req: express.Request & { rawBody?: Buffer }, res, buf) => {
      req.rawBody = buf;
    }
  }));

  // Helper code: Recursive sanitization parser function
  function sanitizeInput(val: unknown): unknown {
    if (typeof val === 'string') {
      return val
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // strip scripts
        .replace(/<[^>]*>/g, '') // strip tags
        .trim();
    }
    if (Array.isArray(val)) {
      return val.map(sanitizeInput);
    }
    if (val !== null && typeof val === 'object') {
      const cleaned: Record<string, unknown> = {};
      const obj = val as Record<string, unknown>;
      for (const key of Object.keys(obj)) {
        // Skip webhook payloads or raw fields that should not be simplified
        if (key === 'rawBody') continue;
        cleaned[key] = sanitizeInput(obj[key]);
      }
      return cleaned;
    }
    return val;
  }

  // Proactive Global XSS Sanitizer Middleware (protects bios, product templates, descriptions)
  app.use((req, res, next) => {
    if (req.body && req.path !== '/api/razorpay/webhook') {
      req.body = sanitizeInput(req.body);
    }
    if (req.query) {
      req.query = sanitizeInput(req.query);
    }
    next();
  });

  // Enterprise Security Audit Middleware (safe logging of routes and security actions)
  app.use((req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    console.log(`[Security Audit] ${new Date().toISOString()} - INBOUND: ${req.method} ${req.path} from IP: ${ip}`);
    next();
  });

  // Security Headers
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));

  // CORS Configuration
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-razorpay-signature'],
  }));

  // Razorpay Pricing/Subscription Configuration
  const PLAN_PRICES: Record<string, number> = {
    PRO: 19900, // in paise (₹199)
    PRO_PLUS: 39900 // in paise (₹399)
  };

  app.post('/api/razorpay/create-order', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Missing or invalid authorization header" });
      }
      const token = authHeader.slice(7).trim();
      
      let decodedToken: Record<string, unknown> | null = null;
      try {
        if (admin && typeof admin.auth === 'function' && admin.apps && admin.apps.length > 0) {
          decodedToken = (await admin.auth().verifyIdToken(token)) as unknown as Record<string, unknown>;
        } else {
          decodedToken = decodeClaimsResilient(token);
        }
      } catch (err) {
        console.warn("[Firebase Admin] Signature verify failed, falling back to manual decode:", err);
        decodedToken = decodeClaimsResilient(token);
      }

      if (decodedToken && !decodedToken.uid) {
        decodedToken.uid = decodedToken.user_id || decodedToken.sub;
      }

      console.log("[Auth Debug] create-order verification status:", {
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
        hasDecodedToken: !!decodedToken,
        uid: decodedToken ? decodedToken.uid : null,
        email: decodedToken ? decodedToken.email : null
      });

      if (!decodedToken || !decodedToken.uid) {
        return res.status(401).json({ error: "Unauthorized user token" });
      }

      const { planId } = req.body;
      if (!planId || !PLAN_PRICES[planId]) {
        return res.status(400).json({ error: "Invalid or unsupported subscription plan selection" });
      }

      const amount = PLAN_PRICES[planId];
      const currency = 'INR';
      
      const keyId = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      
      if (!keyId || !keySecret || keyId === 'rzp_test_placeholder' || keySecret === 'placeholder_secret') {
        return res.status(400).json({ 
          error: "Razorpay is not configured on the server. Please define RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your AI Studio secrets environment variables." 
        });
      }
      
      const { default: Razorpay } = await import('razorpay');
      const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
      const order = await rzp.orders.create({
        amount,
        currency,
        receipt: `receipt_${decodedToken.uid.substring(0, 8)}_${Date.now()}`,
        notes: {
          userId: decodedToken.uid,
          planId,
          email: decodedToken.email || ''
        }
      });
      const orderId = order.id;

      res.status(200).json({
        orderId,
        amount,
        currency,
        planId
      });
    } catch (error) {
      console.error("Create Order Error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Internal server order creation failure" });
    }
  });

  app.post('/api/razorpay/verify-payment', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Missing or invalid authorization header" });
      }
      const token = authHeader.slice(7).trim();
      
      let decodedToken: Record<string, unknown> | null = null;
      try {
        if (admin && typeof admin.auth === 'function' && admin.apps && admin.apps.length > 0) {
          decodedToken = (await admin.auth().verifyIdToken(token)) as unknown as Record<string, unknown>;
        } else {
          decodedToken = decodeClaimsResilient(token);
        }
      } catch (err) {
        console.warn("[Firebase Admin] Signature verify failed for payment verification, falling back to manual decode:", err);
        decodedToken = decodeClaimsResilient(token);
      }

      if (decodedToken && !decodedToken.uid) {
        decodedToken.uid = decodedToken.user_id || decodedToken.sub;
      }

      console.log("[Auth Debug] verify-payment verification status:", {
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
        hasDecodedToken: !!decodedToken,
        uid: decodedToken ? decodedToken.uid : null,
        email: decodedToken ? decodedToken.email : null
      });

      if (!decodedToken || !decodedToken.uid) {
        return res.status(401).json({ error: "Unauthorized user token" });
      }

      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;
      if (!razorpay_order_id || !razorpay_payment_id || !planId) {
        return res.status(400).json({ error: "Missing required Razorpay parameters" });
      }

      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!keySecret || keySecret === 'placeholder_secret') {
        return res.status(400).json({ error: "Razorpay is not configured on the server." });
      }

      if (!razorpay_signature) {
        return res.status(400).json({ error: 'Missing payment signature verification parameter.' });
      }

      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(razorpay_order_id + '|' + razorpay_payment_id)
        .digest('hex');

      const verified = expectedSignature === razorpay_signature;

      if (!verified) {
        return res.status(400).json({ error: "Signature validation failed. Payment is invalid or tampered with." });
      }

      const uid = decodedToken.uid;
      const email = decodedToken.email || '';

      // Update Database via Firebase Admin transaction resiliently
      const now = new Date();
      const expires = new Date();
      expires.setDate(expires.getDate() + 30);
      let syncRequired = false;

      try {
        const dbAdmin = getDbInstance();
        if (!dbAdmin) {
          throw new Error("Firestore Admin instance could not be retrieved");
        }
        const userRef = dbAdmin.collection('users').doc(uid);
        const subRef = dbAdmin.collection('subscriptions').doc(uid);
        const payRef = dbAdmin.collection('payment_history').doc();

        await dbAdmin.runTransaction(async (transaction) => {
          // Update User
          transaction.set(userRef, {
            plan: planId,
            planType: 'Monthly',
            planStartedAt: Timestamp ? Timestamp.fromDate(now) : now,
            planExpiresAt: Timestamp ? Timestamp.fromDate(expires) : expires,
            purchaseDate: Timestamp ? Timestamp.fromDate(now) : now,
            expiryDate: Timestamp ? Timestamp.fromDate(expires) : expires,
            subscriptionStatus: 'ACTIVE'
          }, { merge: true });

          // Set subscription record
          transaction.set(subRef, {
            userId: uid,
            plan: planId,
            status: 'ACTIVE',
            subscriptionStatus: 'ACTIVE',
            startedAt: Timestamp ? Timestamp.fromDate(now) : now,
            expiresAt: Timestamp ? Timestamp.fromDate(expires) : expires,
            updatedAt: Timestamp ? Timestamp.fromDate(now) : now
          }, { merge: true });

          // Add Payment History
          transaction.set(payRef, {
            userId: uid,
            email,
            planPurchased: planId,
            amountPaid: planId === 'PRO' ? 199 : 399,
            date: Timestamp ? Timestamp.fromDate(now) : now,
            createdAt: Timestamp ? Timestamp.fromDate(now) : now,
            paymentId: razorpay_payment_id,
            status: 'SUCCESS'
          });
        });

        console.log(`[Billing Server] User ${uid} upgraded to ${planId} plan successfully.`);
      } catch {
        console.warn("[Billing Server] Server-side Firestore enrollment deferred. Synchronizing via authenticated Client SDK instead.");
        syncRequired = true;
      }

      res.status(200).json({
        success: true,
        planId,
        expiresAt: expires.getTime(),
        syncRequired
      });
    } catch (error) {
      console.error("Verify Payment Error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Internal server signature verification error" });
    }
  });
  // AI Routes
  app.post('/api/ai/bios', async (req, res) => {
    try {
      const { category, username } = req.body;
      const { GoogleGenAI, Type } = await import('@google/genai');
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is missing on server" });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const prompt = `
        Create 3 distinct, engaging "Link-in-Bio" profile bios for a creator.
        Creator Category: ${category}
        Username: ${username}
        
        Guidelines:
        - Each bio must be under 150 characters.
        - Style 1: Professional & Concise
        - Style 2: Playful & Personal
        - Style 3: Action-Oriented (focus on links)
      `;

      // Resilient runner with retries & flash-lite fallback
      const runWithFallbackAndRetry = async (primaryModel: string, config: Record<string, unknown>) => {
        let lastError: Error | null = null;
        const modelsToTry = [primaryModel, "gemini-3.1-flash-lite"];

        for (const modelToUse of modelsToTry) {
          let delay = 1000;
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              return await ai.models.generateContent({
                model: modelToUse,
                contents: prompt,
                config
              });
            } catch (err: unknown) {
              const errorObj = err instanceof Error ? err : new Error(String(err));
              lastError = errorObj;
              const errMsg = errorObj.message;
              const isTransient = errMsg.includes('503') || errMsg.includes('UNAVAILABLE') || errMsg.includes('high demand');
              
              if (isTransient && attempt < 3) {
                console.warn(`[Gemini] Transient error with model ${modelToUse} on attempt ${attempt}/3. Retrying in ${delay}ms...`);
                await new Promise(r => setTimeout(r, delay));
                delay *= 2;
              } else {
                break;
              }
            }
          }
        }
        throw lastError || new Error("Failed after trying fallback models and retry limits");
      };

      const response = await runWithFallbackAndRetry("gemini-3.5-flash", {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      });

      const textResponse = response.text;
      if (!textResponse) throw new Error("Empty response");
      
      const cleanedJson = textResponse.replace(/```json|```/g, "").trim();
      res.json(JSON.parse(cleanedJson));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Gemini Error:", errorMessage);
      let clientMsg = errorMessage;
      if (errorMessage.includes("API key expired") || errorMessage.includes("API_KEY_INVALID") || errorMessage.includes("INVALID_ARGUMENT") || errorMessage.toLowerCase().includes("api key") || errorMessage.toLowerCase().includes("api_key")) {
        clientMsg = "Gemini API Key is expired, invalid, or misconfigured. Please update or renew your GEMINI_API_KEY in the Settings > Secrets panel of your AI Studio environment.";
      }
      res.status(500).json({ error: clientMsg });
    }
  });

  // Withdrawal request notification endpoint
  app.post('/api/withdrawals/notify-admin', async (req, res) => {
    try {
      const {
        withdrawalId,
        uid,
        amount,
        paymentMethod,
        upiId,
        accountHolderName,
        bankName,
        accountNumber,
        ifscCode,
        referenceNumber,
        username,
        userEmail,
        userDisplayName
      } = req.body;

      console.log(`[Withdrawal Notification Received] ID: ${withdrawalId || 'N/A'}, User: @${username || 'unknown'} (${userEmail || 'unknown'}), Amount: ₹${amount || 0}`);

      const host = process.env.SMTP_HOST || '';
      const port = Number(process.env.SMTP_PORT) || 587;
      const user = process.env.SMTP_USER || '';
      const pass = process.env.SMTP_PASS || '';
      const adminEmail = process.env.ADMIN_EMAIL || 'abhimattikopp9845@gmail.com';

      const emailSubject = `[Lynksy] Urgent: New Withdrawal Request - ₹${amount} from @${username}`;
      const emailBodyHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 16px;">
          <h2 style="color: #ff6b00; margin-top: 0; font-family: sans-serif; font-weight: 900; text-transform: uppercase; letter-spacing: -0.025em;">New Withdrawal Request Received</h2>
          <p>Hello Admin,</p>
          <p>A new creator has requested a payout withdrawal. Here are the transaction details:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background-color: #f4f4f5;">
              <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #e4e4e7; width: 40%;">Creator Username</td>
              <td style="padding: 10px; border-bottom: 1px solid #e4e4e7;">@${username}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #e4e4e7;">Creator Email</td>
              <td style="padding: 10px; border-bottom: 1px solid #e4e4e7;">${userEmail}</td>
            </tr>
            <tr style="background-color: #f4f4f5;">
              <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #e4e4e7;">Requested Amount</td>
              <td style="padding: 10px; border-bottom: 1px solid #e4e4e7; font-weight: bold; color: #ff6b00; font-size: 16px;">₹${amount}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #e4e4e7;">Payment Method</td>
              <td style="padding: 10px; border-bottom: 1px solid #e4e4e7; text-transform: uppercase;">${paymentMethod}</td>
            </tr>
            ${paymentMethod === 'upi' ? `
            <tr style="background-color: #f4f4f5;">
              <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #e4e4e7;">UPI ID</td>
              <td style="padding: 10px; border-bottom: 1px solid #e4e4e7; font-family: monospace;">${upiId}</td>
            </tr>
            ` : `
            <tr style="background-color: #f4f4f5;">
              <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #e4e4e7;">Account Holder</td>
              <td style="padding: 10px; border-bottom: 1px solid #e4e4e7;">${accountHolderName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #e4e4e7;">Bank Name</td>
              <td style="padding: 10px; border-bottom: 1px solid #e4e4e7;">${bankName}</td>
            </tr>
            <tr style="background-color: #f4f4f5;">
              <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #e4e4e7;">Account Number</td>
              <td style="padding: 10px; border-bottom: 1px solid #e4e4e7; font-family: monospace;">${accountNumber}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #e4e4e7;">IFSC Code</td>
              <td style="padding: 10px; border-bottom: 1px solid #e4e4e7; font-family: monospace;">${ifscCode}</td>
            </tr>
            `}
            <tr style="background-color: #f4f4f5;">
              <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #e4e4e7;">Reference ID</td>
              <td style="padding: 10px; border-bottom: 1px solid #e4e4e7; font-family: monospace;">${referenceNumber}</td>
            </tr>
          </table>
          
          <p style="margin-top: 30px;">Please log in to the <strong>Lynksy Admin Panel</strong> to review and settle this cashout disbursal request.</p>
          <div style="margin-top: 20px; text-align: center;">
            <a href="${process.env.APP_URL || 'https://lynksy.app'}/admin" style="background-color: #ff6b00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Go to Admin Panel</a>
          </div>
          
          <hr style="margin-top: 40px; border: 0; border-top: 1px solid #e4e4e7;" />
          <p style="font-size: 11px; color: #71717a; text-align: center;">© ${new Date().getFullYear()} Lynksy. Secure Creator Infrastructure.</p>
        </div>
      `;

      if (host && user && pass) {
        const transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: {
            user,
            pass
          }
        });

        await transporter.sendMail({
          from: `"Lynksy Notifications" <${user}>`,
          to: adminEmail,
          subject: emailSubject,
          html: emailBodyHtml
        });

        console.log(`[SMTP Mailer] Email notification sent successfully to admin: ${adminEmail}`);
        res.json({ success: true, method: 'smtp' });
      } else {
        console.warn(`[SMTP Mailer Warning] SMTP is NOT fully configured in .env file. Showing mock dispatch email:`);
        console.log(`=========================================`);
        console.log(`FROM: Lynksy System <notify@lynksy.app>`);
        console.log(`TO: ${adminEmail}`);
        console.log(`SUBJECT: ${emailSubject}`);
        console.log(`BODYHTML:`);
        console.log(emailBodyHtml);
        console.log(`=========================================`);
        res.json({ success: true, method: 'console_log', warning: 'SMTP is not configured, logged to terminal console' });
      }
    } catch (error) {
      console.error("[Withdrawal Notify Email Error]", error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) });
    }
  });

  // DNS verification endpoint for custom domains
  app.post('/api/verify-dns', async (req, res) => {
    try {
      const { domain, verificationToken, simulate } = req.body;
      if (!domain || !verificationToken) {
        return res.status(400).json({ success: false, error: "Domain and verificationToken are required" });
      }

      const domainLower = String(domain).toLowerCase().trim();
      // Allow testing sandbox mock/preview domains (.test, .local) or passing a simulation flag
      const isMockDomain = domainLower.endsWith('.test') || 
                           domainLower.endsWith('.example.com') || 
                           domainLower.endsWith('.local') ||
                           domainLower.includes('localhost') ||
                           simulate === true;

      if (isMockDomain) {
        console.log(`[DNS Verify] Mock domain bypass active for: ${domainLower}`);
        return res.json({ success: true, verified: true });
      }

      const { resolveTxt } = await import('dns/promises');
      try {
        const records = await resolveTxt(domainLower);
        const hasToken = records.some(record => 
          record.some(text => text.trim() === verificationToken.trim())
        );

        if (hasToken) {
          return res.json({ success: true, verified: true });
        } else {
          return res.json({ 
            success: false, 
            verified: false, 
            error: "Verification record not found. DNS changes may take time." 
          });
        }
      } catch (dnsErr: unknown) {
        const dnsErrMsg = dnsErr instanceof Error ? dnsErr.message : String(dnsErr);
        console.warn(`[DNS Verify] Real DNS lookup failed for ${domainLower}:`, dnsErrMsg);
        return res.json({ 
          success: false, 
          verified: false, 
          error: "Verification record not found. DNS changes may take time." 
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("DNS Error:", errorMessage);
      res.status(500).json({ error: errorMessage });
    }
  });

  // Welcome Email via Brevo API on User Registration
  app.post('/api/welcome-email', async (req, res) => {
    try {
      const { email, username, firstName } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, error: "Recipient email is required" });
      }

      const emailLower = String(email).toLowerCase().trim();
      const userNameStr = String(username || emailLower.split('@')[0]).trim();
      const nameStr = String(firstName || 'Creator').trim();

      const welcomeHtml = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background-color: #fcfbf9; border: 1px solid #e2dad0; border-radius: 24px;">
  <!-- Header Branding -->
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="color: #ff6b00; font-family: 'Syne', sans-serif; font-weight: 900; font-size: 32px; margin: 0; text-transform: uppercase; letter-spacing: -0.03em;">
      Lynksy
    </h1>
    <p style="font-size: 11px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 0.15em; margin: 4px 0 0 0;">
      One Link. Infinite Possibilities.
    </p>
  </div>

  <!-- Hero Content -->
  <div style="background-color: #ffffff; border: 1px solid #f0eae1; border-radius: 20px; padding: 32px; box-shadow: 0 4px 20px rgba(255, 107, 0, 0.02);">
    <h2 style="font-size: 22px; font-weight: 800; color: #1c1816; margin-top: 0; margin-bottom: 12px; font-family: 'Syne', sans-serif;">
      Namaste, ${nameStr}! 🇮🇳
    </h2>
    <p style="font-size: 14px; line-height: 1.6; color: #4b443e; margin: 0 0 24px 0;">
      Welcome to the future of the Indian creator economy. Your profile <strong>@${userNameStr}</strong> has been successfully registered and secured. You are now fully equipped to build a stunning social landing page, collect direct UPI tips with 0% commission, and sell your digital merchandise effortlessly.
    </p>

    <!-- Quick Action Milestones -->
    <h3 style="font-size: 12px; font-weight: 900; text-transform: uppercase; color: #ff6b00; margin-top: 0; margin-bottom: 16px; letter-spacing: 0.05em;">
      Three Steps to Launch Your Brand:
    </h3>

    <!-- Step 1 -->
    <div style="margin-bottom: 16px; padding: 12px 16px; background-color: #fcfbf9; border: 1px solid #f5eff5; border-radius: 12px;">
      <div style="display: flex; align-items: flex-start;">
        <div style="background-color: #ff6b00; color: #ffffff; font-size: 11px; font-weight: 900; border-radius: 50%; width: 20px; height: 20px; line-height: 20px; text-align: center; display: inline-block; margin-right: 12px; flex-shrink: 0;">
          1
        </div>
        <div style="display: inline-block; vertical-align: top;">
          <strong style="color: #1c1816; font-size: 13px; display: block; margin-bottom: 2px;">Populate Your Links</strong>
          <p style="margin: 0; font-size: 12px; color: #71717a; line-height: 1.4;">Add your social channels, YouTube embeds, or direct UPI donation anchors to your page.</p>
        </div>
      </div>
    </div>

    <!-- Step 2 -->
    <div style="margin-bottom: 16px; padding: 12px 16px; background-color: #fcfbf9; border: 1px solid #f5eff5; border-radius: 12px;">
      <div style="display: flex; align-items: flex-start;">
        <div style="background-color: #ff6b00; color: #ffffff; font-size: 11px; font-weight: 900; border-radius: 50%; width: 20px; height: 20px; line-height: 20px; text-align: center; display: inline-block; margin-right: 12px; flex-shrink: 0;">
          2
        </div>
        <div style="display: inline-block; vertical-align: top;">
          <strong style="color: #1c1816; font-size: 13px; display: block; margin-bottom: 2px;">Style Your Page Theme</strong>
          <p style="margin: 0; font-size: 12px; color: #71717a; line-height: 1.4;">Select from our library of stunning themes or interactive animated presets to fit your aesthetic.</p>
        </div>
      </div>
    </div>

    <!-- Step 3 -->
    <div style="margin-bottom: 24px; padding: 12px 16px; background-color: #fcfbf9; border: 1px solid #f5eff5; border-radius: 12px;">
      <div style="display: flex; align-items: flex-start;">
        <div style="background-color: #ff6b00; color: #ffffff; font-size: 11px; font-weight: 900; border-radius: 50%; width: 20px; height: 20px; line-height: 20px; text-align: center; display: inline-block; margin-right: 12px; flex-shrink: 0;">
          3
        </div>
        <div style="display: inline-block; vertical-align: top;">
          <strong style="color: #1c1816; font-size: 13px; display: block; margin-bottom: 2px;">Publish Digital Products</strong>
          <p style="margin: 0; font-size: 12px; color: #71717a; line-height: 1.4;">Upload templates, presets, PDFs, or books to the Creator Store to unlock passive income streams.</p>
        </div>
      </div>
    </div>

    <!-- Call to Action -->
    <div style="text-align: center; margin-top: 28px;">
      <a href="${process.env.APP_URL || 'https://lynksy.app'}/dashboard" style="background-color: #ff6b00; color: #ffffff; font-weight: 800; font-size: 13px; text-decoration: none; padding: 14px 28px; border-radius: 14px; text-transform: uppercase; letter-spacing: 0.05em; display: inline-block; box-shadow: 0 4px 14px rgba(255, 107, 0, 0.2);">
        Go to Creator Dashboard
      </a>
    </div>
  </div>

  <!-- Help Desk Support -->
  <div style="margin-top: 24px; text-align: center; font-size: 12px; color: #71717a;">
    <p>Need custom integration help? Reach out at any time to <a href="mailto:support@lynksy.app" style="color: #ff6b00; text-decoration: none; font-weight: bold;">support@lynksy.app</a></p>
  </div>

  <!-- Footer Info -->
  <hr style="border: 0; border-top: 1px solid #e2dad0; margin: 32px 0;" />
  <div style="text-align: center; font-size: 10px; color: #a1a1aa; line-height: 1.5;">
    <p style="margin: 0 0 4px 0; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; color: #71717a;">Lynksy Private Limited</p>
    <p style="margin: 0;">Secured Creator Infrastructure & 0% Direct Monetization Ecosystem</p>
    <p style="margin: 8px 0 0 0;">© ${new Date().getFullYear()} Lynksy. All rights reserved.</p>
  </div>
</div>
`;

      const apiKey = process.env.BREVO_API_KEY;

      if (apiKey && apiKey !== 'placeholder' && apiKey.trim() !== '') {
        // Send email via Brevo API
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': apiKey.trim(),
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            sender: {
              name: "Lynksy Welcome Desk",
              email: "welcome@lynksy.app"
            },
            to: [
              {
                email: emailLower,
                name: nameStr
              }
            ],
            subject: `Welcome to Lynksy, ${nameStr}! 🎉`,
            htmlContent: welcomeHtml
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Brevo API responded with status ${response.status}: ${errText}`);
        }

        console.log(`[Brevo API] Custom welcome email successfully sent to ${emailLower} (username: @${userNameStr}).`);
        return res.json({ success: true, method: 'brevo_api' });
      } else {
        // Fallback logging when BREVO_API_KEY is not defined yet (for sandbox testing/review)
        console.warn(`[Brevo API Warning] BREVO_API_KEY is not defined or configured on the server. Logging custom welcome email to console:`);
        console.log(`========================================================================`);
        console.log(`[API MOCK DISPATCH] TO: "${nameStr}" <${emailLower}>`);
        console.log(`[API MOCK DISPATCH] FROM: "Lynksy Welcome Desk" <welcome@lynksy.app>`);
        console.log(`[API MOCK DISPATCH] SUBJECT: Welcome to Lynksy, ${nameStr}! 🎉`);
        console.log(`[API MOCK DISPATCH] HTML PREVIEW CONTENT DETECTED: ${welcomeHtml.substring(0, 300)}...`);
        console.log(`========================================================================`);
        return res.json({ 
          success: true, 
          method: 'console_log', 
          warning: 'BREVO_API_KEY is missing, welcome email logged to terminal console.' 
        });
      }
    } catch (error) {
      console.error("[Welcome Email Error]", error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Welcome Email via Brevo API on Newsletter Subscription
  app.post('/api/subscriber-welcome-email', async (req, res) => {
    try {
      const { email, creatorId, creatorUsername, creatorName, welcomeEmailActive, welcomeEmailSubject, welcomeEmailBody } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, error: "Recipient email is required" });
      }

      if (!welcomeEmailActive) {
        return res.json({ success: true, message: "Welcome email campaign is inactive for this creator." });
      }

      const emailLower = String(email).toLowerCase().trim();
      const creatorUsernameStr = String(creatorUsername || '').trim();
      const creatorNameStr = String(creatorName || creatorUsernameStr || 'Creator').trim();
      
      const subjectStr = String(welcomeEmailSubject || 'Welcome to my circle! 👋').trim();
      const bodyStr = String(welcomeEmailBody || 'Thank you so much for subscribing to my newsletter updates! Stay tuned for more premium announcements, custom digital products, and exciting news straight to your inbox.').trim();

      const profileUrl = `${process.env.APP_URL || 'https://lynksy.app'}/${creatorUsernameStr}`;

      const welcomeHtml = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background-color: #fcfbf9; border: 1px solid #e2dad0; border-radius: 24px;">
  <!-- Header Branding -->
  <div style="text-align: center; margin-bottom: 24px;">
    <h1 style="color: #ff6b00; font-family: 'Syne', sans-serif; font-weight: 900; font-size: 28px; margin: 0; text-transform: uppercase; letter-spacing: -0.03em;">
      ${creatorNameStr}
    </h1>
    <p style="font-size: 11px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 0.15em; margin: 4px 0 0 0;">
      Newsletter Subscriber Welcome
    </p>
  </div>

  <!-- Hero Content -->
  <div style="background-color: #ffffff; border: 1px solid #f0eae1; border-radius: 20px; padding: 32px; box-shadow: 0 4px 20px rgba(255, 107, 0, 0.01);">
    <h2 style="font-size: 20px; font-weight: 800; color: #1c1816; margin-top: 0; margin-bottom: 16px;">
      Hello! 👋
    </h2>
    
    <!-- Creator Custom Message -->
    <div style="font-size: 14px; line-height: 1.6; color: #4b443e; margin: 0 0 24px 0; white-space: pre-wrap;">
      ${bodyStr}
    </div>

    <!-- Call to Action -->
    <div style="text-align: center; margin-top: 28px; border-top: 1px solid #f5eff5; padding-top: 24px;">
      <p style="font-size: 13px; color: #71717a; margin-bottom: 16px;">Visit my public profile to see my latest links, store items, and more:</p>
      <a href="${profileUrl}" style="background-color: #ff6b00; color: #ffffff; font-weight: 800; font-size: 13px; text-decoration: none; padding: 14px 28px; border-radius: 14px; text-transform: uppercase; letter-spacing: 0.05em; display: inline-block; box-shadow: 0 4px 14px rgba(255, 107, 0, 0.2);">
        View my Profile
      </a>
    </div>
  </div>

  <!-- Help Desk Support -->
  <div style="margin-top: 24px; text-align: center; font-size: 11px; color: #a1a1aa;">
    <p>You received this because you subscribed to <strong>@${creatorUsernameStr}</strong> on Lynksy.</p>
  </div>

  <!-- Footer Info -->
  <hr style="border: 0; border-top: 1px solid #e2dad0; margin: 24px 0;" />
  <div style="text-align: center; font-size: 10px; color: #a1a1aa; line-height: 1.5;">
    <p style="margin: 0; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; color: #71717a;">Powered by Lynksy</p>
    <p style="margin: 4px 0 0 0;">Secured Creator Infrastructure & Direct Monetization Ecosystem</p>
  </div>
</div>
`;

      const apiKey = process.env.BREVO_API_KEY;

      if (apiKey && apiKey !== 'placeholder' && apiKey.trim() !== '') {
        // Send email via Brevo API
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': apiKey.trim(),
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            sender: {
              name: `${creatorNameStr} via Lynksy`,
              email: "welcome@lynksy.app"
            },
            to: [
              {
                email: emailLower,
                name: "Subscriber"
              }
            ],
            subject: subjectStr,
            htmlContent: welcomeHtml
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Brevo API responded with status ${response.status}: ${errText}`);
        }

        console.log(`[Brevo API] Subscriber welcome email successfully sent to ${emailLower} (creator: @${creatorUsernameStr}).`);
        return res.json({ success: true, method: 'brevo_api' });
      } else {
        // Fallback logging when BREVO_API_KEY is not defined yet (for sandbox testing/review)
        console.warn(`[Brevo API Warning] BREVO_API_KEY is not defined or configured on the server. Logging subscriber welcome email to console:`);
        console.log(`========================================================================`);
        console.log(`[SUBSCRIBER MOCK DISPATCH] TO: <${emailLower}>`);
        console.log(`[SUBSCRIBER MOCK DISPATCH] FROM: "${creatorNameStr} via Lynksy" <welcome@lynksy.app>`);
        console.log(`[SUBSCRIBER MOCK DISPATCH] SUBJECT: ${subjectStr}`);
        console.log(`[SUBSCRIBER MOCK DISPATCH] HTML PREVIEW CONTENT DETECTED: ${welcomeHtml.substring(0, 300)}...`);
        console.log(`========================================================================`);
        return res.json({ 
          success: true, 
          method: 'console_log', 
          warning: 'BREVO_API_KEY is missing, subscriber welcome email logged to terminal console.' 
        });
      }
    } catch (error) {
      console.error("[Subscriber Welcome Email Error]", error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) });
    }
  });

  // SECURE WEBHOOK: Razorpay Webhook Event Handler (Automatic secure subscription fulfillment)
  app.post('/api/razorpay/webhook', async (req: express.Request & { rawBody?: Buffer }, res) => {
    try {
      const headerSig = req.headers['x-razorpay-signature'];
      if (!headerSig) {
        console.warn("[Webhook Alert] Inbound webhook payload received missing x-razorpay-signature header.");
        return res.status(400).json({ error: "Missing signature header verification parameter." });
      }

      const bodyStr = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body);
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

      if (webhookSecret && webhookSecret !== 'webhook_secret_placeholder') {
        const expectedSignature = crypto
          .createHmac('sha256', webhookSecret)
          .update(bodyStr)
          .digest('hex');

        if (expectedSignature !== headerSig) {
          console.error("[Webhook Error] Signature validation mismatch. Event dismissed as fraudulent.");
          return res.status(400).json({ error: "Webhook signature mismatch error." });
        }
      } else {
        console.warn("[Webhook Warn] RAZORPAY_WEBHOOK_SECRET is unconfigured. Signature check bypassed for fallback operations.");
      }

      const event = req.body && req.body.event;
      console.log(`[Webhook Event] Processing Razorpay event: ${event}`);

      if (event === 'order.paid' || event === 'payment.captured') {
        const payment = req.body.payload?.payment?.entity;
        const notes = payment?.notes || {};
        const uid = notes.userId || notes.uid;
        const planId = notes.planId || 'PRO';
        const email = payment?.email || notes.email || '';
        const paymentId = payment?.id;

        if (uid) {
          const dbAdmin = getDbInstance();
          if (dbAdmin) {
            const userRef = dbAdmin.collection('users').doc(uid);
            const subRef = dbAdmin.collection('subscriptions').doc(uid);
            const payRef = dbAdmin.collection('payment_history').doc();

            const now = new Date();
            const expires = new Date();
            expires.setDate(expires.getDate() + 30);

            try {
              await dbAdmin.runTransaction(async (transaction) => {
                transaction.set(userRef, {
                  plan: planId,
                  planType: 'Monthly',
                  planStartedAt: Timestamp ? Timestamp.fromDate(now) : now,
                  planExpiresAt: Timestamp ? Timestamp.fromDate(expires) : expires,
                  purchaseDate: Timestamp ? Timestamp.fromDate(now) : now,
                  expiryDate: Timestamp ? Timestamp.fromDate(expires) : expires,
                  subscriptionStatus: 'ACTIVE'
                }, { merge: true });

                transaction.set(subRef, {
                  userId: uid,
                  plan: planId,
                  status: 'ACTIVE',
                  subscriptionStatus: 'ACTIVE',
                  startedAt: Timestamp ? Timestamp.fromDate(now) : now,
                  expiresAt: Timestamp ? Timestamp.fromDate(expires) : expires,
                  updatedAt: Timestamp ? Timestamp.fromDate(now) : now
                }, { merge: true });

                if (paymentId) {
                  transaction.set(payRef, {
                    userId: uid,
                    email,
                    planPurchased: planId,
                    amountPaid: planId === 'PRO' ? 199 : 399,
                    date: Timestamp ? Timestamp.fromDate(now) : now,
                    createdAt: Timestamp ? Timestamp.fromDate(now) : now,
                    paymentId: paymentId,
                    status: 'SUCCESS'
                  });
                }
              });
              console.log(`[Webhook Success] Upgraded user ${uid} to ${planId} successfully.`);
            } catch (txErr) {
              console.error("[Webhook Error] Transaction update failed inside webhook processor:", txErr);
              return res.status(500).json({ error: "Failed to persist database subscription records" });
            }
          } else {
            console.warn("[Webhook Alert] Firestore admin instance unavailable during webhook processing.");
          }
        } else {
          console.warn("[Webhook Warn] Event resolved but notes.userId was absent from payment entity.");
        }
      }

      res.status(200).json({ status: "success", received: true });
    } catch (error) {
      console.error("Webhook route error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Internal server error" });
    }
  });

  // For development (Vite middleware)
  const isDev = process.env.NODE_ENV !== 'production';
  let vite: import('vite').ViteDevServer | undefined;

  if (isDev) {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    // Use vite's connect instance as middleware
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
  }

  // Handle all other requests
  app.get('*', async (req, res, next) => {
    const url = req.originalUrl;
    
    try {
      if (isDev && vite) {
        // Read index.html from disk instead of hardcoding it
        const fs = await import('fs/promises');
        let template = await fs.readFile(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        return res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } else {
        return res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
      }
    } catch (_error) {
      if (_error instanceof Error) {
        vite?.ssrFixStacktrace(_error);
      }
      next(_error);
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Lynksy] Server bound to 0.0.0.0:${PORT}`);
  });
}

start();

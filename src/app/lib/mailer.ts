import nodemailer from "nodemailer";
import { envVars } from "../config/env";

const transporter = nodemailer.createTransport({
  host: envVars.EMAIL_SENDER.SMTP_HOST,
  port: parseInt(envVars.EMAIL_SENDER.SMTP_PORT, 10),
  secure: true, // port 465
  auth: {
    user: envVars.EMAIL_SENDER.SMTP_USER,
    pass: envVars.EMAIL_SENDER.SMTP_PASS,
  },
});

const FROM = `"AgroLink" <${envVars.EMAIL_SENDER.SMTP_FROM}>`;

// ── Bid emails ────────────────────────────────────────────

export const sendBidAcceptedEmail = async (
  buyerEmail: string,
  cropName: string,
  totalAmount: number,
  orderId: string,
) => {
  await transporter.sendMail({
    from: FROM,
    to: buyerEmail,
    subject: `AgroLink — আপনার bid accepted! ${cropName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">অভিনন্দন! আপনার bid accepted হয়েছে।</h2>
        <p>পণ্য: <strong>${cropName}</strong></p>
        <p>মোট পরিমাণ: <strong>৳${totalAmount}</strong></p>
        <p style="color: #dc2626; font-weight: bold;">
          ⚠️ ২৪ ঘণ্টার মধ্যে payment করুন, নাহলে order বাতিল হবে।
        </p>
        <a href="${envVars.FRONTEND_URL}/orders/${orderId}/pay"
          style="background:#16a34a;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px">
          এখনই Pay করুন
        </a>
      </div>
    `,
  });
};

export const sendBidRejectedEmail = async (
  buyerEmail: string,
  cropName: string,
) => {
  await transporter.sendMail({
    from: FROM,
    to: buyerEmail,
    subject: `AgroLink — Bid result: ${cropName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">এইবার হয়নি।</h2>
        <p><strong>${cropName}</strong>-এ আপনার bid এইবার select হয়নি।</p>
        <p>হতাশ হবেন না — অন্য listings দেখুন এবং আবার bid করুন!</p>
        <a href="${envVars.FRONTEND_URL}/listings"
          style="background:#16a34a;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px">
          Listings দেখুন
        </a>
      </div>
    `,
  });
};

// ── Listing emails ────────────────────────────────────────

export const sendListingApprovedEmail = async (
  farmerEmail: string,
  cropName: string,
) => {
  await transporter.sendMail({
    from: FROM,
    to: farmerEmail,
    subject: `AgroLink — Listing Approved: ${cropName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">আপনার listing approved হয়েছে!</h2>
        <p><strong>${cropName}</strong> এখন active এবং buyers bid করতে পারবে।</p>
        <a href="${envVars.FRONTEND_URL}/farmer/listings"
          style="background:#16a34a;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px">
          Listing দেখুন
        </a>
      </div>
    `,
  });
};

export const sendListingRejectedEmail = async (
  farmerEmail: string,
  cropName: string,
  adminNote: string,
) => {
  await transporter.sendMail({
    from: FROM,
    to: farmerEmail,
    subject: `AgroLink — Listing Rejected: ${cropName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">আপনার listing approved হয়নি।</h2>
        <p>পণ্য: <strong>${cropName}</strong></p>
        <p>কারণ: <strong>${adminNote}</strong></p>
        <p>সমস্যা সমাধান করে আবার submit করুন।</p>
      </div>
    `,
  });
};

// ── Order emails ──────────────────────────────────────────

export const sendOrderShippedEmail = async (
  buyerEmail: string,
  cropName: string,
  courierName: string,
  trackingNumber: string,
) => {
  await transporter.sendMail({
    from: FROM,
    to: buyerEmail,
    subject: `AgroLink — Order Shipped: ${cropName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">আপনার order shipped হয়েছে!</h2>
        <p>পণ্য: <strong>${cropName}</strong></p>
        <p>Courier: <strong>${courierName}</strong></p>
        <p>Tracking Number: <strong>${trackingNumber}</strong></p>
        <p>পণ্য পেলে "Confirm Received" করতে ভুলবেন না।</p>
        <a href="${envVars.FRONTEND_URL}/orders"
          style="background:#16a34a;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px">
          Order Track করুন
        </a>
      </div>
    `,
  });
};

export const sendOrderCompletedEmail = async (
  farmerEmail: string,
  cropName: string,
  amount: number,
) => {
  await transporter.sendMail({
    from: FROM,
    to: farmerEmail,
    subject: `AgroLink — Payment Received: ${cropName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Payment পেয়েছেন!</h2>
        <p>পণ্য: <strong>${cropName}</strong></p>
        <p style="font-size: 24px; color: #16a34a; font-weight: bold;">
          ৳${amount} আপনার wallet-এ জমা হয়েছে।
        </p>
        <a href="${envVars.FRONTEND_URL}/farmer/wallet"
          style="background:#16a34a;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px">
          Wallet দেখুন
        </a>
      </div>
    `,
  });
};

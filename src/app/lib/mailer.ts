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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #16a34a; font-size: 28px; margin: 0;">🎉 অভিনন্দন!</h1>
          <p style="color: #666; margin: 8px 0 0 0;">আপনার bid accepted হয়েছে</p>
        </div>

        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 15px 0; color: #374151;">অর্ডার বিবরণ:</h3>
          <div style="margin-bottom: 12px;">
            <p style="margin: 0 0 4px 0; color: #666; font-size: 12px;">পণ্য</p>
            <p style="margin: 0; font-weight: bold; color: #111; font-size: 16px;">${cropName}</p>
          </div>
          <div style="margin-bottom: 12px;">
            <p style="margin: 0 0 4px 0; color: #666; font-size: 12px;">মোট পরিমাণ</p>
            <p style="margin: 0; font-weight: bold; color: #16a34a; font-size: 20px;">৳${totalAmount}</p>
          </div>
          <div style="border-top: 1px solid #e5e7eb; padding-top: 12px;">
            <p style="margin: 0; color: #dc2626; font-weight: bold;">⚠️ গুরুত্বপূর্ণ: ২৪ ঘণ্টার মধ্যে payment করুন</p>
            <p style="margin: 8px 0 0 0; color: #666; font-size: 13px;">payment না করলে order বাতিল হবে।</p>
          </div>
        </div>

        <div style="text-align: center; margin-bottom: 20px;">
          <a href="${envVars.FRONTEND_URL}/orders/${orderId}/pay"
            style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: bold; font-size: 16px;">
            এখনই Payment করুন
          </a>
        </div>

        <div style="background: #ecfdf5; border: 1px solid #d1fae5; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0; color: #047857;">💳 Payment Methods:</h4>
          <ul style="margin: 0; padding-left: 20px; color: #065f46;">
            <li style="margin-bottom: 6px;">Credit/Debit Card</li>
            <li style="margin-bottom: 6px;">Mobile Banking (bKash, Nagad, Rocket)</li>
            <li style="margin-bottom: 6px;">Online Banking</li>
          </ul>
          <p style="margin: 10px 0 0 0; font-size: 12px; color: #047857;">🔒 সম্পূর্ণ নিরাপদ - Stripe এর মাধ্যমে</p>
        </div>

        <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; text-align: center;">
          <p style="margin: 0; color: #666; font-size: 12px;">Order ID: <strong>${orderId}</strong></p>
          <p style="margin: 8px 0 0 0; color: #999; font-size: 12px;">এই email-এ যেকোনো প্রশ্ন থাকলে আমাদের support team-এ যোগাযোগ করুন।</p>
        </div>
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

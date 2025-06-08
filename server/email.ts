import axios from 'axios';

const isEmailEnabled = !!process.env.BREVO_API_KEY;

if (!isEmailEnabled) {
  console.warn("BREVO_API_KEY not set - email functionality will be disabled");
}

interface EmailParams {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  senderName?: string;
  senderEmail?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!isEmailEnabled) {
    console.log(`[MOCK EMAIL] To: ${params.to}, Subject: ${params.subject}`);
    return true;
  }

  try {
    const emailData = {
      sender: {
        name: params.senderName || 'VyronaMart Admin',
        email: params.senderEmail || 'admin@vyrona.com'
      },
      to: [{ email: params.to }],
      subject: params.subject,
      htmlContent: params.htmlContent,
      textContent: params.textContent
    };

    const response = await axios.post('https://api.brevo.com/v3/smtp/email', emailData, {
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY!
      }
    });

    console.log(`Email sent successfully to ${params.to}`);
    return true;
  } catch (error) {
    console.error('Brevo email error:', error);
    return false;
  }
}

export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: 'VyronaMart - Email Verification OTP',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">VyronaMart Email Verification</h2>
        <p>Your verification OTP is:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; color: #1f2937; border-radius: 8px;">
          ${otp}
        </div>
        <p style="color: #6b7280; font-size: 14px;">This OTP will expire in 10 minutes.</p>
      </div>
    `,
    textContent: `Your VyronaMart verification OTP: ${otp}`,
  });
}

export async function sendOrderConfirmationEmail(
  customerEmail: string,
  customerName: string,
  orderId: number,
  orderDetails: {
    items: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
    totalAmount: number;
    estimatedDelivery: string;
    orderDate: string;
  }
): Promise<boolean> {
  const itemsHtml = orderDetails.items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${item.price}</td>
    </tr>
  `).join('');

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #6366f1; margin: 0;">VyronaMart</h1>
        <p style="color: #6b7280; margin: 5px 0;">Your Trusted Shopping Platform</p>
      </div>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #059669; margin-top: 0;">Order Confirmation</h2>
        <p>Dear ${customerName},</p>
        <p>Thank you for your order! We're excited to confirm that your order has been successfully placed.</p>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="color: #374151;">Order Details</h3>
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="background: #f9fafb; padding: 15px; border-bottom: 1px solid #e5e7eb;">
            <strong>Order #${orderId}</strong> - Placed on ${orderDetails.orderDate}
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 12px 8px; text-align: left; border-bottom: 1px solid #e5e7eb;">Item</th>
                <th style="padding: 12px 8px; text-align: center; border-bottom: 1px solid #e5e7eb;">Qty</th>
                <th style="padding: 12px 8px; text-align: right; border-bottom: 1px solid #e5e7eb;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              <tr style="background: #f9fafb; font-weight: bold;">
                <td style="padding: 12px 8px;">Total</td>
                <td style="padding: 12px 8px;"></td>
                <td style="padding: 12px 8px; text-align: right;">₹${orderDetails.totalAmount}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #1e40af; margin-top: 0;">Delivery Information</h3>
        <p style="margin: 0;"><strong>Estimated Delivery:</strong> ${orderDetails.estimatedDelivery}</p>
        <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">
          We'll send you tracking information once your order ships.
        </p>
      </div>

      <div style="text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
        <p>Thank you for choosing VyronaMart!</p>
        <p>If you have any questions, feel free to contact our support team.</p>
      </div>
    </div>
  `;

  const textContent = `
    VyronaMart Order Confirmation
    
    Dear ${customerName},
    
    Thank you for your order! Your order #${orderId} has been successfully placed.
    
    Order Details:
    ${orderDetails.items.map(item => `- ${item.name} x${item.quantity} - ₹${item.price}`).join('\n')}
    
    Total: ₹${orderDetails.totalAmount}
    Estimated Delivery: ${orderDetails.estimatedDelivery}
    
    We'll send you tracking information once your order ships.
    
    Thank you for choosing VyronaMart!
  `;

  return sendEmail({
    to: customerEmail,
    subject: `VyronaMart Order Confirmation - #${orderId}`,
    htmlContent,
    textContent,
    senderName: 'VyronaMart Admin',
    senderEmail: 'admin@vyrona.com'
  });
}
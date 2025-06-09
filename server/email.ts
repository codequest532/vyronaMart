// Email functionality disabled - no external email service configured

interface EmailParams {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  senderName?: string;
  senderEmail?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  console.log(`[EMAIL DISABLED] To: ${params.to}, Subject: ${params.subject}`);
  return false;
}

export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  try {
    const { sendBrevoEmail } = await import('./brevo-email');
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; text-align: center;">Password Reset Code</h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="font-size: 16px; color: #555; margin-bottom: 20px;">
            You requested to reset your password. Use the verification code below:
          </p>
          <div style="text-align: center; background: white; padding: 15px; border-radius: 4px; border: 2px solid #007bff;">
            <span style="font-size: 24px; font-weight: bold; color: #007bff; letter-spacing: 3px;">${otp}</span>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 15px; text-align: center;">
            This code expires in 15 minutes. If you didn't request this, please ignore this email.
          </p>
        </div>
        <p style="color: #888; font-size: 12px; text-align: center;">
          Best regards,<br>VyronaMart Team
        </p>
      </div>
    `;

    const result = await sendBrevoEmail(
      email,
      'Password Reset Code - VyronaMart',
      htmlContent
    );

    return result.success;
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    return false;
  }
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
  console.log(`[EMAIL DISABLED] Order Confirmation - To: ${customerEmail}, Order: #${orderId}, Amount: ₹${orderDetails.totalAmount}`);
  return false;
}
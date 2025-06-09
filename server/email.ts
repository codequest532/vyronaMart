import { sendBrevoEmail } from './brevo-email';

interface EmailParams {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  senderName?: string;
  senderEmail?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    return await sendBrevoEmail({
      to: params.to,
      subject: params.subject,
      htmlContent: params.htmlContent,
      textContent: params.textContent
    });
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #7c3aed;">VyronaMart</h1>
        <h2 style="color: #374151; margin-bottom: 10px;">Email Verification</h2>
      </div>
      
      <div style="background: #f9fafb; padding: 25px; border-radius: 10px; margin-bottom: 20px;">
        <p style="color: #374151; font-size: 16px; margin-bottom: 15px;">
          Please use the following verification code to complete your registration:
        </p>
        
        <div style="text-align: center; margin: 25px 0;">
          <span style="background: #7c3aed; color: white; padding: 15px 25px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 3px;">
            ${otp}
          </span>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          This code will expire in 10 minutes for security reasons.
        </p>
      </div>
      
      <p style="color: #6b7280; font-size: 12px; text-align: center;">
        If you didn't request this verification, please ignore this email.
      </p>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject: 'VyronaMart - Email Verification Code',
    htmlContent,
    textContent: `Your VyronaMart verification code is: ${otp}. This code will expire in 10 minutes.`
  });
}

export async function sendPasswordResetOTP(email: string, otp: string): Promise<boolean> {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #7c3aed;">VyronaMart</h1>
        <h2 style="color: #374151; margin-bottom: 10px;">Password Reset</h2>
      </div>
      
      <div style="background: #f9fafb; padding: 25px; border-radius: 10px; margin-bottom: 20px;">
        <p style="color: #374151; font-size: 16px; margin-bottom: 15px;">
          You requested to reset your password. Please use the following code:
        </p>
        
        <div style="text-align: center; margin: 25px 0;">
          <span style="background: #dc2626; color: white; padding: 15px 25px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 3px;">
            ${otp}
          </span>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          This code will expire in 10 minutes for security reasons.
        </p>
      </div>
      
      <p style="color: #6b7280; font-size: 12px; text-align: center;">
        If you didn't request this password reset, please ignore this email and your password will remain unchanged.
      </p>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject: 'VyronaMart - Password Reset Code',
    htmlContent,
    textContent: `Your VyronaMart password reset code is: ${otp}. This code will expire in 10 minutes.`
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
  console.log(`[EMAIL DISABLED] Order Confirmation - To: ${customerEmail}, Order: #${orderId}, Amount: ₹${orderDetails.totalAmount}`);
  return false;
}
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
  console.log(`[EMAIL DISABLED] OTP Email - To: ${email}, OTP: ${otp}`);
  return false;
}

export async function sendPasswordResetOTP(email: string, otp: string): Promise<boolean> {
  console.log(`[EMAIL DISABLED] Password Reset OTP - To: ${email}, OTP: ${otp}`);
  return false;
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
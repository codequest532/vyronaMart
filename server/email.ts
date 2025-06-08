// Simplified email service for development
const isEmailEnabled = !!process.env.BREVO_API_KEY;

if (!isEmailEnabled) {
  console.warn("BREVO_API_KEY not set - email functionality will be disabled");
}

interface EmailParams {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!isEmailEnabled) {
    console.log('Email service disabled - BREVO_API_KEY not configured');
    return false;
  }

  console.log(`[MOCK EMAIL] To: ${params.to}, Subject: ${params.subject}`);
  return true;
}

export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  if (!isEmailEnabled) {
    console.log(`[MOCK OTP EMAIL] To: ${email}, OTP: ${otp}`);
    return true;
  }

  return sendEmail({
    to: email,
    subject: 'VyronaMart - Email Verification OTP',
    htmlContent: `<h2>Your OTP: ${otp}</h2>`,
    textContent: `Your OTP: ${otp}`,
  });
}
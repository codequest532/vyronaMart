import * as SibApiV3Sdk from '@sendinblue/client';

if (!process.env.BREVO_API_KEY) {
  throw new Error("BREVO_API_KEY environment variable must be set");
}

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

interface EmailParams {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: params.to }];
    sendSmtpEmail.sender = { email: 'noreply@vyronamart.com', name: 'VyronaMart' };
    sendSmtpEmail.subject = params.subject;
    sendSmtpEmail.htmlContent = params.htmlContent;
    if (params.textContent) {
      sendSmtpEmail.textContent = params.textContent;
    }

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Email sent successfully to:', params.to);
    return true;
  } catch (error) {
    console.error('Brevo email error:', error);
    return false;
  }
}

export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .otp-box { background: white; border: 2px solid #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
        .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 4px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>VyronaMart</h1>
          <p>Password Reset Verification</p>
        </div>
        <div class="content">
          <h2>Reset Your Password</h2>
          <p>You requested to reset your password. Please use the following One-Time Password (OTP) to complete the process:</p>
          
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
            <p><strong>This OTP is valid for 10 minutes</strong></p>
          </div>
          
          <p>If you didn't request a password reset, please ignore this email or contact our support team.</p>
          
          <div class="footer">
            <p>Thank you for using VyronaMart!</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
    VyronaMart - Password Reset Verification
    
    You requested to reset your password. Please use the following One-Time Password (OTP) to complete the process:
    
    OTP: ${otp}
    
    This OTP is valid for 10 minutes.
    
    If you didn't request a password reset, please ignore this email or contact our support team.
    
    Thank you for using VyronaMart!
  `;

  return await sendEmail({
    to: email,
    subject: 'VyronaMart - Password Reset OTP',
    htmlContent,
    textContent
  });
}
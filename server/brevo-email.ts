import { ContactsApi, TransactionalEmailsApi, SendSmtpEmail } from '@sendinblue/client';

if (!process.env.BREVO_API_KEY) {
  throw new Error("BREVO_API_KEY environment variable must be set");
}

const apiInstance = new TransactionalEmailsApi();
apiInstance.setApiKey(0, process.env.BREVO_API_KEY);

interface EmailParams {
  to: string;
  toName?: string;
  from: string;
  fromName?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    const sendSmtpEmail = new SendSmtpEmail();
    sendSmtpEmail.to = [{ email: params.to, name: params.toName || params.to }];
    sendSmtpEmail.sender = { email: params.from, name: params.fromName || 'VyronaSocial' };
    sendSmtpEmail.subject = params.subject;
    sendSmtpEmail.htmlContent = params.htmlContent;
    if (params.textContent) {
      sendSmtpEmail.textContent = params.textContent;
    }

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    return true;
  } catch (error) {
    console.error('Brevo email error:', error);
    return false;
  }
}

export function generateRoomInvitationEmail(
  inviterName: string,
  roomName: string,
  inviteLink: string,
  inviteCode: string
): { subject: string; htmlContent: string; textContent: string } {
  const subject = `Join "${roomName}" on VyronaSocial`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #7c3aed;">You're invited to join a VyronaSocial room!</h2>
      
      <p><strong>${inviterName}</strong> has invited you to join the shopping room "<strong>${roomName}</strong>" on VyronaSocial.</p>
      
      <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #1e293b;">Join Options:</h3>
        
        <div style="margin-bottom: 15px;">
          <strong>Option 1: Click the invite link</strong><br>
          <a href="${inviteLink}" style="display: inline-block; background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">Join Room Now</a>
        </div>
        
        <div>
          <strong>Option 2: Use the room code</strong><br>
          <p>Go to VyronaSocial and enter this room code:</p>
          <div style="background-color: #e2e8f0; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 18px; font-weight: bold; text-align: center; letter-spacing: 2px;">
            ${inviteCode}
          </div>
        </div>
      </div>
      
      <p style="color: #64748b; font-size: 14px;">
        VyronaSocial brings people together for collaborative shopping experiences. 
        Join the room to start shopping together!
      </p>
      
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
      <p style="color: #94a3b8; font-size: 12px;">
        This invitation was sent by ${inviterName}. If you don't want to receive these emails, you can ignore this message.
      </p>
    </div>
  `;
  
  const textContent = `
You're invited to join "${roomName}" on VyronaSocial!

${inviterName} has invited you to join their shopping room.

Join Options:
1. Click this link: ${inviteLink}
2. Use room code: ${inviteCode}

Go to VyronaSocial and enter the room code to join.

VyronaSocial - Collaborative Shopping Made Easy
  `;
  
  return { subject, htmlContent, textContent };
}
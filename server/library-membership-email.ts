interface LibraryMembershipData {
  membershipId: string;
  customerName: string;
  customerEmail: string;
  membershipType: string;
  membershipFee: number;
  expiryDate: string;
  libraries: string[];
  benefits: string[];
}

const ADMIN_EMAIL = 'mgmags25@gmail.com';

export function generateLibraryMembershipConfirmationEmail(data: LibraryMembershipData): { subject: string; htmlContent: string } {
  const subject = `Library Membership Confirmed - Welcome to VyronaRead Libraries!`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Membership Confirmed!</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Welcome to VyronaRead Library Network</p>
      </div>
      
      <div style="padding: 30px; background: #f8f9fa;">
        <div style="background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0; border-bottom: 2px solid #4f46e5; padding-bottom: 10px;">
            📚 Your Library Membership Card
          </h2>
          
          <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
              <div>
                <h3 style="margin: 0; font-size: 18px;">VyronaRead Library Card</h3>
                <p style="margin: 5px 0 0 0; opacity: 0.9;">Member: ${data.customerName}</p>
              </div>
              <div style="text-align: right;">
                <div style="background: rgba(255,255,255,0.2); padding: 8px 12px; border-radius: 4px; font-weight: bold;">
                  ID: ${data.membershipId}
                </div>
              </div>
            </div>
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.3);">
              <div style="display: flex; justify-content: space-between; font-size: 14px;">
                <span>Type: ${data.membershipType.toUpperCase()}</span>
                <span>Valid Until: ${data.expiryDate}</span>
              </div>
            </div>
          </div>
        </div>

        <div style="background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
          <h3 style="color: #333; margin-top: 0;">💳 Payment Confirmation</h3>
          <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; border-left: 4px solid #22c55e;">
            <p style="margin: 0; color: #166534;">
              <strong>✅ Payment Successful</strong><br>
              Amount: ₹${data.membershipFee.toLocaleString()}<br>
              Membership Type: ${data.membershipType}
            </p>
          </div>
        </div>

        <div style="background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
          <h3 style="color: #333; margin-top: 0;">🎯 Your Membership Benefits</h3>
          <ul style="color: #555; line-height: 1.8; padding-left: 20px;">
            ${data.benefits.map(benefit => `<li style="margin-bottom: 8px;">${benefit}</li>`).join('')}
          </ul>
        </div>

        <div style="background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
          <h3 style="color: #333; margin-top: 0;">📍 Partner Libraries</h3>
          <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; border-left: 4px solid #0ea5e9;">
            <p style="color: #0c4a6e; margin: 0;">
              You now have access to <strong>${data.libraries.length} partner libraries</strong>:
            </p>
            <ul style="color: #0c4a6e; margin: 10px 0 0 0; padding-left: 20px;">
              ${data.libraries.map(library => `<li style="margin-bottom: 5px;">${library}</li>`).join('')}
            </ul>
          </div>
        </div>

        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
          <h4 style="color: #92400e; margin-top: 0;">📱 How to Use Your Membership</h4>
          <ol style="color: #92400e; line-height: 1.6;">
            <li>Visit any partner library or browse books online</li>
            <li>Show your membership ID: <strong>${data.membershipId}</strong></li>
            <li>Select books you want to borrow</li>
            <li>Enjoy your 14-day borrowing period per book</li>
          </ol>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding: 20px; background: #e0e7ff; border-radius: 8px;">
          <h4 style="color: #3730a3; margin-top: 0;">Need Help?</h4>
          <p style="color: #3730a3; margin-bottom: 15px;">Contact our support team for any assistance</p>
          <div style="background: white; padding: 10px; border-radius: 4px; display: inline-block;">
            <span style="color: #1e40af; font-weight: bold;">📧 ${ADMIN_EMAIL}</span>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #888; font-size: 14px;">
            Thank you for joining VyronaRead Library Network!<br>
            This is an automated message from the VyronaRead team.
          </p>
        </div>
      </div>
    </div>
  `;
  
  return { subject, htmlContent };
}

export async function sendLibraryMembershipEmail(membershipData: LibraryMembershipData): Promise<boolean> {
  try {
    const { sendBrevoEmail } = await import('./brevo-email');
    const { subject, htmlContent } = generateLibraryMembershipConfirmationEmail(membershipData);
    
    const result = await sendBrevoEmail(
      membershipData.customerEmail,
      subject,
      htmlContent
    );
    
    console.log(`Library membership email sent to ${membershipData.customerEmail}:`, result.success);
    return result.success;
  } catch (error) {
    console.error('Failed to send library membership email:', error);
    return false;
  }
}
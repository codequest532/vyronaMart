import axios from 'axios';

async function testBrevoEmailWorkflow() {
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  
  if (!BREVO_API_KEY) {
    console.error('BREVO_API_KEY not found in environment');
    return;
  }

  console.log('Testing Brevo API connection...');
  
  const emailData = {
    sender: {
      name: "VyronaMart",
      email: "mgmags25@gmail.com"
    },
    to: [
      {
        email: "testcustomer@example.com",
        name: "Test Customer"
      }
    ],
    subject: "Order Confirmed - Your VyronaMart Purchase",
    htmlContent: `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">Order Confirmed!</h2>
            <p>Dear Test Customer,</p>
            <p>Great news! Your order #13 has been confirmed and is now being processed.</p>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1e40af;">Order Details</h3>
              <p><strong>Order ID:</strong> #13</p>
              <p><strong>Total Amount:</strong> $50.00</p>
              <p><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <p>We'll send you another email when your order ships.</p>
            <p>Thank you for shopping with VyronaMart!</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 14px; color: #6b7280;">
                Best regards,<br>
                The VyronaMart Team
              </p>
            </div>
          </div>
        </body>
      </html>
    `
  };

  try {
    const response = await axios.post('https://api.brevo.com/v3/smtp/email', emailData, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY
      }
    });
    
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', response.data.messageId);
    console.log('Response status:', response.status);
    
    return {
      success: true,
      messageId: response.data.messageId
    };
    
  } catch (error) {
    console.error('❌ Email failed:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
}

testBrevoEmailWorkflow().then(result => {
  console.log('\n=== Test Results ===');
  console.log('Email workflow test completed:', result.success ? 'SUCCESS' : 'FAILED');
  if (result.messageId) {
    console.log('Brevo Message ID:', result.messageId);
  }
}).catch(console.error);
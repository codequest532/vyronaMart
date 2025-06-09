import axios from 'axios';

interface BrevoEmailParams {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

interface OrderEmailData {
  orderId: number;
  customerName: string;
  customerEmail: string;
  orderTotal: number;
  orderItems: any[];
  orderDate: string;
  trackingNumber?: string;
  deliveryAddress?: string;
}

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const ADMIN_EMAIL = 'mgmags25@gmail.com';
const ADMIN_NAME = 'Vyrona Platform';

export async function sendBrevoEmail(params: BrevoEmailParams): Promise<boolean> {
  if (!process.env.BREVO_API_KEY) {
    console.error('BREVO_API_KEY is not configured');
    return false;
  }

  try {
    const response = await axios.post(BREVO_API_URL, {
      sender: {
        name: ADMIN_NAME,
        email: ADMIN_EMAIL
      },
      to: [{
        email: params.to,
        name: params.to.split('@')[0]
      }],
      subject: params.subject,
      htmlContent: params.htmlContent,
      textContent: params.textContent || params.htmlContent.replace(/<[^>]*>/g, '')
    }, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY
      }
    });

    console.log('Brevo email sent successfully:', response.data.messageId);
    return true;
  } catch (error: any) {
    console.error('Brevo email error:', error.response?.data || error.message);
    return false;
  }
}

export function generateOrderProcessingEmail(data: OrderEmailData): { subject: string; htmlContent: string } {
  const subject = `Order Confirmed #${data.orderId} - We're preparing your items`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Order Confirmed!</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Thank you for your purchase</p>
      </div>
      
      <div style="padding: 30px; background: #f8f9fa;">
        <h2 style="color: #333; margin-top: 0;">Hi ${data.customerName},</h2>
        <p style="color: #555; line-height: 1.6;">
          Great news! We've received your order and we're now preparing your items for shipment.
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Order Details</h3>
          <p><strong>Order Number:</strong> #${data.orderId}</p>
          <p><strong>Order Date:</strong> ${new Date(data.orderDate).toLocaleDateString()}</p>
          <p><strong>Total Amount:</strong> ₹${data.orderTotal.toLocaleString()}</p>
          
          <h4 style="color: #333; margin-top: 20px;">Items Ordered:</h4>
          ${data.orderItems.map(item => `
            <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
              <p style="margin: 5px 0;"><strong>${item.name || item.productName}</strong></p>
              <p style="margin: 5px 0; color: #666;">Quantity: ${item.quantity} × ₹${item.price}</p>
            </div>
          `).join('')}
        </div>
        
        <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #1976d2; margin-top: 0;">What happens next?</h4>
          <ul style="color: #555; line-height: 1.6;">
            <li>We'll prepare your items for shipment</li>
            <li>You'll receive a shipping confirmation email once your order is dispatched</li>
            <li>Track your order status on our platform</li>
          </ul>
        </div>
        
        <p style="color: #555; line-height: 1.6;">
          If you have any questions about your order, please don't hesitate to contact our support team.
        </p>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #888; font-size: 14px;">
            Thank you for choosing Vyrona Platform!<br>
            This is an automated message, please do not reply to this email.
          </p>
        </div>
      </div>
    </div>
  `;
  
  return { subject, htmlContent };
}

export function generateOrderShippedEmail(data: OrderEmailData): { subject: string; htmlContent: string } {
  const subject = `Order Shipped #${data.orderId} - Your package is on the way`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Order Shipped!</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Your package is on its way</p>
      </div>
      
      <div style="padding: 30px; background: #f8f9fa;">
        <h2 style="color: #333; margin-top: 0;">Hi ${data.customerName},</h2>
        <p style="color: #555; line-height: 1.6;">
          Excellent news! Your order has been dispatched and is now on its way to you.
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Shipping Details</h3>
          <p><strong>Order Number:</strong> #${data.orderId}</p>
          <p><strong>Shipped Date:</strong> ${new Date().toLocaleDateString()}</p>
          ${data.trackingNumber ? `<p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>` : ''}
          <p><strong>Delivery Address:</strong><br>${data.deliveryAddress || 'As provided during checkout'}</p>
        </div>
        
        <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #2e7d32; margin-top: 0;">Delivery Information</h4>
          <ul style="color: #555; line-height: 1.6;">
            <li>Estimated delivery: 3-5 business days</li>
            <li>You'll receive an update when your package is out for delivery</li>
            <li>Someone should be available to receive the package</li>
          </ul>
        </div>
        
        <p style="color: #555; line-height: 1.6;">
          We'll keep you updated throughout the delivery process. Thank you for your patience!
        </p>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #888; font-size: 14px;">
            Thank you for choosing Vyrona Platform!<br>
            This is an automated message, please do not reply to this email.
          </p>
        </div>
      </div>
    </div>
  `;
  
  return { subject, htmlContent };
}

export function generateOrderOutForDeliveryEmail(data: OrderEmailData): { subject: string; htmlContent: string } {
  const subject = `Out for Delivery #${data.orderId} - Arriving today`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ffa726 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Out for Delivery!</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Your order is arriving today</p>
      </div>
      
      <div style="padding: 30px; background: #f8f9fa;">
        <h2 style="color: #333; margin-top: 0;">Hi ${data.customerName},</h2>
        <p style="color: #555; line-height: 1.6;">
          Your order is out for delivery and should arrive today! Please ensure someone is available to receive it.
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Delivery Details</h3>
          <p><strong>Order Number:</strong> #${data.orderId}</p>
          <p><strong>Expected Delivery:</strong> Today</p>
          ${data.trackingNumber ? `<p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>` : ''}
          <p><strong>Delivery Address:</strong><br>${data.deliveryAddress || 'As provided during checkout'}</p>
        </div>
        
        <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #f57c00; margin-top: 0;">Important Delivery Notes</h4>
          <ul style="color: #555; line-height: 1.6;">
            <li>Please ensure someone is available at the delivery address</li>
            <li>Valid ID may be required for delivery confirmation</li>
            <li>If nobody is available, we'll attempt redelivery the next business day</li>
          </ul>
        </div>
        
        <p style="color: #555; line-height: 1.6;">
          We're excited for you to receive your order! If you have any delivery concerns, please contact our support team.
        </p>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #888; font-size: 14px;">
            Thank you for choosing Vyrona Platform!<br>
            This is an automated message, please do not reply to this email.
          </p>
        </div>
      </div>
    </div>
  `;
  
  return { subject, htmlContent };
}

export function generateOrderDeliveredEmail(data: OrderEmailData): { subject: string; htmlContent: string } {
  const subject = `Order Delivered #${data.orderId} - Thank you for shopping with us`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #4caf50 0%, #81c784 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Order Delivered!</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Thank you for choosing us</p>
      </div>
      
      <div style="padding: 30px; background: #f8f9fa;">
        <h2 style="color: #333; margin-top: 0;">Hi ${data.customerName},</h2>
        <p style="color: #555; line-height: 1.6;">
          Great news! Your order has been successfully delivered. We hope you're happy with your purchase!
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Delivery Confirmation</h3>
          <p><strong>Order Number:</strong> #${data.orderId}</p>
          <p><strong>Delivered Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Total Amount:</strong> ₹${data.orderTotal.toLocaleString()}</p>
        </div>
        
        <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #2e7d32; margin-top: 0;">What's Next?</h4>
          <ul style="color: #555; line-height: 1.6;">
            <li>Enjoy your new items!</li>
            <li>Rate and review your purchase to help other customers</li>
            <li>Contact support if you have any issues with your order</li>
            <li>Check out our latest products for your next purchase</li>
          </ul>
        </div>
        
        <p style="color: #555; line-height: 1.6;">
          Thank you for being a valued customer. We appreciate your business and look forward to serving you again!
        </p>
        
        <div style="text-align: center; margin-top: 30px; padding: 20px; background: #e3f2fd; border-radius: 8px;">
          <h4 style="color: #1976d2; margin-top: 0;">Stay Connected</h4>
          <p style="color: #555; margin-bottom: 15px;">Follow us for updates on new products and exclusive offers</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #888; font-size: 14px;">
            Thank you for choosing Vyrona Platform!<br>
            This is an automated message, please do not reply to this email.
          </p>
        </div>
      </div>
    </div>
  `;
  
  return { subject, htmlContent };
}
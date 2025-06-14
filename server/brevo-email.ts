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

interface InstagramOrderData {
  orderId: number;
  sellerName: string;
  sellerEmail: string;
  storeName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  productName: string;
  productPrice: number;
  quantity: number;
  totalAmount: number;
  paymentMethod: string;
  shippingAddress: {
    name: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    email: string;
  };
  orderDate: string;
  orderStatus: string;
}

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const ADMIN_EMAIL = 'mgmags25@gmail.com';
const ADMIN_NAME = 'Vyrona Platform';

export async function sendBrevoEmail(
  to: string, 
  subject: string, 
  htmlContent: string, 
  textContent?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!process.env.BREVO_API_KEY) {
    console.error('BREVO_API_KEY is not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await axios.post(BREVO_API_URL, {
      sender: {
        name: ADMIN_NAME,
        email: ADMIN_EMAIL
      },
      to: [{
        email: to,
        name: to.split('@')[0]
      }],
      subject: subject,
      htmlContent: htmlContent,
      textContent: textContent || htmlContent.replace(/<[^>]*>/g, '')
    }, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY
      }
    });

    return {
      success: true,
      messageId: response.data.messageId
    };
  } catch (error: any) {
    console.error('Brevo email error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
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

export function generateInstagramSellerNotificationEmail(data: InstagramOrderData): { subject: string; htmlContent: string } {
  const subject = `New Instagram Order #${data.orderId} - ${data.storeName}`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">New Instagram Order!</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Order #${data.orderId} from ${data.storeName}</p>
      </div>
      
      <div style="padding: 30px; background: #f8f9fa;">
        <h2 style="color: #333; margin-top: 0;">Hello ${data.sellerName},</h2>
        <p style="color: #555; line-height: 1.6;">
          Great news! You've received a new order through your Instagram store. Here are the complete order details:
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #833ab4;">
          <h3 style="color: #333; margin-top: 0;">Order Summary</h3>
          <p><strong>Order ID:</strong> #${data.orderId}</p>
          <p><strong>Order Date:</strong> ${new Date(data.orderDate).toLocaleDateString('en-IN', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
          <p><strong>Status:</strong> <span style="background: #e8f5e8; color: #2e7d32; padding: 4px 8px; border-radius: 4px;">${data.orderStatus}</span></p>
          <p><strong>Payment Method:</strong> ${data.paymentMethod.toUpperCase()}</p>
          <p><strong>Total Amount:</strong> <span style="font-size: 18px; color: #2e7d32; font-weight: bold;">₹${(data.totalAmount / 100).toLocaleString('en-IN')}</span></p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Product Details</h3>
          <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
            <p style="margin: 5px 0; font-weight: bold; color: #333;">${data.productName}</p>
            <p style="margin: 5px 0; color: #666;">Quantity: ${data.quantity} × ₹${(data.productPrice / 100).toLocaleString('en-IN')}</p>
          </div>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Customer Information</h3>
          <p><strong>Name:</strong> ${data.customerName}</p>
          <p><strong>Email:</strong> ${data.customerEmail}</p>
          <p><strong>Phone:</strong> ${data.customerPhone}</p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Shipping Address</h3>
          <p style="color: #555; line-height: 1.6;">
            <strong>${data.shippingAddress.name}</strong><br>
            ${data.shippingAddress.addressLine1}<br>
            ${data.shippingAddress.addressLine2 ? data.shippingAddress.addressLine2 + '<br>' : ''}
            ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.pincode}<br>
            Phone: ${data.shippingAddress.phone}<br>
            Email: ${data.shippingAddress.email}
          </p>
        </div>
        
        <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #1976d2; margin-top: 0;">Next Steps</h4>
          <ul style="color: #555; line-height: 1.6;">
            <li>Log into your Instagram seller dashboard to view complete order details</li>
            <li>Prepare the item for shipment</li>
            <li>Update the order status once shipped</li>
            <li>Contact the customer if you need any clarification</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'https://vyronamart.com'}/vyronainstastore-dashboard" 
             style="background: linear-gradient(135deg, #833ab4 0%, #fd1d1d 100%); 
                    color: white; 
                    padding: 12px 24px; 
                    text-decoration: none; 
                    border-radius: 6px; 
                    font-weight: bold;
                    display: inline-block;">
            View Order in Dashboard
          </a>
        </div>
        
        <p style="color: #555; line-height: 1.6;">
          Thank you for being part of the Vyrona Instagram marketplace. If you have any questions about this order, please contact our support team.
        </p>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #888; font-size: 14px;">
            Vyrona Platform - Instagram Store Management<br>
            This is an automated notification, please do not reply to this email.
          </p>
        </div>
      </div>
    </div>
  `;
  
  return { subject, htmlContent };
}

export function generateInstagramCustomerConfirmationEmail(data: any): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Order Confirmed!</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Thank you for your Instagram order #${data.orderId}</p>
      </div>
      
      <div style="padding: 30px; background: #f8f9fa;">
        <h2 style="color: #333; margin-top: 0;">Hello ${data.customerName},</h2>
        <p style="color: #555; line-height: 1.6;">
          Your order has been confirmed and is being processed. Here are your order details:
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #833ab4;">
          <h3 style="color: #333; margin-top: 0;">Order Summary</h3>
          <p><strong>Order ID:</strong> #${data.orderId}</p>
          <p><strong>Order Date:</strong> ${new Date(data.orderDate).toLocaleDateString('en-IN', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
          <p><strong>Payment Method:</strong> ${data.paymentMethod.toUpperCase()}</p>
          <p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>
        </div>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Items Ordered</h3>
          ${data.items.map((item: any) => `
            <div style="border-bottom: 1px solid #eee; padding: 15px 0;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <p style="margin: 0; font-weight: bold; color: #333;">${item.productName}</p>
                  <p style="margin: 5px 0; color: #666; font-size: 14px;">Qty: ${item.quantity} × ₹${item.price}</p>
                </div>
                <div style="text-align: right;">
                  <p style="margin: 0; font-weight: bold; color: #2e7d32;">₹${item.total}</p>
                </div>
              </div>
            </div>
          `).join('')}
          
          <div style="border-top: 2px solid #833ab4; padding-top: 15px; margin-top: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <p style="margin: 0; font-size: 18px; font-weight: bold; color: #333;">Total Amount:</p>
              <p style="margin: 0; font-size: 20px; font-weight: bold; color: #2e7d32;">₹${data.totalAmount}</p>
            </div>
          </div>
        </div>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Shipping Address</h3>
          <p style="color: #555; margin: 5px 0; line-height: 1.6;">
            ${data.shippingAddress.name}<br>
            ${data.shippingAddress.addressLine1}<br>
            ${data.shippingAddress.addressLine2 ? data.shippingAddress.addressLine2 + '<br>' : ''}
            ${data.shippingAddress.city}, ${data.shippingAddress.state} - ${data.shippingAddress.pincode}<br>
            Phone: ${data.shippingAddress.phone}
          </p>
        </div>

        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h4 style="color: #1976d2; margin-top: 0;">What happens next?</h4>
          <p style="color: #555; margin-bottom: 0;">
            • Your order is being prepared by the seller<br>
            • You'll receive tracking updates via email<br>
            • Estimated delivery: 3-7 business days
          </p>
        </div>
        
        <p style="color: #555; line-height: 1.6;">
          If you have any questions about your order, please contact our support team with your order number.
        </p>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #888; font-size: 14px;">
            Thank you for shopping with VyronaInstaStore!<br>
            This is an automated message, please do not reply to this email.
          </p>
        </div>
      </div>
    </div>
  `;
}
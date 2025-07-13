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
  if (!process.env.VYRONAMART_BREVO_API_KEY) {
    console.error('VYRONAMART_BREVO_API_KEY is not configured');
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
        'api-key': process.env.VYRONAMART_BREVO_API_KEY
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

// Instagram Order Status Update Email Templates
export function generateInstagramOrderStatusEmail(data: InstagramOrderData): { subject: string; htmlContent: string } {
  const statusMessages = {
    confirmed: {
      title: "Order Confirmed",
      message: "Great news! Your order has been confirmed and is being prepared for shipment.",
      nextSteps: [
        "Your seller is preparing your order",
        "You'll receive another update when your order ships",
        "Keep your phone handy for delivery updates"
      ]
    },
    shipped: {
      title: "Order Shipped",
      message: "Your order is on its way! Your package has been shipped and is heading to your delivery address.",
      nextSteps: [
        "Track your package using the details below",
        "Ensure someone is available at the delivery address",
        "Contact us if you don't receive it within expected timeframe"
      ]
    },
    out_for_delivery: {
      title: "Out for Delivery",
      message: "Exciting news! Your order is out for delivery and will arrive today.",
      nextSteps: [
        "Please be available at your delivery address",
        "Keep your phone accessible for delivery calls",
        "Have a valid ID ready if required"
      ]
    },
    delivered: {
      title: "Order Delivered",
      message: "Your order has been successfully delivered! We hope you love your purchase.",
      nextSteps: [
        "Check your package and ensure everything is in order",
        "Contact the seller if you have any issues",
        "Consider leaving a review to help other customers"
      ]
    },
    cancelled: {
      title: "Order Cancelled",
      message: "Your order has been cancelled. If you didn't request this cancellation, please contact the seller immediately.",
      nextSteps: [
        "Any payment will be refunded within 3-5 business days",
        "Contact the seller for more information",
        "Feel free to browse other products from this store"
      ]
    }
  };

  const statusInfo = statusMessages[data.orderStatus as keyof typeof statusMessages] || statusMessages.confirmed;
  
  const subject = `${statusInfo.title} - Order #${data.orderId} from ${data.storeName}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${statusInfo.title}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background: white; padding: 0; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #833ab4 0%, #fd1d1d 100%); 
                    color: white; 
                    padding: 30px; 
                    text-align: center; 
                    border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">${statusInfo.title}</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Order #${data.orderId}</p>
        </div>
        
        <!-- Status Message -->
        <div style="padding: 30px; text-align: center;">
          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #2e7d32; margin-top: 0;">Order Status Update</h2>
            <p style="font-size: 16px; color: #333; margin: 0;">${statusInfo.message}</p>
          </div>
        </div>
        
        <!-- Order Details -->
        <div style="padding: 0 30px;">
          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e0e0e0; margin-bottom: 20px;">
            <h3 style="color: #333; margin-top: 0; border-bottom: 2px solid #e1306c; padding-bottom: 10px;">Order Information</h3>
            <div style="display: grid; gap: 10px;">
              <p style="margin: 5px 0;"><strong>Order ID:</strong> #${data.orderId}</p>
              <p style="margin: 5px 0;"><strong>Store:</strong> ${data.storeName}</p>
              <p style="margin: 5px 0;"><strong>Product:</strong> ${data.productName}</p>
              <p style="margin: 5px 0;"><strong>Quantity:</strong> ${data.quantity}</p>
              <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${(data.totalAmount / 100).toLocaleString('en-IN')}</p>
              <p style="margin: 5px 0;"><strong>Order Date:</strong> ${data.orderDate}</p>
              <p style="margin: 5px 0;"><strong>Current Status:</strong> <span style="background: #e1306c; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; text-transform: uppercase;">${data.orderStatus.replace('_', ' ')}</span></p>
            </div>
          </div>
        </div>
        
        <!-- Shipping Address -->
        <div style="padding: 0 30px;">
          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e0e0e0; margin-bottom: 20px;">
            <h3 style="color: #333; margin-top: 0; border-bottom: 2px solid #e1306c; padding-bottom: 10px;">Delivery Address</h3>
            <div style="color: #555; line-height: 1.8;">
              <strong>${data.shippingAddress.name}</strong><br>
              ${data.shippingAddress.addressLine1}<br>
              ${data.shippingAddress.addressLine2 ? data.shippingAddress.addressLine2 + '<br>' : ''}
              ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.pincode}<br>
              Phone: ${data.shippingAddress.phone}
            </div>
          </div>
        </div>
        
        <!-- Next Steps -->
        <div style="padding: 0 30px;">
          <div style="background: #f3e5f5; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="color: #7b1fa2; margin-top: 0;">What's Next?</h3>
            <ul style="color: #555; line-height: 1.8; padding-left: 20px;">
              ${statusInfo.nextSteps.map(step => `<li>${step}</li>`).join('')}
            </ul>
          </div>
        </div>
        
        <!-- Contact Information -->
        <div style="padding: 0 30px 30px;">
          <div style="background: #fff3e0; padding: 20px; border-radius: 8px; text-align: center;">
            <h4 style="color: #f57c00; margin-top: 0;">Need Help?</h4>
            <p style="margin: 10px 0; color: #555;">
              Contact the seller: <strong>${data.sellerEmail}</strong><br>
              Or reach out to our support team for assistance
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border-top: 1px solid #e0e0e0;">
          <p style="margin: 0; color: #666; font-size: 14px;">
            Thank you for shopping with ${data.storeName} on VyronaMart<br>
            <a href="${process.env.FRONTEND_URL || 'https://vyronamart.com'}" style="color: #e1306c; text-decoration: none;">Visit VyronaMart</a>
          </p>
        </div>
        
      </div>
    </body>
    </html>
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

export async function sendSellerConfirmationEmail(
  recipientEmail: string,
  sellerData: {
    businessName: string;
    ownerName: string;
    sellerType: string;
    credentials: {
      email: string;
      password: string;
    };
  }
): Promise<void> {
  const platformFeatures = {
    'vyronainstastore': {
      name: 'VyronaInstaStore',
      features: [
        'Connect your Instagram business account',
        'Import products directly from Instagram posts',
        'Manage customer inquiries through direct messaging',
        'Track social commerce analytics'
      ]
    },
    'vyronaread': {
      name: 'VyronaRead',
      features: [
        'Add books, e-books, and educational materials',
        'Set up library partnerships and bulk orders',
        'Manage book loans and rental schedules',
        'Access educational institution features'
      ]
    },
    'vyronaspace': {
      name: 'VyronaSpace',
      features: [
        'Configure your store location for local discovery',
        'Enable 15-minute hyperlocal delivery',
        'Set up in-store pickup options',
        'Manage geo-based inventory and pricing'
      ]
    },
    'vyronamallconnect': {
      name: 'VyronaMallConnect',
      features: [
        'Set up your virtual mall storefront',
        'Connect with mall partnerships',
        'Access premium branding tools',
        'Enterprise-level analytics and reporting'
      ]
    },
    'vyronahub': {
      name: 'VyronaHub & VyronaSocial',
      features: [
        'Create and manage your product catalog',
        'Enable group buying and social shopping features',
        'Access comprehensive sales analytics',
        'Utilize targeted marketing tools'
      ]
    }
  };

  const platform = platformFeatures[sellerData.sellerType] || platformFeatures['vyronahub'];
  
  const emailContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Welcome to VyronaMart - Seller Registration Confirmed</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .credentials { background: #e8f4f8; border-left: 4px solid #3498db; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .platform-info { background: #e8f5e8; border-left: 4px solid #27ae60; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .next-steps { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
        ul { padding-left: 20px; }
        li { margin: 8px 0; }
        .highlight { background: #ffeb3b; padding: 2px 4px; border-radius: 2px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Welcome to VyronaMart!</h1>
        <p>Your ${platform.name} seller account has been successfully created</p>
    </div>
    
    <div class="content">
        <h2>Dear ${sellerData.ownerName},</h2>
        
        <p>Congratulations! Your seller registration for <strong>${sellerData.businessName}</strong> has been approved and your account is now active on the VyronaMart platform.</p>
        
        <div class="platform-info">
            <h3>Registration Details</h3>
            <ul>
                <li><strong>Business Name:</strong> ${sellerData.businessName}</li>
                <li><strong>Owner Name:</strong> ${sellerData.ownerName}</li>
                <li><strong>Platform:</strong> ${platform.name}</li>
                <li><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</li>
                <li><strong>Account Status:</strong> <span class="highlight">ACTIVE</span></li>
            </ul>
        </div>
        
        <div class="credentials">
            <h3>Your Login Credentials</h3>
            <p><strong>Login Email:</strong> ${sellerData.credentials.email}</p>
            <p><strong>Password:</strong> ${sellerData.credentials.password}</p>
            <p><em>Please keep these credentials secure and consider changing your password after first login for enhanced security.</em></p>
        </div>
        
        <div class="next-steps">
            <h3>Next Steps to Start Selling</h3>
            <ol>
                <li>Log into your seller dashboard using the credentials above</li>
                <li>Complete your store profile and business information</li>
                <li>Upload your first products with high-quality images</li>
                <li>Configure payment methods and shipping settings</li>
                <li>Launch your store and start selling!</li>
            </ol>
        </div>
        
        <h3>Platform-Specific Features Available to You</h3>
        <div class="platform-info">
            <ul>
                ${platform.features.map(feature => `<li>${feature}</li>`).join('')}
            </ul>
        </div>
        
        <h3>Need Help Getting Started?</h3>
        <p>Our dedicated seller support team is here to help you succeed:</p>
        <ul>
            <li><strong>Email Support:</strong> seller-support@vyronamart.com</li>
            <li><strong>Phone Support:</strong> +91-8888-123-456 (9 AM - 6 PM)</li>
            <li><strong>Live Chat:</strong> Available in your seller dashboard</li>
            <li><strong>Seller Guide:</strong> Complete setup tutorials and best practices</li>
            <li><strong>Training Resources:</strong> Video tutorials and webinars</li>
        </ul>
        
        <p><strong>Important:</strong> Your account is immediately active and ready for use. You can start adding products and accepting orders right away.</p>
        
        <p>Thank you for choosing VyronaMart to grow your business. We're committed to your success and look forward to supporting your entrepreneurial journey!</p>
        
        <p>Best regards,<br>
        <strong>The VyronaMart Admin Team</strong><br>
        Email: admin@vyronamart.com<br>
        VyronaMart Seller Operations</p>
    </div>
    
    <div class="footer">
        <p>© 2025 VyronaMart. All rights reserved.</p>
        <p>This is an automated confirmation email. For support inquiries, please use the contact information above.</p>
    </div>
</body>
</html>`;

  try {
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        to: [{ email: recipientEmail, name: sellerData.ownerName }],
        sender: { email: 'admin@vyronamart.com', name: 'VyronaMart Admin Team' },
        subject: `Welcome to ${platform.name} - Your Seller Account is Active!`,
        htmlContent: emailContent
      },
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': process.env.VYRONAMART_BREVO_API_KEY
        }
      }
    );
    
    console.log(`Seller confirmation email sent successfully to ${recipientEmail}`);
  } catch (error) {
    console.error('Error sending seller confirmation email:', error);
    // Don't throw error to avoid breaking registration flow
  }
}

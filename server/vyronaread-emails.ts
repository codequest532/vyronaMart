import { sendBrevoEmail } from './brevo-email';

interface VyronaReadOrderData {
  orderId: number;
  customerName: string;
  customerEmail: string;
  orderTotal: number;
  orderItems: any[];
  orderDate: string;
  trackingNumber?: string;
  deliveryAddress?: string;
}

// VyronaRead Order Status Email Templates for 4-Stage Management System
export function generateVyronaReadOrderStatusEmail(data: VyronaReadOrderData, status: string): { subject: string; htmlContent: string } {
  const statusConfig = {
    processing: {
      title: "Order Confirmed - We're preparing your books",
      icon: "📚",
      color: "#2196f3",
      gradient: "linear-gradient(135deg, #2196f3 0%, #1976d2 100%)",
      message: "Great news! We've received your order and we're now preparing your books for processing.",
      nextSteps: [
        "We're packaging your books with care",
        "You'll receive a shipping confirmation once dispatched",
        "Track your order status in your VyronaRead account"
      ]
    },
    shipped: {
      title: "Order Shipped - Your books are on the way",
      icon: "🚚",
      color: "#ff9800",
      gradient: "linear-gradient(135deg, #ff9800 0%, #f57c00 100%)",
      message: "Exciting news! Your order has been shipped and is now on its way to you.",
      nextSteps: [
        "Your books are in transit",
        "You'll receive delivery updates via SMS/email",
        "Expected delivery: 2-3 business days"
      ]
    },
    "out for delivery": {
      title: "Out for Delivery - Your books will arrive today",
      icon: "🛵",
      color: "#4caf50",
      gradient: "linear-gradient(135deg, #4caf50 0%, #388e3c 100%)",
      message: "Almost there! Your order is out for delivery and should reach you today.",
      nextSteps: [
        "Delivery partner is on the way",
        "Please be available to receive your order",
        "Contact delivery partner if needed"
      ]
    },
    delivered: {
      title: "Order Delivered - Enjoy your books!",
      icon: "📖",
      color: "#4caf50",
      gradient: "linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)",
      message: "Wonderful! Your order has been successfully delivered. Happy reading!",
      nextSteps: [
        "Start exploring your new books",
        "Rate your experience on VyronaRead",
        "Share your reading journey with us"
      ]
    },
    cancelled: {
      title: "Order Cancelled - Refund processing",
      icon: "❌",
      color: "#f44336",
      gradient: "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)",
      message: "Your order has been cancelled as requested. We're processing your refund.",
      nextSteps: [
        "Refund will be processed within 3-5 business days",
        "You'll receive confirmation once refund is complete",
        "Feel free to browse our collection again"
      ]
    }
  };

  const config = statusConfig[status] || statusConfig.processing;
  const subject = `VyronaRead Order #${data.orderId} - ${config.title}`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: ${config.gradient}; padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">${config.icon} ${config.title}</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">VyronaRead Order Update</p>
      </div>
      
      <div style="padding: 30px; background: #f8f9fa;">
        <h2 style="color: #333; margin-top: 0;">Hi ${data.customerName},</h2>
        <p style="color: #555; line-height: 1.6; font-size: 16px;">
          ${config.message}
        </p>
        
        <div style="background: white; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid ${config.color};">
          <h3 style="color: #333; margin-top: 0;">Order Details</h3>
          <p><strong>Order Number:</strong> #${data.orderId}</p>
          <p><strong>Order Date:</strong> ${new Date(data.orderDate).toLocaleDateString()}</p>
          <p><strong>Order Status:</strong> <span style="color: ${config.color}; font-weight: bold; text-transform: capitalize;">${status}</span></p>
          ${data.trackingNumber ? `<p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>` : ''}
          ${data.deliveryAddress ? `<p><strong>Delivery Address:</strong> ${data.deliveryAddress}</p>` : ''}
          
          <h4 style="color: #333; margin-top: 20px;">Books Ordered:</h4>
          ${data.orderItems.map(item => `
            <div style="border-bottom: 1px solid #eee; padding: 12px 0;">
              <p style="margin: 5px 0; font-weight: bold;">${item.name || item.productName}</p>
              <p style="margin: 5px 0; color: #666;">
                ${item.author ? `Author: ${item.author} | ` : ''}
                Quantity: ${item.quantity} | 
                Type: ${item.type || 'Purchase'} | 
                Price: ₹${item.price}
              </p>
            </div>
          `).join('')}
        </div>
        
        <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h4 style="color: #333; margin-top: 0;">📋 What's happening next?</h4>
          <ul style="color: #555; line-height: 1.8; margin: 10px 0;">
            ${config.nextSteps.map(step => `<li style="margin: 8px 0;">${step}</li>`).join('')}
          </ul>
        </div>
        
        ${status !== 'cancelled' ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="background: ${config.color}; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              ${status === 'delivered' ? 'Rate Your Experience' : 'Track Your Order'}
            </a>
          </div>
        ` : ''}
        
        <div style="border-top: 2px solid #ddd; padding-top: 25px; margin-top: 35px; text-align: center; color: #666;">
          <p style="font-weight: bold; margin-bottom: 10px;">Thank you for choosing VyronaRead!</p>
          <p>Questions? Contact us at support@vyronaread.com or call +91-XXXX-XXXXX</p>
          <p style="font-size: 14px; margin-top: 15px;">
            <a href="#" style="color: ${config.color}; text-decoration: none;">Visit VyronaRead</a> | 
            <a href="#" style="color: ${config.color}; text-decoration: none;">Your Account</a> | 
            <a href="#" style="color: ${config.color}; text-decoration: none;">Help Center</a>
          </p>
        </div>
      </div>
    </div>
  `;
  
  return { subject, htmlContent };
}

// Send VyronaRead order status update email using Brevo
export async function sendVyronaReadOrderStatusUpdate(
  customerEmail: string, 
  orderData: VyronaReadOrderData, 
  status: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { subject, htmlContent } = generateVyronaReadOrderStatusEmail(orderData, status);
    
    const result = await sendBrevoEmail(customerEmail, subject, htmlContent);
    
    if (result.success) {
      console.log(`VyronaRead order status email sent successfully to ${customerEmail} for order #${orderData.orderId} - Status: ${status}`);
      return { success: true };
    } else {
      console.error(`Failed to send VyronaRead order status email:`, result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('VyronaRead order status email error:', error);
    return { success: false, error: String(error) };
  }
}
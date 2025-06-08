import axios from 'axios';
import QRCode from 'qrcode';

// Cashfree configuration
const CASHFREE_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.cashfree.com' 
  : 'https://sandbox.cashfree.com';

const cashfreeHeaders = {
  'x-client-id': process.env.CASHFREE_APP_ID || '',
  'x-client-secret': process.env.CASHFREE_SECRET_KEY || '',
  'Content-Type': 'application/json'
};

export interface UPIPaymentRequest {
  roomId: number;
  itemId: number;
  amount: number;
  userId: number;
}

export interface UPIPaymentResponse {
  success: boolean;
  qrCode?: string;
  upiString?: string;
  referenceId?: string;
  amount?: number;
  expiryTime?: Date;
  instructions?: string[];
  error?: string;
}

export async function generateUPIQRCode(request: UPIPaymentRequest): Promise<UPIPaymentResponse> {
  try {
    const { roomId, itemId, amount, userId } = request;
    
    // Generate unique reference for this contribution
    const referenceId = `GRP${roomId}_ITM${itemId}_USR${userId}_${Date.now()}`;
    
    // Generate virtual UPI ID for Cashfree AutoCollect
    const virtualUPI = `vyrona${Math.random().toString(36).substr(2, 6)}@icici`;
    
    // Create UPI payment string
    const upiString = `upi://pay?pa=${virtualUPI}&pn=VyronaMart&am=${amount}&cu=INR&tn=Group contribution Room ${roomId}&tr=${referenceId}`;
    
    // Generate UPI QR Code
    const qrCodeDataURL = await QRCode.toDataURL(upiString, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return {
      success: true,
      qrCode: qrCodeDataURL,
      upiString,
      referenceId,
      amount,
      expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      instructions: [
        "Scan the QR code with any UPI app",
        "Verify the amount and merchant details",
        "Complete the payment",
        "Your contribution will be updated automatically"
      ]
    };

  } catch (error: any) {
    console.error('UPI QR generation error:', error);
    return {
      success: false,
      error: "Failed to generate UPI QR code"
    };
  }
}

export async function createCashfreeVirtualAccount(referenceId: string, amount: number): Promise<any> {
  try {
    if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
      console.warn('Cashfree credentials not configured - using mock response');
      return { success: false, error: 'Payment gateway not configured' };
    }

    const response = await axios.post(
      `${CASHFREE_BASE_URL}/api/v2/easy-split`,
      {
        vpa: `vyrona${Math.random().toString(36).substr(2, 6)}@icici`,
        amount: amount,
        purpose: `Group contribution`,
        reference: referenceId,
        expiry_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      { headers: cashfreeHeaders }
    );

    return response.data;
  } catch (error: any) {
    console.error('Cashfree API error:', error.response?.data || error.message);
    return { success: false, error: 'Payment gateway error' };
  }
}
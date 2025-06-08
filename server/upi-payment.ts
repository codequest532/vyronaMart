import axios from 'axios';
import QRCode from 'qrcode';

// Simple UPI payment configuration
const MERCHANT_CONFIG = {
  name: "VyronaMart",
  upiId: "merchant@upi"
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
  virtualUPI?: string;
  paymentLink?: string;
  requiresManualVerification?: boolean;
  expiryTime?: Date;
  instructions?: string[];
  error?: string;
}

export async function generateUPIQRCode(request: UPIPaymentRequest): Promise<UPIPaymentResponse> {
  try {
    const { roomId, itemId, amount, userId } = request;
    
    // Generate unique reference for this contribution
    const referenceId = `GRP${roomId}_ITM${itemId}_USR${userId}_${Date.now()}`;
    
    // Use merchant UPI ID for payment
    const virtualUPI = MERCHANT_CONFIG.upiId;
    
    // Create UPI payment string
    const upiString = `upi://pay?pa=${virtualUPI}&pn=${MERCHANT_CONFIG.name}&am=${amount}&cu=INR&tn=Group contribution Room ${roomId}&tr=${referenceId}`;
    
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
      virtualUPI,
      paymentLink: upiString,
      requiresManualVerification: true,
      expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      instructions: [
        "Scan the QR code with any UPI app",
        "Complete the payment to the merchant UPI ID",
        "Note down your transaction ID from the UPI app",
        "Use manual verification to confirm your payment"
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

export async function createSimpleUPIPayment(referenceId: string, amount: number): Promise<any> {
  try {
    // Generate a simple UPI payment link for manual verification
    const merchantUPI = MERCHANT_CONFIG.upiId;
    const merchantName = MERCHANT_CONFIG.name;
    
    return {
      success: true,
      virtualUPI: merchantUPI,
      paymentLink: `upi://pay?pa=${merchantUPI}&pn=${merchantName}&am=${amount}&cu=INR&tn=GroupContribution&tr=${referenceId}`,
      requiresManualVerification: true,
      instructions: [
        "Use any UPI app to scan the QR code",
        "Complete the payment to the merchant UPI ID",
        "Note down your transaction ID from the UPI app",
        "Use the manual verification option to confirm payment"
      ]
    };
  } catch (error: any) {
    console.error('UPI payment creation error:', error);
    return { success: false, error: 'Failed to create UPI payment' };
  }
}
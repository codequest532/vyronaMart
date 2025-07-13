import { apiRequest } from "./queryClient";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: any) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, any>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

export interface ModulePaymentData {
  amount: number;
  userId: number;
  module: string;
  orderData?: any;
  // Module-specific fields
  cartItems?: any[];
  deliveryAddress?: any;
  groupId?: number;
  contribution?: number;
  storeId?: number;
  deliveryTime?: string;
  mallId?: number;
  stores?: any[];
  deliveryOption?: string;
  bookId?: number;
  orderType?: string;
  rentalPeriod?: string;
  instagramStoreId?: number;
  productIds?: number[];
}

export class VyronaMartRazorpay {
  private static instance: VyronaMartRazorpay;
  private isScriptLoaded = false;

  private constructor() {}

  public static getInstance(): VyronaMartRazorpay {
    if (!VyronaMartRazorpay.instance) {
      VyronaMartRazorpay.instance = new VyronaMartRazorpay();
    }
    return VyronaMartRazorpay.instance;
  }

  async loadRazorpayScript(): Promise<boolean> {
    if (this.isScriptLoaded) return true;

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        this.isScriptLoaded = true;
        resolve(true);
      };
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async createModuleOrder(module: string, paymentData: ModulePaymentData) {
    const endpoint = `/api/${module}/create-order`;
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error creating ${module} order:`, error);
      throw error;
    }
  }

  async verifyPayment(paymentResponse: any, module: string, userId: number, amount: number, orderData?: any) {
    try {
      const response = await fetch('/api/razorpay/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          razorpay_order_id: paymentResponse.razorpay_order_id,
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_signature: paymentResponse.razorpay_signature,
          module,
          userId,
          amount,
          orderData
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Payment verification error:', error);
      throw error;
    }
  }

  async processModulePayment(module: string, paymentData: ModulePaymentData, user: any): Promise<any> {
    // Load Razorpay script if not already loaded
    const isLoaded = await this.loadRazorpayScript();
    if (!isLoaded) {
      throw new Error('Failed to load Razorpay script');
    }

    // Create order for the specific module
    const orderResponse = await this.createModuleOrder(module, paymentData);
    
    return new Promise((resolve, reject) => {
      const options: RazorpayOptions = {
        key: orderResponse.keyId,
        amount: orderResponse.amount,
        currency: orderResponse.currency,
        name: this.getModuleName(module),
        description: this.getModuleDescription(module),
        order_id: orderResponse.orderId,
        handler: async (response: any) => {
          try {
            const verification = await this.verifyPayment(
              response,
              module,
              paymentData.userId,
              paymentData.amount,
              paymentData.orderData
            );
            resolve(verification);
          } catch (error) {
            reject(error);
          }
        },
        prefill: {
          name: user.username || user.name,
          email: user.email,
          contact: user.phone || ''
        },
        notes: {
          module,
          userId: paymentData.userId.toString()
        },
        theme: {
          color: this.getModuleColor(module)
        },
        modal: {
          ondismiss: () => {
            reject(new Error('Payment cancelled by user'));
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    });
  }

  private getModuleName(module: string): string {
    const names: Record<string, string> = {
      'vyronahub': 'VyronaHub',
      'vyronasocial': 'VyronaSocial',
      'vyronaspace': 'VyronaSpace',
      'vyronamallconnect': 'VyronaMallConnect',
      'vyronaread': 'VyronaRead',
      'vyronainstastore': 'VyronaInstaStore'
    };
    return names[module] || 'VyronaMart';
  }

  private getModuleDescription(module: string): string {
    const descriptions: Record<string, string> = {
      'vyronahub': 'Traditional E-commerce Shopping',
      'vyronasocial': 'Group Shopping Experience',
      'vyronaspace': 'Hyperlocal Delivery (5-15 min)',
      'vyronamallconnect': 'Mall Shopping (30-60 min)',
      'vyronaread': 'Books & Digital Library',
      'vyronainstastore': 'Instagram Shopping'
    };
    return descriptions[module] || 'VyronaMart Purchase';
  }

  private getModuleColor(module: string): string {
    const colors: Record<string, string> = {
      'vyronahub': '#3B82F6',      // Blue
      'vyronasocial': '#10B981',    // Green
      'vyronaspace': '#F59E0B',     // Orange
      'vyronamallconnect': '#8B5CF6', // Purple
      'vyronaread': '#EF4444',      // Red
      'vyronainstastore': '#EC4899'  // Pink
    };
    return colors[module] || '#6366F1';
  }
}

// Export singleton instance
export const razorpayService = VyronaMartRazorpay.getInstance();

// Utility functions for each module
export const VyronaHubCheckout = {
  async processPayment(amount: number, userId: number, cartItems: any[], deliveryAddress: any, user: any) {
    return razorpayService.processModulePayment('vyronahub', {
      amount,
      userId,
      module: 'vyronahub',
      cartItems,
      deliveryAddress,
      orderData: { cartItems, deliveryAddress }
    }, user);
  }
};

export const VyronaSocialCheckout = {
  async processPayment(amount: number, userId: number, groupId: number, contribution: number, user: any) {
    return razorpayService.processModulePayment('vyronasocial', {
      amount,
      userId,
      module: 'vyronasocial',
      groupId,
      contribution,
      orderData: { groupId, contribution }
    }, user);
  }
};

export const VyronaSpaceCheckout = {
  async processPayment(amount: number, userId: number, storeId: number, deliveryTime: string, cartItems: any[], user: any) {
    return razorpayService.processModulePayment('vyronaspace', {
      amount,
      userId,
      module: 'vyronaspace',
      storeId,
      deliveryTime,
      orderData: { storeId, deliveryTime, cartItems }
    }, user);
  }
};

export const VyronaMallConnectCheckout = {
  async processPayment(amount: number, userId: number, mallId: number, stores: any[], deliveryOption: string, user: any) {
    return razorpayService.processModulePayment('vyronamallconnect', {
      amount,
      userId,
      module: 'vyronamallconnect',
      mallId,
      stores,
      deliveryOption,
      orderData: { mallId, stores, deliveryOption }
    }, user);
  }
};

export const VyronaReadCheckout = {
  async processPayment(amount: number, userId: number, bookId: number, orderType: string, rentalPeriod: string, user: any) {
    return razorpayService.processModulePayment('vyronaread', {
      amount,
      userId,
      module: 'vyronaread',
      bookId,
      orderType,
      rentalPeriod,
      orderData: { bookId, orderType, rentalPeriod }
    }, user);
  }
};

export const VyronaInstaStoreCheckout = {
  async processPayment(amount: number, userId: number, instagramStoreId: number, productIds: number[], user: any) {
    return razorpayService.processModulePayment('vyronainstastore', {
      amount,
      userId,
      module: 'vyronainstastore',
      instagramStoreId,
      productIds,
      orderData: { instagramStoreId, productIds }
    }, user);
  }
};
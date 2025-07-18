import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';

export interface CartItem {
  id: number;
  productId: number;
  name: string;
  price: number;
  discountedPrice?: number;
  quantity: number;
  imageUrl: string;
  isGroupBuy?: boolean;
  groupBuyType?: "single_product" | "multi_product";
  groupBuyDiscount?: number;
  category: string;
  minQuantity?: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getGroupBuyStatus: () => { 
    isEligible: boolean; 
    singleProductCount: number; 
    multiProductCount: number;
    type: "single_product" | "multi_product" | "mixed" | "none";
  };
}

export const useCartStore = create<CartStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        items: [],
        
        addItem: (newItem) => {
          const items = get().items;
          const existingItem = items.find(item => item.productId === newItem.productId && item.isGroupBuy === newItem.isGroupBuy);
          
          if (existingItem) {
            set({
              items: items.map(item =>
                item.productId === newItem.productId && item.isGroupBuy === newItem.isGroupBuy
                  ? { ...item, quantity: item.quantity + newItem.quantity }
                  : item
              )
            });
          } else {
            const id = Date.now() + Math.random();
            set({
              items: [...items, { ...newItem, id }]
            });
          }
        },
        
        removeItem: (id) => {
          set({
            items: get().items.filter(item => item.id !== id)
          });
        },
        
        updateQuantity: (id, quantity) => {
          if (quantity <= 0) {
            get().removeItem(id);
            return;
          }
          
          set({
            items: get().items.map(item =>
              item.id === id ? { ...item, quantity } : item
            )
          });
        },
        
        clearCart: () => {
          set({ items: [] });
        },
        
        getTotalItems: () => {
          return get().items.reduce((total, item) => total + item.quantity, 0);
        },
        
        getTotalPrice: () => {
          return get().items.reduce((total, item) => {
            const price = item.discountedPrice || item.price;
            return total + (price * item.quantity);
          }, 0);
        }
      }),
      {
        name: 'vyronasocial-cart',
      }
    )
  )
);

// Separate store for group buy items
export const useGroupBuyCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (newItem) => {
        const items = get().items;
        const existingItem = items.find(item => item.productId === newItem.productId);
        
        if (existingItem) {
          set({
            items: items.map(item =>
              item.productId === newItem.productId
                ? { ...item, quantity: item.quantity + newItem.quantity }
                : item
            )
          });
        } else {
          const id = Date.now() + Math.random();
          set({
            items: [...items, { ...newItem, id }]
          });
        }
      },
      
      removeItem: (id) => {
        set({
          items: get().items.filter(item => item.id !== id)
        });
      },
      
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        
        set({
          items: get().items.map(item =>
            item.id === id ? { ...item, quantity } : item
          )
        });
      },
      
      clearCart: () => {
        set({ items: [] });
      },
      
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
      
      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          const price = item.discountedPrice || item.price;
          return total + (price * item.quantity);
        }, 0);
      }
    }),
    {
      name: 'vyronasocial-groupbuy-cart',
    }
  )
);
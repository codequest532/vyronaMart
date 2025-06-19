import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import Landing from "@/pages/landing";
import ProductDetails from "@/pages/product-details";
import SocialProductDetails from "@/pages/social-product-details";
import ReadProductDetails from "@/pages/read-product-details";
import StoreDetails from "@/pages/store-details";
import VyronaSocial from "@/pages/social";
import PlaceOrder from "@/pages/place-order-new";
import SimpleCheckout from "@/pages/checkout-simple";

import VyronaInstaShop from "@/pages/instashop";
import InstagramCheckout from "@/pages/instagram-checkout";
import OrderConfirmation from "@/pages/order-confirmation";
import VyronaHub from "@/pages/vyronahub";
import VyronaHubCheckout from "@/pages/vyronahub-checkout";
import OrderSuccess from "@/pages/order-success";
import VyronaRead from "@/pages/vyronaread";
import VyronaReadCheckout from "@/pages/vyronaread-checkout";
import VyronaReadCartCheckout from "@/pages/vyronaread-cart-checkout";
import EBookCheckout from "@/pages/ebook-checkout";
import LibraryBrowse from "@/pages/library-browse";
import LibraryCartCheckout from "@/pages/library-cart-checkout";
import VyronaSpace from "@/pages/vyronaspace";
import VyronaSpaceCheckout from "@/pages/vyronaspace-checkout";
import VyronaMallConnect from "@/pages/vyronamallconnect";
import MallCartCheckout from "@/pages/mallcart-checkout";
import GroupMallCartCheckout from "@/pages/group-mallcart-checkout";
import GroupOrderConfirmation from "@/pages/group-order-confirmation";
import OrderTracking from "@/pages/order-tracking";
import MyVyrona from "@/pages/myvyrona";
import Cart from "@/pages/cart";
import InstaCart from "@/pages/instacart";
import Login from "@/pages/login";
import AdminDashboard from "@/pages/admin-dashboard";
import VyronaHubDashboard from "@/pages/vyronahub-dashboard";
import VyronaReadDashboard from "@/pages/vyronaread-dashboard";
import VyronaInstaStoreDashboard from "@/pages/vyronainstastore-dashboard";
import VyronaSpaceSellerDashboard from "@/pages/vyronaspace-seller-dashboard";
import VyronaMallConnectSellerDashboard from "@/pages/vyronamallconnect-seller-dashboard";
import EbookReader from "@/pages/ebook-reader";

import NotFound from "@/pages/not-found";
import { useUserData } from "./hooks/use-user-data";
import { useEffect } from "react";

function Router() {
  const { user, isLoading } = useUserData();

  // Don't block routing while loading for development
  if (isLoading && window.location.pathname === '/') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading VyronaMart...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Authentication Route */}
      <Route path="/login" component={Login} />
      
      {/* Admin Interface */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin-dashboard" component={AdminDashboard} />
      
      {/* Seller Interface */}
      <Route path="/vyronahub-dashboard" component={VyronaHubDashboard} />
      

      
      {/* VyronaRead Interface */}
      <Route path="/book-seller-dashboard" component={VyronaReadDashboard} />
      <Route path="/vyronaread-dashboard" component={VyronaReadDashboard} />
      
      {/* VyronaInstaStore Interface */}
      <Route path="/vyronainstastore-dashboard" component={VyronaInstaStoreDashboard} />
      
      {/* Customer Interface route for existing instashop */}
      <Route path="/vyronainstastore-customer" component={VyronaInstaStoreDashboard} />
      

      
      {/* Customer Interface (Default) */}
      <Route path="/" component={Home} />
      <Route path="/home" component={Home} />
      <Route path="/landing" component={Landing} />
      <Route path="/product/:productId">
        {(params) => <ProductDetails productId={params.productId} />}
      </Route>
      <Route path="/social/product/:productId">
        {(params) => <SocialProductDetails productId={params.productId} />}
      </Route>
      <Route path="/read/product/:productId">
        {(params) => <ReadProductDetails productId={params.productId} />}
      </Route>
      <Route path="/store/:storeId">
        {(params) => <StoreDetails storeId={params.storeId} />}
      </Route>
      <Route path="/social" component={VyronaSocial} />

      <Route path="/place-order/:roomId" component={SimpleCheckout} />
      <Route path="/place-order-new/:roomId" component={PlaceOrder} />
      <Route path="/checkout-modern/:id" component={SimpleCheckout} />
      <Route path="/instashop" component={VyronaInstaShop} />
      <Route path="/instagram-checkout" component={InstagramCheckout} />
      <Route path="/order-confirmation" component={OrderConfirmation} />
      <Route path="/vyronahub" component={VyronaHub} />
      <Route path="/vyronahub-checkout" component={VyronaHubCheckout} />
      <Route path="/order-success" component={OrderSuccess} />
      <Route path="/vyronaread" component={VyronaRead} />
      <Route path="/vyronaread-checkout" component={VyronaReadCheckout} />
      <Route path="/vyronaread-cart-checkout" component={VyronaReadCartCheckout} />
      <Route path="/library-cart-checkout" component={LibraryCartCheckout} />
      <Route path="/ebook-checkout" component={EBookCheckout} />
      <Route path="/library-browse" component={LibraryBrowse} />
      <Route path="/vyronaspace" component={VyronaSpace} />
      <Route path="/vyronaspace-checkout" component={VyronaSpaceCheckout} />
      <Route path="/vyronaspace-seller-dashboard" component={VyronaSpaceSellerDashboard} />
      <Route path="/vyronamallconnect-seller-dashboard" component={VyronaMallConnectSellerDashboard} />
      <Route path="/vyronamallconnect" component={VyronaMallConnect} />
      <Route path="/mallcart-checkout" component={MallCartCheckout} />
      <Route path="/group-mallcart-checkout" component={GroupMallCartCheckout} />
      <Route path="/group-order-confirmation/:orderId">
        {(params) => <GroupOrderConfirmation params={params} />}
      </Route>
      <Route path="/track-order/:orderId">
        {(params) => <OrderTracking />}
      </Route>
      <Route path="/myvyrona">
        {user ? <MyVyrona /> : <Landing />}
      </Route>
      <Route path="/cart" component={Cart} />
      <Route path="/instacart" component={InstaCart} />
      <Route path="/ebook-reader" component={EbookReader} />
      
      {/* 404 Not Found */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    // Global error handler for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Check if this is a query-related error we can safely ignore
      const reason = event.reason;
      if (reason && typeof reason === 'object' && 'message' in reason) {
        const message = String(reason.message);
        // Ignore common authentication and API errors that are handled by the app
        if (message.includes('401') || message.includes('Unauthorized') || 
            message.includes('Failed to fetch') || message.includes('NetworkError')) {
          event.preventDefault();
          return;
        }
      }
      console.warn('Unhandled promise rejection:', event.reason);
      event.preventDefault();
    };

    // Global error handler for JavaScript errors
    const handleError = (event: ErrorEvent) => {
      console.warn('Global error:', event.error);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

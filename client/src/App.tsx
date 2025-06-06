import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import Landing from "@/pages/landing";
import ProductDetails from "@/pages/product-details";
import StoreDetails from "@/pages/store-details";
import VyronaSocial from "@/pages/social";
import PlaceOrder from "@/pages/place-order";

import VyronaInstaShop from "@/pages/instashop";
import VyronaHub from "@/pages/vyronahub";
import VyronaRead from "@/pages/vyronaread";
import VyronaReadCheckout from "@/pages/vyronaread-checkout";
import EBookCheckout from "@/pages/ebook-checkout";
import LibraryBrowse from "@/pages/library-browse";
import MyVyrona from "@/pages/myvyrona";
import Cart from "@/pages/cart";
import Login from "@/pages/login";
import AdminDashboard from "@/pages/admin-dashboard";
import SellerDashboard from "@/pages/seller-dashboard";
import EbookReader from "@/pages/ebook-reader";
import NotFound from "@/pages/not-found";
import { useUserData } from "./hooks/use-user-data";

function Router() {
  const { user, isLoading } = useUserData();

  if (isLoading) {
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
      <Route path="/seller" component={SellerDashboard} />
      <Route path="/seller-dashboard" component={SellerDashboard} />
      
      {/* Customer Interface (Default) */}
      {user ? (
        <Route path="/" component={Home} />
      ) : (
        <Route path="/" component={Landing} />
      )}
      <Route path="/home" component={Home} />
      <Route path="/product/:productId">
        {(params) => <ProductDetails productId={params.productId} />}
      </Route>
      <Route path="/store/:storeId">
        {(params) => <StoreDetails storeId={params.storeId} />}
      </Route>
      <Route path="/social" component={VyronaSocial} />
      <Route path="/place-order/:roomId" component={PlaceOrder} />
      <Route path="/instashop" component={VyronaInstaShop} />
      <Route path="/vyronahub" component={VyronaHub} />
      <Route path="/vyronaread" component={VyronaRead} />
      <Route path="/vyronaread-checkout" component={VyronaReadCheckout} />
      <Route path="/ebook-checkout" component={EBookCheckout} />
      <Route path="/library-browse" component={LibraryBrowse} />
      <Route path="/myvyrona" component={MyVyrona} />
      <Route path="/cart" component={Cart} />
      <Route path="/ebook-reader" component={EbookReader} />
      
      {/* 404 Not Found */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
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

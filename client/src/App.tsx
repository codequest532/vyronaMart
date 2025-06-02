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
import VyronaInstaShop from "@/pages/instashop";
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
      {user ? (
        <Route path="/" component={Home} />
      ) : (
        <Route path="/" component={Landing} />
      )}
      <Route path="/product/:productId">
        {(params) => <ProductDetails productId={params.productId} />}
      </Route>
      <Route path="/store/:storeId">
        {(params) => <StoreDetails storeId={params.storeId} />}
      </Route>
      <Route path="/social" component={VyronaSocial} />
      <Route path="/instashop" component={VyronaInstaShop} />
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

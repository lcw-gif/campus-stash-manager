import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import PurchaseManagement from "./pages/PurchaseManagement";
import StockManagement from "./pages/StockManagement";
import StockTake from "./pages/StockTake";
import BorrowManagement from "./pages/BorrowManagement";
import TransactionHistory from "./pages/TransactionHistory";
import SearchPage from "./pages/SearchPage";
import CourseManagement from "./pages/CourseManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <Navigation />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/purchase" element={<ProtectedRoute><PurchaseManagement /></ProtectedRoute>} />
              <Route path="/stock" element={<ProtectedRoute><StockManagement /></ProtectedRoute>} />
              <Route path="/stock-take" element={<ProtectedRoute><StockTake /></ProtectedRoute>} />
              <Route path="/borrow" element={<ProtectedRoute><BorrowManagement /></ProtectedRoute>} />
              <Route path="/courses" element={<ProtectedRoute><CourseManagement /></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><TransactionHistory /></ProtectedRoute>} />
              <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

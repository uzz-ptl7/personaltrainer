import React, { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import Index from "./pages/Index";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const checkUserBlockStatus = async (currentUser: User | null) => {
    if (!currentUser) {
      setUser(null);
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_blocked')
        .eq('user_id', currentUser.id)
        .single();

      if (error) {
        console.error('Error checking user block status:', error);
        setUser(currentUser); // If we can't check, allow the user to proceed
        return;
      }

      if (profile?.is_blocked) {
        // User is blocked, sign them out
        await supabase.auth.signOut();
        setUser(null);
        toast({
          variant: "destructive",
          title: "Account Blocked",
          description: "Your account has been blocked. Please contact support for assistance.",
        });
        return;
      }

      setUser(currentUser);
    } catch (error) {
      console.error('Error in checkUserBlockStatus:', error);
      setUser(currentUser); // If we can't check, allow the user to proceed
    }
  };

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      checkUserBlockStatus(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        checkUserBlockStatus(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Always use BrowserRouter to allow navigation
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index onAuthRequest={() => setUser(null)} />} />
        <Route path="/auth" element={<Auth onAuthChange={setUser} />} />
        <Route path="/dashboard" element={
          user ? <Dashboard user={user} onSignOut={() => setUser(null)} /> : <Auth onAuthChange={setUser} />
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

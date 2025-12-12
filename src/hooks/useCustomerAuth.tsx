import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  loyalty_points?: number;
  loyalty_tier?: string;
  total_orders?: number;
  total_spent?: number;
}

interface CustomerAuthContextType {
  customer: Customer | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<{ error: any | null; data?: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any | null }>;
  resendConfirmationEmail: (email: string) => Promise<{ error: any | null }>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export const CustomerAuthProvider = ({ children }: { children: ReactNode }) => {
  const { user, role, signOut: authSignOut } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch customer data when user is authenticated and has customer role
  useEffect(() => {
    const fetchCustomer = async () => {
      if (!user || role !== "customer") {
        setCustomer(null);
        setLoading(false);
        return;
      }

      try {
        // Fetch customer data using user_id
        const { data, error } = await supabase
          .from("customers")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching customer:", error);
          setCustomer(null);
          return;
        }

        if (data) {
          setCustomer({
            id: data.id,
            name: data.name,
            email: data.email,
            phone: data.phone,
            loyalty_points: data.loyalty_points,
            loyalty_tier: data.loyalty_tier,
            total_orders: data.total_orders,
            total_spent: data.total_spent,
          });
        } else {
          setCustomer(null);
        }
      } catch (error) {
        console.error("Unexpected error fetching customer:", error);
        setCustomer(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [user, role]);

  const signIn = async (email: string, password: string) => {
    try {
      // Use Supabase Auth to sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Sign in error:", error);
        return { error };
      }

      // Check if user has customer role
      if (data?.user) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .eq("role", "customer")
          .maybeSingle();

        if (!roleData) {
          // User doesn't have customer role, sign them out
          await supabase.auth.signOut();
          return { error: { message: "This account is not a customer account. Please use the staff login." } };
        }
      }

      return { error: null };
    } catch (err) {
      console.error("Unexpected sign in error:", err);
      return { error: err as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phone: string) => {
    try {
      // Check if customer already exists with this email or phone
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id, email, phone")
        .or(`email.eq.${email},phone.eq.${phone}`)
        .maybeSingle();

      if (existingCustomer) {
        return { error: { message: "A customer with this email or phone already exists" } };
      }

      // Check if email is already in auth.users
      const { data: existingAuth } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", email)
        .maybeSingle();

      if (existingAuth) {
        return { error: { message: "An account with this email already exists" } };
      }

      // Sign up using Supabase Auth with customer metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
          },
          emailRedirectTo: `${window.location.origin}/customer/confirm`,
        },
      });

      if (authError) {
        console.error("Sign up error:", authError);
        return { error: authError };
      }

      // Check if email confirmation is required
      // If user is created but email is not confirmed, Supabase will send confirmation email
      if (authData?.user && !authData?.session) {
        // Email confirmation required - email should be sent automatically
        console.log("User created, confirmation email should be sent to:", email);
      }

      // The trigger will automatically:
      // 1. Create customer record
      // 2. Assign 'customer' role
      // 3. Create profile entry

      return { error: null, data: authData };
    } catch (err: any) {
      console.error("Sign up error:", err);
      return { error: err };
    }
  };

  const signOut = async () => {
    setCustomer(null);
    await authSignOut();
  };

  const resetPassword = async (email: string) => {
    try {
      // Use Supabase Auth password reset
      const redirectUrl = `${window.location.origin}/customer/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        console.error("Password reset error:", error);
        return { error };
      }

      return { error: null };
    } catch (err) {
      console.error("Unexpected password reset error:", err);
      return { error: err as Error };
    }
  };

  const resendConfirmationEmail = async (email: string) => {
    try {
      // Resend confirmation email using Supabase Auth
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/customer/confirm`,
        },
      });

      if (error) {
        console.error("Resend confirmation email error:", error);
        return { error };
      }

      return { error: null };
    } catch (err) {
      console.error("Unexpected resend confirmation email error:", err);
      return { error: err as Error };
    }
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        resendConfirmationEmail,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
};

export const useCustomerAuth = () => {
  const context = useContext(CustomerAuthContext);
  if (context === undefined) {
    throw new Error("useCustomerAuth must be used within a CustomerAuthProvider");
  }
  return context;
};

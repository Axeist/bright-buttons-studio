import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  loyalty_points?: number;
  loyalty_tier?: string;
}

interface CustomerAuthContextType {
  customer: Customer | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<{ error: any | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any | null }>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

const CUSTOMER_SESSION_KEY = "customer_session";

export const CustomerAuthProvider = ({ children }: { children: ReactNode }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  // Load customer session from localStorage on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const sessionData = localStorage.getItem(CUSTOMER_SESSION_KEY);
        if (sessionData) {
          const { customerId } = JSON.parse(sessionData);
          if (customerId) {
            await fetchCustomer(customerId);
          }
        }
      } catch (error) {
        console.error("Error loading customer session:", error);
        localStorage.removeItem(CUSTOMER_SESSION_KEY);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, []);

  const fetchCustomer = async (customerId: string) => {
    try {
      // Use SECURITY DEFINER function to bypass RLS
      const { data, error } = await supabase.rpc("get_customer_by_id", {
        _customer_id: customerId,
      });

      if (error) throw error;
      if (data && data.length > 0) {
        setCustomer(data[0] as Customer);
      }
    } catch (error) {
      console.error("Error fetching customer:", error);
      setCustomer(null);
      localStorage.removeItem(CUSTOMER_SESSION_KEY);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Use the database function to verify password
      const { data, error } = await supabase.rpc("verify_customer_password", {
        _email: email,
        _password: password,
      });

      if (error) {
        console.error("Sign in error:", error);
        return { error };
      }

      if (!data || data.length === 0) {
        return { error: { message: "Invalid email or password" } };
      }

      const { customer_id } = data[0];

      // Fetch customer details
      await fetchCustomer(customer_id);

      // Store session in localStorage
      localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify({ customerId: customer_id }));

      return { error: null };
    } catch (err) {
      console.error("Unexpected sign in error:", err);
      return { error: err as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phone: string) => {
    try {
      // Check if customer already exists with this email or phone using SECURITY DEFINER function
      const { data: existingCustomer, error: checkError } = await supabase.rpc("check_customer_exists", {
        _email: email,
        _phone: phone,
      });

      if (checkError) {
        console.error("Error checking customer existence:", checkError);
        // Continue with signup if check fails (might be a transient error)
      } else if (existingCustomer && existingCustomer.length > 0) {
        return { error: { message: "A customer with this email or phone already exists" } };
      }

      // Check if email is already in customer_auth
      const { data: existingAuth } = await supabase
        .from("customer_auth")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (existingAuth) {
        return { error: { message: "An account with this email already exists" } };
      }

      // Create customer record
      const { data: newCustomer, error: customerError } = await supabase
        .from("customers")
        .insert({
          name: fullName,
          phone: phone,
          email: email,
          customer_type: "new",
        })
        .select("id")
        .single();

      if (customerError) throw customerError;

      // Create customer auth record
      const { error: authError } = await supabase.rpc("create_customer_auth", {
        _customer_id: newCustomer.id,
        _email: email,
        _password: password,
      });

      if (authError) {
        // Rollback customer creation
        await supabase.from("customers").delete().eq("id", newCustomer.id);
        throw authError;
      }

      // Auto-login after signup
      await fetchCustomer(newCustomer.id);
      localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify({ customerId: newCustomer.id }));

      return { error: null };
    } catch (err: any) {
      console.error("Sign up error:", err);
      return { error: err };
    }
  };

  const signOut = async () => {
    setCustomer(null);
    localStorage.removeItem(CUSTOMER_SESSION_KEY);
  };

  const resetPassword = async (email: string) => {
    try {
      // Generate reset token
      const { data: resetToken, error } = await supabase.rpc("generate_password_reset_token", {
        _email: email,
      });

      if (error) {
        console.error("Password reset error:", error);
        return { error };
      }

      // In a real app, you would send an email with the reset token
      // For now, we'll just return success
      // TODO: Implement email sending service
      console.log("Password reset token generated:", resetToken);

      return { error: null };
    } catch (err) {
      console.error("Unexpected password reset error:", err);
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

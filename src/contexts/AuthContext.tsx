
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AdminProfile {
  id: string;
  user_id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  adminProfile: AdminProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch admin profile when user signs in
        if (session?.user) {
          setTimeout(async () => {
            try {
              const { data: profile } = await supabase
                .from('admin_profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .maybeSingle();
              
              if (profile) {
                setAdminProfile(profile);
              } else {
                // If no profile exists, create one (for existing users)
                const name = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Admin User';
                
                const { data } = await supabase.functions.invoke('create-admin-profile', {
                  body: {
                    user_id: session.user.id,
                    email: session.user.email,
                    name: name,
                    role: 'operations_staff'
                  }
                });
                
                if (data?.data) {
                  setAdminProfile(data.data);
                }
              }
            } catch (error) {
              console.error('Error fetching/creating admin profile:', error);
              setAdminProfile(null);
            }
          }, 0);
        } else {
          setAdminProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, name: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name: name
        }
      }
    });

    // If signup successful and user is immediately confirmed, create profile
    if (!error && data.user && !data.user.email_confirmed_at) {
      // User needs to confirm email - profile will be created on first login
    }
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    adminProfile,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

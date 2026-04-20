import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";

export type UserRole = "student" | "faculty" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  branch?: string;
  registrationId?: string;
}

export interface LoginDetails {
  name?: string;
  branch?: string;
  registrationId?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role?: UserRole) => Promise<void>;
  signup: (email: string, password: string, role: UserRole, details: LoginDetails) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USERS: Record<UserRole, User> = {
  student: {
    id: "s-001",
    name: "Alex Johnson",
    email: "alex@university.edu",
    role: "student",
  },
  faculty: {
    id: "f-001",
    name: "Dr. Sarah Chen",
    email: "sarah.chen@university.edu",
    role: "faculty",
  },
  admin: {
    id: "a-001",
    name: "Admin User",
    email: "admin@university.edu",
    role: "admin",
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const meta = session.user.user_metadata;
        setUser({
          id: session.user.id,
          email: session.user.email!,
          role: (meta.role as UserRole) || "student",
          name: meta.full_name || "Unknown",
          branch: meta.branch,
          registrationId: meta.registration_id,
        });
      }
      setSessionLoaded(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const meta = session.user.user_metadata;
        setUser({
          id: session.user.id,
          email: session.user.email!,
          role: (meta.role as UserRole) || "student",
          name: meta.full_name || "Unknown",
          branch: meta.branch,
          registrationId: meta.registration_id,
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string, role?: UserRole) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    if (role && data.user) {
      const userRole = data.user.user_metadata?.role;
      if (userRole && userRole !== role) {
        await supabase.auth.signOut();
        throw new Error(`Invalid credentials for ${role} role.`);
      }
    }
  };

  const signup = async (email: string, password: string, role: UserRole, details: LoginDetails) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          full_name: details.name,
          branch: details.branch,
          registration_id: details.registrationId,
        }
      }
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  if (!sessionLoaded) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-foreground"><div className="animate-pulse">Loading auth session...</div></div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

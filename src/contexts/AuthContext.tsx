"use client";

import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import QRCode from "qrcode";
import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/supabase/types";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (payload: { name: string; email: string; password: string; phone?: string | null }) => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const supabase = createClient();

async function getRole(userId: string): Promise<UserRole | null> {
  const { data, error } = await supabase.from("users").select("role").eq("id", userId).maybeSingle();

  if (error) {
    return null;
  }

  return ((data as { role?: UserRole } | null)?.role ?? null) as UserRole | null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshAuth = useCallback(async () => {
    const {
      data: { session: currentSession }
    } = await supabase.auth.getSession();

    setSession(currentSession);
    setUser(currentSession?.user ?? null);

    if (currentSession?.user) {
      const userRole = await getRole(currentSession.user.id);
      setRole(userRole);
    } else {
      setRole(null);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void refreshAuth();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        void getRole(nextSession.user.id).then((nextRole) => {
          setRole(nextRole);
          setLoading(false);
        });
      } else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshAuth]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        throw error;
      }

      await refreshAuth();
    },
    [refreshAuth]
  );

  const signUp = useCallback(
    async (payload: { name: string; email: string; password: string; phone?: string | null }) => {
      const { name, email, password, phone } = payload;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone: phone ?? null
          }
        }
      });

      if (error) {
        throw error;
      }

      const authUser = data.user;

      if (!authUser) {
        throw new Error("Impossible de créer l'utilisateur.");
      }

      const qrCode = await QRCode.toDataURL(authUser.id);

      const { error: userInsertError } = await (supabase.from("users") as any).upsert({
        id: authUser.id,
        email,
        name,
        phone: phone ?? null,
        role: "member",
        qr_code: qrCode
      });

      if (userInsertError) {
        throw userInsertError;
      }

      await refreshAuth();
    },
    [refreshAuth]
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    setUser(null);
    setSession(null);
    setRole(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      role,
      loading,
      signIn,
      signUp,
      signOut
    }),
    [loading, role, session, signIn, signOut, signUp, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

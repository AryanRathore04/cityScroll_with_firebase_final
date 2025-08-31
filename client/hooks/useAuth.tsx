import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import { authService, UserProfile } from "../services/auth";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<UserProfile>;
  signUp: (userData: any) => Promise<UserProfile>;
  signInWithGoogle: () => Promise<UserProfile>;
  signInWithFacebook: () => Promise<UserProfile>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Get user profile from Firestore
        try {
          const profile = await authService.getCurrentUserProfile();
          setUserProfile(profile);
        } catch (error) {
          console.error("Error getting user profile:", error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (
    email: string,
    password: string,
  ): Promise<UserProfile> => {
    const profile = await authService.signIn(email, password);
    setUserProfile(profile);
    return profile;
  };

  const signUp = async (userData: any): Promise<UserProfile> => {
    const profile = await authService.signUp(userData);
    setUserProfile(profile);
    return profile;
  };

  const signInWithGoogle = async (): Promise<UserProfile> => {
    const profile = await authService.signInWithGoogle();
    setUserProfile(profile);
    return profile;
  };

  const signInWithFacebook = async (): Promise<UserProfile> => {
    const profile = await authService.signInWithFacebook();
    setUserProfile(profile);
    return profile;
  };

  const signOut = async (): Promise<void> => {
    await authService.signOutUser();
    setUser(null);
    setUserProfile(null);
  };

  const resetPassword = async (email: string): Promise<void> => {
    await authService.resetPassword(email);
  };

  const updateProfile = async (
    updates: Partial<UserProfile>,
  ): Promise<void> => {
    if (!user) throw new Error("No user logged in");

    await authService.updateUserProfile(user.uid, updates);
    setUserProfile((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithFacebook,
    signOut,
    resetPassword,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

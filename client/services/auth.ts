// @ts-nocheck
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  FacebookAuthProvider,
} from "firebase/auth";
import { doc, setDoc, getDoc, collection, addDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  userType: "customer" | "vendor";
  createdAt: Date;
  updatedAt: Date;
  // Vendor specific fields
  businessName?: string;
  businessType?: string;
  businessAddress?: string;
  city?: string;
  description?: string;
  verified?: boolean;
  rating?: number;
  totalBookings?: number;
}

class AuthService {
  // Sign up with email and password
  async signUp(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    userType: "customer" | "vendor";
    businessName?: string;
    businessType?: string;
    businessAddress?: string;
    city?: string;
    description?: string;
  }): Promise<UserProfile> {
    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password,
      );

      const user = userCredential.user;

      // Update display name
      await updateProfile(user, {
        displayName: `${userData.firstName} ${userData.lastName}`,
      });

      // Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: user.uid,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        userType: userData.userType,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...(userData.userType === "vendor" && {
          businessName: userData.businessName,
          businessType: userData.businessType,
          businessAddress: userData.businessAddress,
          city: userData.city,
          description: userData.description,
          verified: false,
          rating: 0,
          totalBookings: 0,
        }),
      };

      await setDoc(doc(db, "users", user.uid), userProfile);

      return userProfile;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<UserProfile> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      // Get user profile from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        throw new Error("User profile not found");
      }

      return userDoc.data() as UserProfile;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Sign in with Google
  async signInWithGoogle(): Promise<UserProfile> {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Check if user profile exists
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists()) {
        // Create new user profile for Google sign-in
        const userProfile: UserProfile = {
          uid: user.uid,
          email: user.email || "",
          firstName: user.displayName?.split(" ")[0] || "",
          lastName: user.displayName?.split(" ")[1] || "",
          phone: user.phoneNumber || "",
          userType: "customer",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await setDoc(doc(db, "users", user.uid), userProfile);
        return userProfile;
      }

      return userDoc.data() as UserProfile;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Sign in with Facebook
  async signInWithFacebook(): Promise<UserProfile> {
    try {
      const provider = new FacebookAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Check if user profile exists
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists()) {
        // Create new user profile for Facebook sign-in
        const userProfile: UserProfile = {
          uid: user.uid,
          email: user.email || "",
          firstName: user.displayName?.split(" ")[0] || "",
          lastName: user.displayName?.split(" ")[1] || "",
          phone: user.phoneNumber || "",
          userType: "customer",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await setDoc(doc(db, "users", user.uid), userProfile);
        return userProfile;
      }

      return userDoc.data() as UserProfile;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Sign out
  async signOutUser(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Reset password
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Get current user profile
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    const user = auth.currentUser;
    if (!user) return null;

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) return null;

      return userDoc.data() as UserProfile;
    } catch (error) {
      console.error("Error getting user profile:", error);
      return null;
    }
  }

  // Update user profile
  async updateUserProfile(
    uid: string,
    updates: Partial<UserProfile>,
  ): Promise<void> {
    try {
      await setDoc(
        doc(db, "users", uid),
        {
          ...updates,
          updatedAt: new Date(),
        },
        { merge: true },
      );
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}

export const authService = new AuthService();

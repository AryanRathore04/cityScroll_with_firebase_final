// @ts-nocheck
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Subscription, PremiumListing, Vendor } from "../types/platform";

export class SubscriptionService {
  private static readonly ANNUAL_SUBSCRIPTION_FEE = 5000; // ₹5,000
  private static readonly PREMIUM_LISTING_PLANS = {
    featured: {
      price: 2000,
      duration: 30,
      benefits: ["Featured in search results", "Priority listing"],
    },
    spotlight: {
      price: 3500,
      duration: 30,
      benefits: ["Spotlight banner", "Featured in search", "Premium badge"],
    },
    premium: {
      price: 5000,
      duration: 30,
      benefits: [
        "Top placement",
        "Spotlight banner",
        "Premium badge",
        "Priority support",
      ],
    },
  };

  /**
   * Create vendor subscription
   */
  static async createSubscription(
    vendorId: string,
    plan: "basic" | "premium" | "enterprise" = "basic",
  ): Promise<string> {
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1); // One year from now

      const subscription: Omit<Subscription, "id"> = {
        vendorId,
        plan,
        amount: this.ANNUAL_SUBSCRIPTION_FEE,
        startDate: Timestamp.fromDate(startDate) as any,
        endDate: Timestamp.fromDate(endDate) as any,
        status: "active",
        paymentStatus: "pending",
        autoRenewal: true,
        createdAt: Timestamp.now() as any,
      };

      const docRef = await addDoc(
        collection(db, "subscriptions"),
        subscription,
      );

      // Update vendor subscription status
      await updateDoc(doc(db, "vendors", vendorId), {
        subscriptionStatus: "active",
        subscriptionExpiry: Timestamp.fromDate(endDate),
        updatedAt: Timestamp.now(),
      });

      return docRef.id;
    } catch (error) {
      console.error("Error creating subscription:", error);
      throw error;
    }
  }

  /**
   * Renew vendor subscription
   */
  static async renewSubscription(subscriptionId: string): Promise<void> {
    try {
      const subscriptionRef = doc(db, "subscriptions", subscriptionId);
      const subscriptionDoc = await getDoc(subscriptionRef);

      if (!subscriptionDoc.exists()) {
        throw new Error("Subscription not found");
      }

      const subscription = subscriptionDoc.data() as Subscription;
      const newEndDate = new Date(subscription.endDate.toDate());
      newEndDate.setFullYear(newEndDate.getFullYear() + 1);

      await updateDoc(subscriptionRef, {
        endDate: Timestamp.fromDate(newEndDate),
        status: "active",
        paymentStatus: "pending",
        renewedAt: Timestamp.now(),
      });

      // Update vendor subscription status
      await updateDoc(doc(db, "vendors", subscription.vendorId), {
        subscriptionStatus: "active",
        subscriptionExpiry: Timestamp.fromDate(newEndDate),
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error renewing subscription:", error);
      throw error;
    }
  }

  /**
   * Cancel vendor subscription
   */
  static async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      const subscriptionRef = doc(db, "subscriptions", subscriptionId);
      const subscriptionDoc = await getDoc(subscriptionRef);

      if (!subscriptionDoc.exists()) {
        throw new Error("Subscription not found");
      }

      const subscription = subscriptionDoc.data() as Subscription;

      await updateDoc(subscriptionRef, {
        status: "cancelled",
        autoRenewal: false,
      });

      // Update vendor subscription status
      await updateDoc(doc(db, "vendors", subscription.vendorId), {
        subscriptionStatus: "cancelled",
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      throw error;
    }
  }

  /**
   * Check and update expired subscriptions
   */
  static async checkExpiredSubscriptions(): Promise<void> {
    try {
      const now = Timestamp.now();
      const subscriptionsRef = collection(db, "subscriptions");
      const q = query(
        subscriptionsRef,
        where("status", "==", "active"),
        where("endDate", "<", now),
      );

      const snapshot = await getDocs(q);

      for (const docSnapshot of snapshot.docs) {
        const subscription = docSnapshot.data() as Subscription;

        // Update subscription status
        await updateDoc(doc(db, "subscriptions", docSnapshot.id), {
          status: "expired",
        });

        // Update vendor subscription status
        await updateDoc(doc(db, "vendors", subscription.vendorId), {
          subscriptionStatus: "expired",
          updatedAt: Timestamp.now(),
        });

        console.log(
          `Subscription expired for vendor: ${subscription.vendorId}`,
        );
      }
    } catch (error) {
      console.error("Error checking expired subscriptions:", error);
      throw error;
    }
  }

  /**
   * Create premium listing
   */
  static async createPremiumListing(
    vendorId: string,
    plan: "featured" | "spotlight" | "premium",
  ): Promise<string> {
    try {
      const planDetails = this.PREMIUM_LISTING_PLANS[plan];
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + planDetails.duration);

      const premiumListing: Omit<PremiumListing, "id"> = {
        vendorId,
        plan,
        amount: planDetails.price,
        startDate: Timestamp.fromDate(startDate) as any,
        endDate: Timestamp.fromDate(endDate) as any,
        status: "active",
        paymentStatus: "pending",
        benefits: planDetails.benefits,
        createdAt: Timestamp.now() as any,
      };

      const docRef = await addDoc(
        collection(db, "premiumListings"),
        premiumListing,
      );

      // Update vendor premium status
      await updateDoc(doc(db, "vendors", vendorId), {
        isPremium: true,
        premiumExpiry: Timestamp.fromDate(endDate),
        updatedAt: Timestamp.now(),
      });

      return docRef.id;
    } catch (error) {
      console.error("Error creating premium listing:", error);
      throw error;
    }
  }

  /**
   * Check and update expired premium listings
   */
  static async checkExpiredPremiumListings(): Promise<void> {
    try {
      const now = Timestamp.now();
      const premiumListingsRef = collection(db, "premiumListings");
      const q = query(
        premiumListingsRef,
        where("status", "==", "active"),
        where("endDate", "<", now),
      );

      const snapshot = await getDocs(q);

      for (const docSnapshot of snapshot.docs) {
        const listing = docSnapshot.data() as PremiumListing;

        // Update premium listing status
        await updateDoc(doc(db, "premiumListings", docSnapshot.id), {
          status: "expired",
        });

        // Update vendor premium status
        await updateDoc(doc(db, "vendors", listing.vendorId), {
          isPremium: false,
          premiumExpiry: null,
          updatedAt: Timestamp.now(),
        });

        console.log(`Premium listing expired for vendor: ${listing.vendorId}`);
      }
    } catch (error) {
      console.error("Error checking expired premium listings:", error);
      throw error;
    }
  }

  /**
   * Get vendor subscriptions
   */
  static async getVendorSubscriptions(vendorId: string) {
    try {
      const subscriptionsRef = collection(db, "subscriptions");
      const q = query(
        subscriptionsRef,
        where("vendorId", "==", vendorId),
        orderBy("createdAt", "desc"),
      );

      const snapshot = await getDocs(q);
      const subscriptions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Subscription[];

      return subscriptions;
    } catch (error) {
      console.error("Error getting vendor subscriptions:", error);
      throw error;
    }
  }

  /**
   * Get vendor premium listings
   */
  static async getVendorPremiumListings(vendorId: string) {
    try {
      const premiumListingsRef = collection(db, "premiumListings");
      const q = query(
        premiumListingsRef,
        where("vendorId", "==", vendorId),
        orderBy("createdAt", "desc"),
      );

      const snapshot = await getDocs(q);
      const listings = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PremiumListing[];

      return listings;
    } catch (error) {
      console.error("Error getting vendor premium listings:", error);
      throw error;
    }
  }

  /**
   * Get subscription revenue summary
   */
  static async getSubscriptionRevenue(startDate?: Date, endDate?: Date) {
    try {
      let subscriptionQuery = query(
        collection(db, "subscriptions"),
        where("paymentStatus", "==", "paid"),
        orderBy("createdAt", "desc"),
      );

      let premiumQuery = query(
        collection(db, "premiumListings"),
        where("paymentStatus", "==", "paid"),
        orderBy("createdAt", "desc"),
      );

      if (startDate) {
        subscriptionQuery = query(
          subscriptionQuery,
          where("createdAt", ">=", Timestamp.fromDate(startDate)),
        );
        premiumQuery = query(
          premiumQuery,
          where("createdAt", ">=", Timestamp.fromDate(startDate)),
        );
      }

      if (endDate) {
        subscriptionQuery = query(
          subscriptionQuery,
          where("createdAt", "<=", Timestamp.fromDate(endDate)),
        );
        premiumQuery = query(
          premiumQuery,
          where("createdAt", "<=", Timestamp.fromDate(endDate)),
        );
      }

      const [subscriptionSnapshot, premiumSnapshot] = await Promise.all([
        getDocs(subscriptionQuery),
        getDocs(premiumQuery),
      ]);

      const subscriptions = subscriptionSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Subscription[];

      const premiumListings = premiumSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PremiumListing[];

      const subscriptionRevenue = subscriptions.reduce(
        (sum, sub) => sum + sub.amount,
        0,
      );
      const premiumRevenue = premiumListings.reduce(
        (sum, listing) => sum + listing.amount,
        0,
      );

      return {
        totalRevenue: subscriptionRevenue + premiumRevenue,
        subscriptionRevenue,
        premiumRevenue,
        totalSubscriptions: subscriptions.length,
        totalPremiumListings: premiumListings.length,
        subscriptions,
        premiumListings,
      };
    } catch (error) {
      console.error("Error getting subscription revenue:", error);
      throw error;
    }
  }
}

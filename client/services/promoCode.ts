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
  increment,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { PromoCode, User } from "../types/platform";

export class PromoCodeService {
  /**
   * Create a new promo code
   */
  static async createPromoCode(
    promoData: Omit<PromoCode, "id" | "usedCount" | "createdAt">,
  ): Promise<string> {
    try {
      const promoCode: Omit<PromoCode, "id"> = {
        ...promoData,
        usedCount: 0,
        createdAt: Timestamp.now() as any,
      };

      const docRef = await addDoc(collection(db, "promoCodes"), promoCode);
      return docRef.id;
    } catch (error) {
      console.error("Error creating promo code:", error);
      throw error;
    }
  }

  /**
   * Validate and apply promo code
   */
  static async validateAndApplyPromoCode(
    code: string,
    customerId: string,
    orderValue: number,
    serviceIds: string[],
    vendorId: string,
  ): Promise<{
    isValid: boolean;
    discount: number;
    message: string;
    promoCodeId?: string;
  }> {
    try {
      // Find promo code
      const promoCodesRef = collection(db, "promoCodes");
      const q = query(
        promoCodesRef,
        where("code", "==", code.toUpperCase()),
        where("isActive", "==", true),
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return {
          isValid: false,
          discount: 0,
          message: "Invalid promo code",
        };
      }

      const promoDoc = snapshot.docs[0];
      const promo = { id: promoDoc.id, ...promoDoc.data() } as PromoCode;
      const now = new Date();

      // Check if promo code is expired
      if (promo.endDate.toDate() < now) {
        return {
          isValid: false,
          discount: 0,
          message: "Promo code has expired",
        };
      }

      if (promo.startDate.toDate() > now) {
        return {
          isValid: false,
          discount: 0,
          message: "Promo code is not yet active",
        };
      }

      // Check usage limits
      if (promo.usedCount >= promo.usageLimit) {
        return {
          isValid: false,
          discount: 0,
          message: "Promo code usage limit exceeded",
        };
      }

      // Check user usage limit
      const userUsageCount = await this.getUserPromoUsageCount(
        customerId,
        promo.id,
      );
      if (userUsageCount >= promo.userLimit) {
        return {
          isValid: false,
          discount: 0,
          message: "You have already used this promo code",
        };
      }

      // Check minimum order value
      if (orderValue < promo.minOrderValue) {
        return {
          isValid: false,
          discount: 0,
          message: `Minimum order value of ₹${promo.minOrderValue} required`,
        };
      }

      // Check if promo is for first-time users only
      if (promo.type === "first_time") {
        const user = await this.getUser(customerId);
        if (!user?.isFirstTimeUser) {
          return {
            isValid: false,
            discount: 0,
            message: "This promo code is only for first-time users",
          };
        }
      }

      // Check applicable services
      if (
        promo.applicableServices.length > 0 &&
        !serviceIds.some((id) => promo.applicableServices.includes(id))
      ) {
        return {
          isValid: false,
          discount: 0,
          message: "Promo code not applicable for selected services",
        };
      }

      // Check applicable vendors
      if (
        promo.applicableVendors.length > 0 &&
        !promo.applicableVendors.includes(vendorId)
      ) {
        return {
          isValid: false,
          discount: 0,
          message: "Promo code not applicable for this vendor",
        };
      }

      // Calculate discount
      let discount = 0;
      if (promo.type === "percentage") {
        discount = (orderValue * promo.value) / 100;
        if (promo.maxDiscount && discount > promo.maxDiscount) {
          discount = promo.maxDiscount;
        }
      } else if (promo.type === "fixed" || promo.type === "first_time") {
        discount = Math.min(promo.value, orderValue);
      }

      return {
        isValid: true,
        discount: Math.round(discount),
        message: `Promo code applied! You saved ₹${Math.round(discount)}`,
        promoCodeId: promo.id,
      };
    } catch (error) {
      console.error("Error validating promo code:", error);
      return {
        isValid: false,
        discount: 0,
        message: "Error validating promo code",
      };
    }
  }

  /**
   * Apply promo code to a booking
   */
  static async applyPromoCodeToBooking(
    promoCodeId: string,
    customerId: string,
    bookingId: string,
  ): Promise<void> {
    try {
      // Increment usage count
      await updateDoc(doc(db, "promoCodes", promoCodeId), {
        usedCount: increment(1),
      });

      // Record promo usage
      await addDoc(collection(db, "promoUsage"), {
        promoCodeId,
        customerId,
        bookingId,
        usedAt: Timestamp.now(),
      });

      console.log(`Promo code ${promoCodeId} applied to booking ${bookingId}`);
    } catch (error) {
      console.error("Error applying promo code:", error);
      throw error;
    }
  }

  /**
   * Get user promo usage count
   */
  private static async getUserPromoUsageCount(
    customerId: string,
    promoCodeId: string,
  ): Promise<number> {
    try {
      const usageQuery = query(
        collection(db, "promoUsage"),
        where("customerId", "==", customerId),
        where("promoCodeId", "==", promoCodeId),
      );

      const snapshot = await getDocs(usageQuery);
      return snapshot.size;
    } catch (error) {
      console.error("Error getting user promo usage:", error);
      return 0;
    }
  }

  /**
   * Get user details
   */
  private static async getUser(customerId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, "users", customerId));
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() } as User;
      }
      return null;
    } catch (error) {
      console.error("Error getting user:", error);
      return null;
    }
  }

  /**
   * Create first-time user discount
   */
  static async createFirstTimeUserDiscount(): Promise<string> {
    try {
      const promoCode: Omit<PromoCode, "id" | "usedCount" | "createdAt"> = {
        code: "WELCOME200",
        type: "first_time",
        value: 200,
        minOrderValue: 500,
        usageLimit: 10000, // High limit for first-time discount
        userLimit: 1,
        isActive: true,
        startDate: Timestamp.now() as any,
        endDate: Timestamp.fromDate(
          new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        ) as any, // 1 year validity
        applicableServices: [],
        applicableVendors: [],
        createdBy: "system",
      };

      return await this.createPromoCode(promoCode);
    } catch (error) {
      console.error("Error creating first-time user discount:", error);
      throw error;
    }
  }

  /**
   * Get active promo codes
   */
  static async getActivePromoCodes(): Promise<PromoCode[]> {
    try {
      const now = Timestamp.now();
      const promoCodesRef = collection(db, "promoCodes");
      const q = query(
        promoCodesRef,
        where("isActive", "==", true),
        where("startDate", "<=", now),
        where("endDate", ">", now),
        orderBy("startDate", "desc"),
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PromoCode[];
    } catch (error) {
      console.error("Error getting active promo codes:", error);
      throw error;
    }
  }

  /**
   * Deactivate promo code
   */
  static async deactivatePromoCode(promoCodeId: string): Promise<void> {
    try {
      await updateDoc(doc(db, "promoCodes", promoCodeId), {
        isActive: false,
      });
    } catch (error) {
      console.error("Error deactivating promo code:", error);
      throw error;
    }
  }

  /**
   * Get promo code analytics
   */
  static async getPromoCodeAnalytics(promoCodeId: string) {
    try {
      const promoDoc = await getDoc(doc(db, "promoCodes", promoCodeId));
      if (!promoDoc.exists()) {
        throw new Error("Promo code not found");
      }

      const promo = { id: promoDoc.id, ...promoDoc.data() } as PromoCode;

      // Get usage details
      const usageQuery = query(
        collection(db, "promoUsage"),
        where("promoCodeId", "==", promoCodeId),
        orderBy("usedAt", "desc"),
      );

      const usageSnapshot = await getDocs(usageQuery);
      const usageDetails = usageSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return {
        promo,
        totalUsage: promo.usedCount,
        remainingUsage: promo.usageLimit - promo.usedCount,
        usageRate: (promo.usedCount / promo.usageLimit) * 100,
        usageDetails,
      };
    } catch (error) {
      console.error("Error getting promo code analytics:", error);
      throw error;
    }
  }
}

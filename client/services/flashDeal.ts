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
  limit,
  increment,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { FlashDeal, Vendor } from "../types/platform";

export class FlashDealService {
  /**
   * Create a new flash deal
   */
  static async createFlashDeal(
    dealData: Omit<FlashDeal, "id" | "bookedSlots" | "createdAt">,
  ): Promise<string> {
    try {
      // Validate deal data
      if (dealData.startTime >= dealData.endTime) {
        throw new Error("End time must be after start time");
      }

      if (dealData.discountedPrice >= dealData.originalPrice) {
        throw new Error("Discounted price must be less than original price");
      }

      const discountPercentage = Math.round(
        ((dealData.originalPrice - dealData.discountedPrice) /
          dealData.originalPrice) *
          100,
      );

      const flashDeal: Omit<FlashDeal, "id"> = {
        ...dealData,
        discountPercentage,
        bookedSlots: 0,
        createdAt: Timestamp.now() as any,
      };

      const docRef = await addDoc(collection(db, "flashDeals"), flashDeal);
      console.log(`Flash deal created with ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error("Error creating flash deal:", error);
      throw error;
    }
  }

  /**
   * Get active flash deals
   */
  static async getActiveFlashDeals(vendorId?: string): Promise<FlashDeal[]> {
    try {
      const now = Timestamp.now();
      let q = query(
        collection(db, "flashDeals"),
        where("isActive", "==", true),
        where("startTime", "<=", now),
        where("endTime", ">", now),
        orderBy("startTime", "asc"),
      );

      if (vendorId) {
        q = query(q, where("vendorId", "==", vendorId));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as FlashDeal[];
    } catch (error) {
      console.error("Error getting active flash deals:", error);
      throw error;
    }
  }

  /**
   * Get upcoming flash deals
   */
  static async getUpcomingFlashDeals(vendorId?: string): Promise<FlashDeal[]> {
    try {
      const now = Timestamp.now();
      let q = query(
        collection(db, "flashDeals"),
        where("isActive", "==", true),
        where("startTime", ">", now),
        orderBy("startTime", "asc"),
        limit(10),
      );

      if (vendorId) {
        q = query(q, where("vendorId", "==", vendorId));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as FlashDeal[];
    } catch (error) {
      console.error("Error getting upcoming flash deals:", error);
      throw error;
    }
  }

  /**
   * Book a flash deal slot
   */
  static async bookFlashDeal(
    dealId: string,
    customerId: string,
  ): Promise<{ success: boolean; message: string; bookingId?: string }> {
    try {
      const dealRef = doc(db, "flashDeals", dealId);
      const dealDoc = await getDoc(dealRef);

      if (!dealDoc.exists()) {
        return { success: false, message: "Flash deal not found" };
      }

      const deal = { id: dealDoc.id, ...dealDoc.data() } as FlashDeal;
      const now = new Date();

      // Check if deal is active
      if (!deal.isActive) {
        return { success: false, message: "Flash deal is not active" };
      }

      // Check if deal is within time range
      if (deal.startTime.toDate() > now) {
        return { success: false, message: "Flash deal has not started yet" };
      }

      if (deal.endTime.toDate() <= now) {
        return { success: false, message: "Flash deal has expired" };
      }

      // Check if slots are available
      if (deal.bookedSlots >= deal.totalSlots) {
        return { success: false, message: "All slots are booked" };
      }

      // Check if customer has already booked this deal
      const existingBookingQuery = query(
        collection(db, "flashDealBookings"),
        where("dealId", "==", dealId),
        where("customerId", "==", customerId),
      );

      const existingSnapshot = await getDocs(existingBookingQuery);
      if (!existingSnapshot.empty) {
        return {
          success: false,
          message: "You have already booked this flash deal",
        };
      }

      // Create booking record
      const bookingData = {
        dealId,
        customerId,
        vendorId: deal.vendorId,
        serviceId: deal.serviceId,
        originalPrice: deal.originalPrice,
        discountedPrice: deal.discountedPrice,
        savings: deal.originalPrice - deal.discountedPrice,
        bookedAt: Timestamp.now(),
        status: "booked",
        expiresAt: deal.endTime,
      };

      const bookingRef = await addDoc(
        collection(db, "flashDealBookings"),
        bookingData,
      );

      // Increment booked slots
      await updateDoc(dealRef, {
        bookedSlots: increment(1),
      });

      return {
        success: true,
        message: "Flash deal booked successfully!",
        bookingId: bookingRef.id,
      };
    } catch (error) {
      console.error("Error booking flash deal:", error);
      return { success: false, message: "Error booking flash deal" };
    }
  }

  /**
   * Get customer's flash deal bookings
   */
  static async getCustomerFlashDealBookings(customerId: string) {
    try {
      const bookingsQuery = query(
        collection(db, "flashDealBookings"),
        where("customerId", "==", customerId),
        orderBy("bookedAt", "desc"),
      );

      const snapshot = await getDocs(bookingsQuery);
      const bookings = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Enrich with deal and vendor details
      const enrichedBookings = await Promise.all(
        bookings.map(async (booking) => {
          const [dealDoc, vendorDoc] = await Promise.all([
            getDoc(doc(db, "flashDeals", booking.dealId)),
            getDoc(doc(db, "vendors", booking.vendorId)),
          ]);

          return {
            ...booking,
            deal: dealDoc.exists()
              ? { id: dealDoc.id, ...dealDoc.data() }
              : null,
            vendor: vendorDoc.exists()
              ? { id: vendorDoc.id, ...vendorDoc.data() }
              : null,
          };
        }),
      );

      return enrichedBookings;
    } catch (error) {
      console.error("Error getting customer flash deal bookings:", error);
      throw error;
    }
  }

  /**
   * Redeem flash deal booking
   */
  static async redeemFlashDealBooking(
    bookingId: string,
    vendorId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const bookingRef = doc(db, "flashDealBookings", bookingId);
      const bookingDoc = await getDoc(bookingRef);

      if (!bookingDoc.exists()) {
        return { success: false, message: "Booking not found" };
      }

      const booking = bookingDoc.data();

      if (booking.vendorId !== vendorId) {
        return { success: false, message: "Unauthorized" };
      }

      if (booking.status === "redeemed") {
        return { success: false, message: "Already redeemed" };
      }

      if (booking.status === "expired") {
        return { success: false, message: "Booking has expired" };
      }

      const now = new Date();
      if (booking.expiresAt.toDate() <= now) {
        await updateDoc(bookingRef, {
          status: "expired",
        });
        return { success: false, message: "Booking has expired" };
      }

      // Mark as redeemed
      await updateDoc(bookingRef, {
        status: "redeemed",
        redeemedAt: Timestamp.now(),
      });

      return { success: true, message: "Flash deal redeemed successfully!" };
    } catch (error) {
      console.error("Error redeeming flash deal:", error);
      return { success: false, message: "Error redeeming flash deal" };
    }
  }

  /**
   * Expire old flash deals
   */
  static async expireOldFlashDeals(): Promise<void> {
    try {
      const now = Timestamp.now();
      const expiredDealsQuery = query(
        collection(db, "flashDeals"),
        where("isActive", "==", true),
        where("endTime", "<=", now),
      );

      const snapshot = await getDocs(expiredDealsQuery);

      const updatePromises = snapshot.docs.map((doc) =>
        updateDoc(doc.ref, { isActive: false }),
      );

      await Promise.all(updatePromises);

      // Also expire bookings
      const expiredBookingsQuery = query(
        collection(db, "flashDealBookings"),
        where("status", "==", "booked"),
        where("expiresAt", "<=", now),
      );

      const bookingsSnapshot = await getDocs(expiredBookingsQuery);
      const bookingUpdatePromises = bookingsSnapshot.docs.map((doc) =>
        updateDoc(doc.ref, { status: "expired" }),
      );

      await Promise.all(bookingUpdatePromises);

      console.log(
        `Expired ${snapshot.size} flash deals and ${bookingsSnapshot.size} bookings`,
      );
    } catch (error) {
      console.error("Error expiring old flash deals:", error);
      throw error;
    }
  }

  /**
   * Get flash deal analytics
   */
  static async getFlashDealAnalytics(dealId?: string, vendorId?: string) {
    try {
      let dealsQuery = query(
        collection(db, "flashDeals"),
        orderBy("createdAt", "desc"),
      );

      if (dealId) {
        dealsQuery = query(dealsQuery, where("__name__", "==", dealId));
      } else if (vendorId) {
        dealsQuery = query(dealsQuery, where("vendorId", "==", vendorId));
      }

      const dealsSnapshot = await getDocs(dealsQuery);
      const deals = dealsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as FlashDeal[];

      let bookingsQuery = query(
        collection(db, "flashDealBookings"),
        orderBy("bookedAt", "desc"),
      );

      if (dealId) {
        bookingsQuery = query(bookingsQuery, where("dealId", "==", dealId));
      } else if (vendorId) {
        bookingsQuery = query(bookingsQuery, where("vendorId", "==", vendorId));
      }

      const bookingsSnapshot = await getDocs(bookingsQuery);
      const bookings = bookingsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Calculate analytics
      const totalDeals = deals.length;
      const activeDeals = deals.filter((d) => d.isActive).length;
      const totalBookings = bookings.length;
      const redeemedBookings = bookings.filter(
        (b) => b.status === "redeemed",
      ).length;

      const totalRevenue = bookings.reduce(
        (sum, b) => sum + (b.discountedPrice || 0),
        0,
      );
      const totalSavings = bookings.reduce(
        (sum, b) => sum + (b.savings || 0),
        0,
      );

      const redemptionRate =
        totalBookings > 0 ? (redeemedBookings / totalBookings) * 100 : 0;

      const averageBookingRate =
        deals.length > 0
          ? deals.reduce((sum, d) => sum + d.bookedSlots / d.totalSlots, 0) /
            deals.length
          : 0;

      return {
        totalDeals,
        activeDeals,
        totalBookings,
        redeemedBookings,
        totalRevenue,
        totalSavings,
        redemptionRate,
        averageBookingRate: averageBookingRate * 100,
        deals,
        bookings,
      };
    } catch (error) {
      console.error("Error getting flash deal analytics:", error);
      throw error;
    }
  }

  /**
   * Toggle flash deal status
   */
  static async toggleFlashDealStatus(
    dealId: string,
    isActive: boolean,
  ): Promise<void> {
    try {
      await updateDoc(doc(db, "flashDeals", dealId), {
        isActive,
      });
    } catch (error) {
      console.error("Error toggling flash deal status:", error);
      throw error;
    }
  }
}

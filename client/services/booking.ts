// @ts-nocheck
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  runTransaction,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import {
  Booking,
  VendorService,
  AddOnService,
  Vendor,
} from "../types/platform";
import { CommissionService } from "./commission";
import { LoyaltyService } from "./loyalty";

export class BookingService {
  /**
   * Get real-time availability for a vendor on a specific date
   */
  static async getAvailability(
    vendorId: string,
    date: Date,
    serviceDuration: number,
  ): Promise<{
    availableSlots: string[];
    bookedSlots: string[];
    operatingHours: { start: string; end: string; isOpen: boolean };
  }> {
    try {
      // Get vendor operating hours
      const vendorDoc = await getDoc(doc(db, "vendors", vendorId));
      if (!vendorDoc.exists()) {
        throw new Error("Vendor not found");
      }

      const vendor = vendorDoc.data() as Vendor;
      const dayOfWeek = date
        .toLocaleDateString("en-US", { weekday: "long" })
        .toLowerCase();
      const daySchedule =
        vendor.operatingHours[dayOfWeek as keyof typeof vendor.operatingHours];

      if (!daySchedule.isOpen) {
        return {
          availableSlots: [],
          bookedSlots: [],
          operatingHours: { start: "", end: "", isOpen: false },
        };
      }

      // Get existing bookings for the date
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const bookingsQuery = query(
        collection(db, "bookings"),
        where("vendorId", "==", vendorId),
        where("date", ">=", Timestamp.fromDate(startOfDay)),
        where("date", "<=", Timestamp.fromDate(endOfDay)),
        where("status", "in", ["pending", "confirmed", "in_progress"]),
      );

      const bookingsSnapshot = await getDocs(bookingsQuery);
      const bookedSlots = bookingsSnapshot.docs.map(
        (doc) => doc.data().timeSlot,
      );

      // Generate all possible slots based on operating hours
      const allSlots = this.generateTimeSlots(
        daySchedule.openTime,
        daySchedule.closeTime,
        serviceDuration,
        daySchedule.breakStart,
        daySchedule.breakEnd,
      );

      // Filter out booked slots
      const availableSlots = allSlots.filter(
        (slot) => !bookedSlots.includes(slot),
      );

      return {
        availableSlots,
        bookedSlots,
        operatingHours: {
          start: daySchedule.openTime,
          end: daySchedule.closeTime,
          isOpen: true,
        },
      };
    } catch (error) {
      console.error("Error getting availability:", error);
      throw error;
    }
  }

  /**
   * Create a comprehensive booking with pricing and commission calculation
   */
  static async createBooking(bookingData: {
    customerId: string;
    vendorId: string;
    serviceId: string;
    addOnServiceIds?: string[];
    date: Date;
    timeSlot: string;
    promoCode?: string;
    loyaltyPointsToUse?: number;
    notes?: string;
  }): Promise<string> {
    try {
      return await runTransaction(db, async (transaction) => {
        // Get service details
        const vendorDoc = await transaction.get(
          doc(db, "vendors", bookingData.vendorId),
        );
        if (!vendorDoc.exists()) {
          throw new Error("Vendor not found");
        }

        const vendor = vendorDoc.data() as Vendor;
        const service = vendor.services.find(
          (s) => s.id === bookingData.serviceId,
        );
        if (!service) {
          throw new Error("Service not found");
        }

        // Calculate pricing
        let basePrice = service.price;
        let addOnPrice = 0;
        let totalDuration = service.duration;
        const selectedAddOns: string[] = [];

        if (bookingData.addOnServiceIds?.length) {
          bookingData.addOnServiceIds.forEach((addOnId) => {
            const addOn = service.addOns.find((ao) => ao.id === addOnId);
            if (addOn) {
              addOnPrice += addOn.price;
              totalDuration += addOn.duration;
              selectedAddOns.push(addOnId);
            }
          });
        }

        const subtotal = basePrice + addOnPrice;
        let discountAmount = 0;
        let finalPrice = subtotal;

        // Apply promo code if provided
        if (bookingData.promoCode) {
          // TODO: Implement promo code validation and discount calculation
          // const promoDiscount = await this.validateAndApplyPromoCode(bookingData.promoCode, subtotal);
          // discountAmount += promoDiscount;
        }

        // Apply loyalty points if provided
        let loyaltyPointsUsed = 0;
        if (bookingData.loyaltyPointsToUse) {
          const availablePoints = await LoyaltyService.getAvailablePoints(
            bookingData.customerId,
          );
          loyaltyPointsUsed = Math.min(
            bookingData.loyaltyPointsToUse,
            availablePoints,
          );
          const loyaltyDiscount =
            LoyaltyService.calculateRedemptionValue(loyaltyPointsUsed);
          discountAmount += loyaltyDiscount;
        }

        finalPrice = Math.max(0, subtotal - discountAmount);

        // Calculate commission
        const commissionAmount = finalPrice * 0.22; // 22% commission
        const vendorEarnings = finalPrice - commissionAmount;

        // Create booking
        const booking: Omit<Booking, "id"> = {
          customerId: bookingData.customerId,
          vendorId: bookingData.vendorId,
          serviceId: bookingData.serviceId,
          addOnServices: selectedAddOns,
          date: Timestamp.fromDate(bookingData.date) as any,
          timeSlot: bookingData.timeSlot,
          duration: totalDuration,
          basePrice,
          addOnPrice,
          totalPrice: subtotal,
          discountAmount,
          finalPrice,
          commissionAmount,
          vendorEarnings,
          status: "pending",
          paymentStatus: "pending",
          paymentMethod: "pending" as any,
          loyaltyPointsEarned: 0,
          loyaltyPointsUsed,
          promoCode: bookingData.promoCode,
          promoDiscount: 0, // TODO: Implement promo discount
          notes: bookingData.notes,
          createdAt: Timestamp.now() as any,
          updatedAt: Timestamp.now() as any,
        };

        const bookingRef = doc(collection(db, "bookings"));
        transaction.set(bookingRef, booking);

        return bookingRef.id;
      });
    } catch (error) {
      console.error("Error creating booking:", error);
      throw error;
    }
  }

  /**
   * Process booking payment and complete booking flow
   */
  static async processBookingPayment(
    bookingId: string,
    paymentMethod: string,
    paymentId: string,
  ): Promise<void> {
    try {
      const bookingRef = doc(db, "bookings", bookingId);
      const bookingDoc = await getDoc(bookingRef);

      if (!bookingDoc.exists()) {
        throw new Error("Booking not found");
      }

      const booking = bookingDoc.data() as Booking;

      // Update booking payment status
      await updateDoc(bookingRef, {
        paymentStatus: "paid",
        paymentMethod,
        status: "confirmed",
        updatedAt: Timestamp.now(),
      });

      // Process commission
      await CommissionService.processBookingCommission(bookingId, booking);

      // Redeem loyalty points if used
      if (booking.loyaltyPointsUsed > 0) {
        await LoyaltyService.redeemPoints(
          booking.customerId,
          bookingId,
          booking.loyaltyPointsUsed,
        );
      }

      // Award loyalty points for the booking
      const pointsEarned = await LoyaltyService.awardPoints(
        booking.customerId,
        bookingId,
        booking.finalPrice,
      );

      // Update booking with earned points
      await updateDoc(bookingRef, {
        loyaltyPointsEarned: pointsEarned,
        updatedAt: Timestamp.now(),
      });

      console.log(`Booking ${bookingId} payment processed successfully`);
    } catch (error) {
      console.error("Error processing booking payment:", error);
      throw error;
    }
  }

  /**
   * Cancel booking with token system
   */
  static async cancelBooking(
    bookingId: string,
    reason: string,
    cancelledBy: "customer" | "vendor" | "admin",
  ): Promise<void> {
    try {
      const bookingRef = doc(db, "bookings", bookingId);
      const bookingDoc = await getDoc(bookingRef);

      if (!bookingDoc.exists()) {
        throw new Error("Booking not found");
      }

      const booking = bookingDoc.data() as Booking;
      const now = new Date();
      const bookingDateTime = new Date(booking.date.toDate());
      bookingDateTime.setHours(
        parseInt(booking.timeSlot.split(":")[0]),
        parseInt(booking.timeSlot.split(":")[1]),
      );

      const hoursUntilBooking =
        (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      let cancellationTokens = 0;

      // Apply token deduction based on cancellation timing
      if (cancelledBy === "customer") {
        if (hoursUntilBooking < 2) {
          cancellationTokens = 2; // 2 tokens for last-minute cancellation
        } else if (hoursUntilBooking < 24) {
          cancellationTokens = 1; // 1 token for same-day cancellation
        }
        // No tokens for cancellation > 24 hours before
      }

      // Update booking status
      await updateDoc(bookingRef, {
        status: "cancelled",
        cancellationReason: reason,
        cancellationTokens,
        updatedAt: Timestamp.now(),
      });

      // Process refund if payment was made
      if (booking.paymentStatus === "paid") {
        await CommissionService.processRefund(
          bookingId,
          booking.finalPrice,
          reason,
        );
      }

      console.log(
        `Booking ${bookingId} cancelled by ${cancelledBy}. Tokens deducted: ${cancellationTokens}`,
      );
    } catch (error) {
      console.error("Error cancelling booking:", error);
      throw error;
    }
  }

  /**
   * Mark booking as completed
   */
  static async completeBooking(bookingId: string): Promise<void> {
    try {
      const bookingRef = doc(db, "bookings", bookingId);
      await updateDoc(bookingRef, {
        status: "completed",
        updatedAt: Timestamp.now(),
      });

      console.log(`Booking ${bookingId} marked as completed`);
    } catch (error) {
      console.error("Error completing booking:", error);
      throw error;
    }
  }

  /**
   * Mark booking as no-show
   */
  static async markNoShow(bookingId: string): Promise<void> {
    try {
      const bookingRef = doc(db, "bookings", bookingId);
      const bookingDoc = await getDoc(bookingRef);

      if (!bookingDoc.exists()) {
        throw new Error("Booking not found");
      }

      const booking = bookingDoc.data() as Booking;

      await updateDoc(bookingRef, {
        status: "no_show",
        cancellationTokens: 3, // 3 tokens for no-show
        updatedAt: Timestamp.now(),
      });

      // Process commission even for no-show (vendor policy)
      await CommissionService.processBookingCommission(bookingId, booking);

      console.log(`Booking ${bookingId} marked as no-show`);
    } catch (error) {
      console.error("Error marking no-show:", error);
      throw error;
    }
  }

  /**
   * Get customer bookings with filters
   */
  static async getCustomerBookings(
    customerId: string,
    status?: string,
    limit?: number,
  ) {
    try {
      let q = query(
        collection(db, "bookings"),
        where("customerId", "==", customerId),
        orderBy("createdAt", "desc"),
      );

      if (status) {
        q = query(q, where("status", "==", status));
      }

      if (limit) {
        q = query(q, limit(limit));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Booking[];
    } catch (error) {
      console.error("Error getting customer bookings:", error);
      throw error;
    }
  }

  /**
   * Get vendor bookings with filters
   */
  static async getVendorBookings(
    vendorId: string,
    status?: string,
    date?: Date,
  ) {
    try {
      let q = query(
        collection(db, "bookings"),
        where("vendorId", "==", vendorId),
        orderBy("date", "desc"),
      );

      if (status) {
        q = query(q, where("status", "==", status));
      }

      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        q = query(
          q,
          where("date", ">=", Timestamp.fromDate(startOfDay)),
          where("date", "<=", Timestamp.fromDate(endOfDay)),
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Booking[];
    } catch (error) {
      console.error("Error getting vendor bookings:", error);
      throw error;
    }
  }

  /**
   * Generate time slots based on operating hours
   */
  private static generateTimeSlots(
    openTime: string,
    closeTime: string,
    serviceDuration: number,
    breakStart?: string,
    breakEnd?: string,
  ): string[] {
    const slots: string[] = [];
    const slotDuration = 30; // 30-minute slots

    const parseTime = (time: string) => {
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const formatTime = (minutes: number) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
    };

    const openMinutes = parseTime(openTime);
    const closeMinutes = parseTime(closeTime);
    const breakStartMinutes = breakStart ? parseTime(breakStart) : null;
    const breakEndMinutes = breakEnd ? parseTime(breakEnd) : null;

    for (
      let currentMinutes = openMinutes;
      currentMinutes + serviceDuration <= closeMinutes;
      currentMinutes += slotDuration
    ) {
      // Skip break time
      if (
        breakStartMinutes &&
        breakEndMinutes &&
        currentMinutes >= breakStartMinutes &&
        currentMinutes < breakEndMinutes
      ) {
        continue;
      }

      slots.push(formatTime(currentMinutes));
    }

    return slots;
  }

  /**
   * Get booking analytics for vendor
   */
  static async getVendorBookingAnalytics(
    vendorId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    try {
      let q = query(
        collection(db, "bookings"),
        where("vendorId", "==", vendorId),
        orderBy("createdAt", "desc"),
      );

      if (startDate) {
        q = query(q, where("createdAt", ">=", Timestamp.fromDate(startDate)));
      }

      if (endDate) {
        q = query(q, where("createdAt", "<=", Timestamp.fromDate(endDate)));
      }

      const snapshot = await getDocs(q);
      const bookings = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Booking[];

      const totalBookings = bookings.length;
      const completedBookings = bookings.filter(
        (b) => b.status === "completed",
      ).length;
      const cancelledBookings = bookings.filter(
        (b) => b.status === "cancelled",
      ).length;
      const noShowBookings = bookings.filter(
        (b) => b.status === "no_show",
      ).length;

      const totalRevenue = bookings
        .filter((b) => b.paymentStatus === "paid")
        .reduce((sum, b) => sum + b.vendorEarnings, 0);

      const completionRate =
        totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;

      return {
        totalBookings,
        completedBookings,
        cancelledBookings,
        noShowBookings,
        totalRevenue,
        completionRate,
        bookings,
      };
    } catch (error) {
      console.error("Error getting vendor analytics:", error);
      throw error;
    }
  }
}

// Legacy compatibility export
export const bookingService = {
  createBooking: BookingService.createBooking,
  getCustomerBookings: BookingService.getCustomerBookings,
  getVendorBookings: BookingService.getVendorBookings,
  cancelBooking: BookingService.cancelBooking,
  completeBooking: BookingService.completeBooking,
  getAvailability: BookingService.getAvailability,
};

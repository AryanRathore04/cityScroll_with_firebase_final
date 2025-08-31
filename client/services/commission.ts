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
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Transaction, Booking, Vendor } from "../types/platform";

export class CommissionService {
  private static readonly COMMISSION_RATE = 0.22; // 22%

  /**
   * Calculate and process commission for a booking
   */
  static async processBookingCommission(
    bookingId: string,
    bookingData: Partial<Booking>,
  ): Promise<void> {
    try {
      const commissionAmount = bookingData.finalPrice! * this.COMMISSION_RATE;
      const vendorEarnings = bookingData.finalPrice! - commissionAmount;

      // Update booking with commission details
      await updateDoc(doc(db, "bookings", bookingId), {
        commissionAmount,
        vendorEarnings,
        updatedAt: Timestamp.now(),
      });

      // Create commission transaction
      await this.createCommissionTransaction({
        bookingId,
        vendorId: bookingData.vendorId!,
        customerId: bookingData.customerId!,
        amount: bookingData.finalPrice!,
        commissionAmount,
        description: `Commission for booking #${bookingId}`,
      });

      // Update vendor earnings
      await this.updateVendorEarnings(
        bookingData.vendorId!,
        vendorEarnings,
        commissionAmount,
      );

      console.log(
        `Commission processed for booking ${bookingId}: ₹${commissionAmount}`,
      );
    } catch (error) {
      console.error("Error processing commission:", error);
      throw error;
    }
  }

  /**
   * Create a commission transaction record
   */
  private static async createCommissionTransaction(data: {
    bookingId: string;
    vendorId: string;
    customerId: string;
    amount: number;
    commissionAmount: number;
    description: string;
  }): Promise<string> {
    const transaction: Omit<Transaction, "id"> = {
      type: "commission",
      bookingId: data.bookingId,
      vendorId: data.vendorId,
      customerId: data.customerId,
      amount: data.amount,
      commissionAmount: data.commissionAmount,
      description: data.description,
      status: "completed",
      createdAt: Timestamp.now() as any,
      processedAt: Timestamp.now() as any,
    };

    const docRef = await addDoc(collection(db, "transactions"), transaction);
    return docRef.id;
  }

  /**
   * Update vendor earnings and pending payouts
   */
  private static async updateVendorEarnings(
    vendorId: string,
    earnings: number,
    commission: number,
  ): Promise<void> {
    const vendorRef = doc(db, "vendors", vendorId);
    const vendorDoc = await getDoc(vendorRef);

    if (vendorDoc.exists()) {
      const currentData = vendorDoc.data() as Vendor;
      await updateDoc(vendorRef, {
        totalEarnings: (currentData.totalEarnings || 0) + earnings,
        pendingPayouts: (currentData.pendingPayouts || 0) + earnings,
        updatedAt: Timestamp.now(),
      });
    }
  }

  /**
   * Process vendor payout
   */
  static async processVendorPayout(
    vendorId: string,
    amount: number,
    paymentMethod: string = "bank_transfer",
  ): Promise<string> {
    try {
      // Create payout transaction
      const transaction: Omit<Transaction, "id"> = {
        type: "payout",
        vendorId,
        amount: -amount, // Negative amount for payout
        description: `Payout to vendor ${vendorId}`,
        status: "pending",
        paymentMethod,
        createdAt: Timestamp.now() as any,
      };

      const docRef = await addDoc(collection(db, "transactions"), transaction);

      // Update vendor pending payouts
      const vendorRef = doc(db, "vendors", vendorId);
      const vendorDoc = await getDoc(vendorRef);

      if (vendorDoc.exists()) {
        const currentData = vendorDoc.data() as Vendor;
        await updateDoc(vendorRef, {
          pendingPayouts: Math.max(
            0,
            (currentData.pendingPayouts || 0) - amount,
          ),
          updatedAt: Timestamp.now(),
        });
      }

      return docRef.id;
    } catch (error) {
      console.error("Error processing payout:", error);
      throw error;
    }
  }

  /**
   * Get vendor earnings summary
   */
  static async getVendorEarnings(vendorId: string) {
    try {
      const transactionsRef = collection(db, "transactions");
      const q = query(
        transactionsRef,
        where("vendorId", "==", vendorId),
        where("type", "in", ["commission", "payout"]),
        orderBy("createdAt", "desc"),
      );

      const snapshot = await getDocs(q);
      const transactions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Transaction[];

      const totalEarnings = transactions
        .filter((t) => t.type === "commission")
        .reduce((sum, t) => sum + (t.amount - t.commissionAmount!), 0);

      const totalPayouts = transactions
        .filter((t) => t.type === "payout")
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const pendingEarnings = totalEarnings - totalPayouts;

      return {
        totalEarnings,
        totalPayouts,
        pendingEarnings,
        transactions,
      };
    } catch (error) {
      console.error("Error getting vendor earnings:", error);
      throw error;
    }
  }

  /**
   * Get platform revenue summary
   */
  static async getPlatformRevenue(startDate?: Date, endDate?: Date) {
    try {
      let q = query(
        collection(db, "transactions"),
        where("type", "==", "commission"),
        orderBy("createdAt", "desc"),
      );

      if (startDate) {
        q = query(q, where("createdAt", ">=", Timestamp.fromDate(startDate)));
      }

      if (endDate) {
        q = query(q, where("createdAt", "<=", Timestamp.fromDate(endDate)));
      }

      const snapshot = await getDocs(q);
      const transactions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Transaction[];

      const totalCommissions = transactions.reduce(
        (sum, t) => sum + (t.commissionAmount || 0),
        0,
      );

      const totalBookings = transactions.length;
      const avgCommissionPerBooking =
        totalBookings > 0 ? totalCommissions / totalBookings : 0;

      return {
        totalCommissions,
        totalBookings,
        avgCommissionPerBooking,
        transactions,
      };
    } catch (error) {
      console.error("Error getting platform revenue:", error);
      throw error;
    }
  }

  /**
   * Process refund and adjust commission
   */
  static async processRefund(
    bookingId: string,
    refundAmount: number,
    reason: string,
  ): Promise<string> {
    try {
      const bookingRef = doc(db, "bookings", bookingId);
      const bookingDoc = await getDoc(bookingRef);

      if (!bookingDoc.exists()) {
        throw new Error("Booking not found");
      }

      const booking = bookingDoc.data() as Booking;
      const commissionRefund = refundAmount * this.COMMISSION_RATE;
      const vendorRefund = refundAmount - commissionRefund;

      // Create refund transaction
      const transaction: Omit<Transaction, "id"> = {
        type: "refund",
        bookingId,
        vendorId: booking.vendorId,
        customerId: booking.customerId,
        amount: -refundAmount,
        commissionAmount: -commissionRefund,
        description: `Refund for booking #${bookingId}: ${reason}`,
        status: "completed",
        createdAt: Timestamp.now() as any,
        processedAt: Timestamp.now() as any,
      };

      const docRef = await addDoc(collection(db, "transactions"), transaction);

      // Update vendor earnings
      if (vendorRefund > 0) {
        await this.updateVendorEarnings(
          booking.vendorId,
          -vendorRefund,
          commissionRefund,
        );
      }

      // Update booking status
      await updateDoc(bookingRef, {
        status: "cancelled",
        paymentStatus: "refunded",
        cancellationReason: reason,
        updatedAt: Timestamp.now(),
      });

      return docRef.id;
    } catch (error) {
      console.error("Error processing refund:", error);
      throw error;
    }
  }
}

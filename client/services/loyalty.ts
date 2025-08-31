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
import { LoyaltyTransaction, User, Booking } from "../types/platform";

export class LoyaltyService {
  private static readonly POINTS_PER_RUPEE = 1; // 1 point per ₹1 spent
  private static readonly POINTS_REDEMPTION_VALUE = 1; // 1 point = ₹1
  private static readonly MIN_REDEMPTION_POINTS = 100;
  private static readonly POINTS_EXPIRY_DAYS = 365; // Points expire in 1 year

  /**
   * Award loyalty points for a booking
   */
  static async awardPoints(
    customerId: string,
    bookingId: string,
    amount: number,
  ): Promise<number> {
    try {
      const pointsEarned = Math.floor(amount * this.POINTS_PER_RUPEE);

      if (pointsEarned <= 0) return 0;

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + this.POINTS_EXPIRY_DAYS);

      // Create loyalty transaction
      const transaction: Omit<LoyaltyTransaction, "id"> = {
        customerId,
        type: "earned",
        points: pointsEarned,
        bookingId,
        description: `Points earned for booking #${bookingId}`,
        createdAt: Timestamp.now() as any,
        expiresAt: Timestamp.fromDate(expiryDate) as any,
      };

      await addDoc(collection(db, "loyaltyTransactions"), transaction);

      // Update user's total loyalty points
      await this.updateUserLoyaltyPoints(customerId, pointsEarned);

      // Update booking with points earned
      await updateDoc(doc(db, "bookings", bookingId), {
        loyaltyPointsEarned: pointsEarned,
        updatedAt: Timestamp.now(),
      });

      console.log(
        `Awarded ${pointsEarned} points to customer ${customerId} for booking ${bookingId}`,
      );

      return pointsEarned;
    } catch (error) {
      console.error("Error awarding loyalty points:", error);
      throw error;
    }
  }

  /**
   * Redeem loyalty points for a booking
   */
  static async redeemPoints(
    customerId: string,
    bookingId: string,
    pointsToRedeem: number,
  ): Promise<number> {
    try {
      if (pointsToRedeem < this.MIN_REDEMPTION_POINTS) {
        throw new Error(
          `Minimum ${this.MIN_REDEMPTION_POINTS} points required for redemption`,
        );
      }

      const userRef = doc(db, "users", customerId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        throw new Error("User not found");
      }

      const user = userDoc.data() as User;
      const availablePoints = await this.getAvailablePoints(customerId);

      if (availablePoints < pointsToRedeem) {
        throw new Error("Insufficient loyalty points");
      }

      const redemptionValue = pointsToRedeem * this.POINTS_REDEMPTION_VALUE;

      // Create redemption transaction
      const transaction: Omit<LoyaltyTransaction, "id"> = {
        customerId,
        type: "redeemed",
        points: -pointsToRedeem,
        bookingId,
        description: `Points redeemed for booking #${bookingId}`,
        createdAt: Timestamp.now() as any,
      };

      await addDoc(collection(db, "loyaltyTransactions"), transaction);

      // Update user's total loyalty points
      await this.updateUserLoyaltyPoints(customerId, -pointsToRedeem);

      // Update booking with points used
      await updateDoc(doc(db, "bookings", bookingId), {
        loyaltyPointsUsed: pointsToRedeem,
        updatedAt: Timestamp.now(),
      });

      console.log(
        `Redeemed ${pointsToRedeem} points (₹${redemptionValue}) for customer ${customerId}`,
      );

      return redemptionValue;
    } catch (error) {
      console.error("Error redeeming loyalty points:", error);
      throw error;
    }
  }

  /**
   * Get available loyalty points for a customer
   */
  static async getAvailablePoints(customerId: string): Promise<number> {
    try {
      const now = Timestamp.now();
      const transactionsRef = collection(db, "loyaltyTransactions");
      const q = query(
        transactionsRef,
        where("customerId", "==", customerId),
        where("type", "in", ["earned", "redeemed"]),
        orderBy("createdAt", "desc"),
      );

      const snapshot = await getDocs(q);
      let availablePoints = 0;

      snapshot.docs.forEach((doc) => {
        const transaction = doc.data() as LoyaltyTransaction;

        // Check if points are not expired (for earned points)
        if (transaction.type === "earned") {
          if (!transaction.expiresAt || transaction.expiresAt > now) {
            availablePoints += transaction.points;
          }
        } else if (transaction.type === "redeemed") {
          availablePoints += transaction.points; // This will be negative
        }
      });

      return Math.max(0, availablePoints);
    } catch (error) {
      console.error("Error getting available points:", error);
      throw error;
    }
  }

  /**
   * Get loyalty transaction history
   */
  static async getLoyaltyHistory(customerId: string) {
    try {
      const transactionsRef = collection(db, "loyaltyTransactions");
      const q = query(
        transactionsRef,
        where("customerId", "==", customerId),
        orderBy("createdAt", "desc"),
      );

      const snapshot = await getDocs(q);
      const transactions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as LoyaltyTransaction[];

      const totalEarned = transactions
        .filter((t) => t.type === "earned")
        .reduce((sum, t) => sum + t.points, 0);

      const totalRedeemed = Math.abs(
        transactions
          .filter((t) => t.type === "redeemed")
          .reduce((sum, t) => sum + t.points, 0),
      );

      const availablePoints = await this.getAvailablePoints(customerId);

      return {
        transactions,
        summary: {
          totalEarned,
          totalRedeemed,
          availablePoints,
          redemptionValue: availablePoints * this.POINTS_REDEMPTION_VALUE,
        },
      };
    } catch (error) {
      console.error("Error getting loyalty history:", error);
      throw error;
    }
  }

  /**
   * Expire old loyalty points
   */
  static async expireOldPoints(): Promise<void> {
    try {
      const now = Timestamp.now();
      const transactionsRef = collection(db, "loyaltyTransactions");
      const q = query(
        transactionsRef,
        where("type", "==", "earned"),
        where("expiresAt", "<", now),
      );

      const snapshot = await getDocs(q);

      for (const docSnapshot of snapshot.docs) {
        const transaction = docSnapshot.data() as LoyaltyTransaction;

        // Create expiry transaction
        const expiryTransaction: Omit<LoyaltyTransaction, "id"> = {
          customerId: transaction.customerId,
          type: "expired",
          points: -transaction.points,
          description: `Points expired from ${transaction.createdAt.toDate().toLocaleDateString()}`,
          createdAt: Timestamp.now() as any,
        };

        await addDoc(collection(db, "loyaltyTransactions"), expiryTransaction);

        // Update user's total loyalty points
        await this.updateUserLoyaltyPoints(
          transaction.customerId,
          -transaction.points,
        );

        console.log(
          `Expired ${transaction.points} points for customer ${transaction.customerId}`,
        );
      }
    } catch (error) {
      console.error("Error expiring old points:", error);
      throw error;
    }
  }

  /**
   * Update user's total loyalty points
   */
  private static async updateUserLoyaltyPoints(
    customerId: string,
    pointsChange: number,
  ): Promise<void> {
    const userRef = doc(db, "users", customerId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const currentData = userDoc.data() as User;
      const newPoints = Math.max(
        0,
        (currentData.loyaltyPoints || 0) + pointsChange,
      );

      await updateDoc(userRef, {
        loyaltyPoints: newPoints,
        updatedAt: Timestamp.now(),
      });
    }
  }

  /**
   * Get loyalty program analytics
   */
  static async getLoyaltyAnalytics(startDate?: Date, endDate?: Date) {
    try {
      let q = query(
        collection(db, "loyaltyTransactions"),
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
      })) as LoyaltyTransaction[];

      const totalPointsEarned = transactions
        .filter((t) => t.type === "earned")
        .reduce((sum, t) => sum + t.points, 0);

      const totalPointsRedeemed = Math.abs(
        transactions
          .filter((t) => t.type === "redeemed")
          .reduce((sum, t) => sum + t.points, 0),
      );

      const totalPointsExpired = Math.abs(
        transactions
          .filter((t) => t.type === "expired")
          .reduce((sum, t) => sum + t.points, 0),
      );

      const activeCustomers = new Set(transactions.map((t) => t.customerId))
        .size;

      const redemptionRate =
        totalPointsEarned > 0
          ? (totalPointsRedeemed / totalPointsEarned) * 100
          : 0;

      return {
        totalPointsEarned,
        totalPointsRedeemed,
        totalPointsExpired,
        activeCustomers,
        redemptionRate,
        redemptionValue: totalPointsRedeemed * this.POINTS_REDEMPTION_VALUE,
        transactions,
      };
    } catch (error) {
      console.error("Error getting loyalty analytics:", error);
      throw error;
    }
  }

  /**
   * Calculate points for amount
   */
  static calculatePointsForAmount(amount: number): number {
    return Math.floor(amount * this.POINTS_PER_RUPEE);
  }

  /**
   * Calculate redemption value for points
   */
  static calculateRedemptionValue(points: number): number {
    return points * this.POINTS_REDEMPTION_VALUE;
  }

  /**
   * Check if points can be redeemed
   */
  static canRedeemPoints(points: number): boolean {
    return points >= this.MIN_REDEMPTION_POINTS;
  }
}

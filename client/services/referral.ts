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
import { Referral, User } from "../types/platform";

export class ReferralService {
  private static readonly REFERRAL_REWARD_AMOUNT = 100; // ₹100 reward
  private static readonly REFEREE_REWARD_AMOUNT = 50; // ₹50 for referred user

  /**
   * Generate unique referral code for user
   */
  static generateReferralCode(userName: string, userId: string): string {
    const cleanName = userName.replace(/[^a-zA-Z]/g, "").toUpperCase();
    const namePrefix = cleanName.substring(0, 3) || "REF";
    const userSuffix = userId.substring(0, 4).toUpperCase();
    const randomSuffix = Math.random()
      .toString(36)
      .substring(2, 5)
      .toUpperCase();

    return `${namePrefix}${userSuffix}${randomSuffix}`;
  }

  /**
   * Create user with referral code
   */
  static async setupUserReferralCode(
    userId: string,
    userName: string,
  ): Promise<string> {
    try {
      const referralCode = this.generateReferralCode(userName, userId);

      // Update user with referral code
      await updateDoc(doc(db, "users", userId), {
        referralCode,
        updatedAt: Timestamp.now(),
      });

      return referralCode;
    } catch (error) {
      console.error("Error setting up referral code:", error);
      throw error;
    }
  }

  /**
   * Send referral invitation
   */
  static async sendReferralInvitation(
    referrerId: string,
    referredEmail: string,
  ): Promise<string> {
    try {
      // Get referrer details
      const referrerDoc = await getDoc(doc(db, "users", referrerId));
      if (!referrerDoc.exists()) {
        throw new Error("Referrer not found");
      }

      const referrer = referrerDoc.data() as User;

      // Check if email is already referred by this user
      const existingReferralQuery = query(
        collection(db, "referrals"),
        where("referrerId", "==", referrerId),
        where("referredEmail", "==", referredEmail.toLowerCase()),
      );

      const existingSnapshot = await getDocs(existingReferralQuery);
      if (!existingSnapshot.empty) {
        throw new Error("Email already referred by you");
      }

      // Create referral record
      const referral: Omit<Referral, "id"> = {
        referrerId,
        referredEmail: referredEmail.toLowerCase(),
        referralCode: referrer.referralCode,
        status: "invited",
        rewardAmount: this.REFERRAL_REWARD_AMOUNT,
        isRewardClaimed: false,
        createdAt: Timestamp.now() as any,
      };

      const docRef = await addDoc(collection(db, "referrals"), referral);

      // TODO: Send email invitation with referral link
      // await this.sendReferralEmail(referredEmail, referrer.name, referrer.referralCode);

      console.log(
        `Referral invitation sent to ${referredEmail} by ${referrer.name}`,
      );
      return docRef.id;
    } catch (error) {
      console.error("Error sending referral invitation:", error);
      throw error;
    }
  }

  /**
   * Process referral signup
   */
  static async processReferralSignup(
    referralCode: string,
    newUserId: string,
    newUserEmail: string,
  ): Promise<void> {
    try {
      // Find referrer by referral code
      const referrerQuery = query(
        collection(db, "users"),
        where("referralCode", "==", referralCode.toUpperCase()),
      );

      const referrerSnapshot = await getDocs(referrerQuery);
      if (referrerSnapshot.empty) {
        console.log("Invalid referral code:", referralCode);
        return;
      }

      const referrerDoc = referrerSnapshot.docs[0];
      const referrerId = referrerDoc.id;

      // Find existing referral record
      const referralQuery = query(
        collection(db, "referrals"),
        where("referrerId", "==", referrerId),
        where("referredEmail", "==", newUserEmail.toLowerCase()),
        where("status", "==", "invited"),
      );

      const referralSnapshot = await getDocs(referralQuery);
      if (referralSnapshot.empty) {
        console.log("No referral record found for:", newUserEmail);
        return;
      }

      const referralDoc = referralSnapshot.docs[0];

      // Update referral record
      await updateDoc(doc(db, "referrals", referralDoc.id), {
        referredUserId: newUserId,
        status: "signed_up",
        signedUpAt: Timestamp.now(),
      });

      // Update referred user
      await updateDoc(doc(db, "users", newUserId), {
        referredBy: referrerId,
        updatedAt: Timestamp.now(),
      });

      // Give welcome bonus to referred user
      await this.giveRefereeReward(newUserId, this.REFEREE_REWARD_AMOUNT);

      console.log(`Referral signup processed for ${newUserEmail}`);
    } catch (error) {
      console.error("Error processing referral signup:", error);
      throw error;
    }
  }

  /**
   * Process first booking by referred user
   */
  static async processReferralFirstBooking(
    referredUserId: string,
    bookingId: string,
  ): Promise<void> {
    try {
      // Get referred user details
      const userDoc = await getDoc(doc(db, "users", referredUserId));
      if (!userDoc.exists()) {
        return;
      }

      const user = userDoc.data() as User;
      if (!user.referredBy) {
        return; // User was not referred
      }

      // Find referral record
      const referralQuery = query(
        collection(db, "referrals"),
        where("referrerId", "==", user.referredBy),
        where("referredUserId", "==", referredUserId),
        where("status", "==", "signed_up"),
      );

      const referralSnapshot = await getDocs(referralQuery);
      if (referralSnapshot.empty) {
        return;
      }

      const referralDoc = referralSnapshot.docs[0];

      // Update referral record
      await updateDoc(doc(db, "referrals", referralDoc.id), {
        status: "first_booking",
        firstBookingAt: Timestamp.now(),
      });

      // Give reward to referrer
      await this.giveReferrerReward(
        user.referredBy,
        this.REFERRAL_REWARD_AMOUNT,
      );

      // Update referral record as rewarded
      await updateDoc(doc(db, "referrals", referralDoc.id), {
        status: "rewarded",
        isRewardClaimed: true,
        rewardClaimedAt: Timestamp.now(),
      });

      console.log(
        `Referral reward processed for first booking by ${referredUserId}`,
      );
    } catch (error) {
      console.error("Error processing referral first booking:", error);
      throw error;
    }
  }

  /**
   * Give reward to referrer
   */
  private static async giveReferrerReward(
    referrerId: string,
    amount: number,
  ): Promise<void> {
    try {
      // Create wallet transaction or loyalty points
      // For now, we'll add to loyalty points
      const userRef = doc(db, "users", referrerId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const currentData = userDoc.data() as User;
        await updateDoc(userRef, {
          loyaltyPoints: (currentData.loyaltyPoints || 0) + amount,
          updatedAt: Timestamp.now(),
        });

        // Record transaction
        await addDoc(collection(db, "loyaltyTransactions"), {
          customerId: referrerId,
          type: "earned",
          points: amount,
          description: `Referral reward - friend completed first booking`,
          createdAt: Timestamp.now(),
        });
      }
    } catch (error) {
      console.error("Error giving referrer reward:", error);
      throw error;
    }
  }

  /**
   * Give reward to referred user
   */
  private static async giveRefereeReward(
    referredUserId: string,
    amount: number,
  ): Promise<void> {
    try {
      // Create wallet transaction or loyalty points
      const userRef = doc(db, "users", referredUserId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const currentData = userDoc.data() as User;
        await updateDoc(userRef, {
          loyaltyPoints: (currentData.loyaltyPoints || 0) + amount,
          updatedAt: Timestamp.now(),
        });

        // Record transaction
        await addDoc(collection(db, "loyaltyTransactions"), {
          customerId: referredUserId,
          type: "earned",
          points: amount,
          description: `Welcome bonus - referred by friend`,
          createdAt: Timestamp.now(),
        });
      }
    } catch (error) {
      console.error("Error giving referee reward:", error);
      throw error;
    }
  }

  /**
   * Get user's referral stats
   */
  static async getUserReferralStats(userId: string) {
    try {
      const referralsQuery = query(
        collection(db, "referrals"),
        where("referrerId", "==", userId),
        orderBy("createdAt", "desc"),
      );

      const snapshot = await getDocs(referralsQuery);
      const referrals = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Referral[];

      const totalInvited = referrals.length;
      const totalSignedUp = referrals.filter(
        (r) => r.status !== "invited",
      ).length;
      const totalRewarded = referrals.filter(
        (r) => r.status === "rewarded",
      ).length;
      const totalEarned = referrals
        .filter((r) => r.isRewardClaimed)
        .reduce((sum, r) => sum + r.rewardAmount, 0);

      const conversionRate =
        totalInvited > 0 ? (totalSignedUp / totalInvited) * 100 : 0;

      return {
        referrals,
        stats: {
          totalInvited,
          totalSignedUp,
          totalRewarded,
          totalEarned,
          conversionRate,
        },
      };
    } catch (error) {
      console.error("Error getting referral stats:", error);
      throw error;
    }
  }

  /**
   * Get referral leaderboard
   */
  static async getReferralLeaderboard(limit: number = 10) {
    try {
      const referralsQuery = query(
        collection(db, "referrals"),
        orderBy("createdAt", "desc"),
      );

      const snapshot = await getDocs(referralsQuery);
      const referrals = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Referral[];

      // Group by referrer and calculate stats
      const referrerStats: { [key: string]: any } = {};

      for (const referral of referrals) {
        if (!referrerStats[referral.referrerId]) {
          const referrerDoc = await getDoc(
            doc(db, "users", referral.referrerId),
          );
          const referrer = referrerDoc.data() as User;

          referrerStats[referral.referrerId] = {
            referrerId: referral.referrerId,
            referrerName: referrer?.name || "Unknown",
            totalInvited: 0,
            totalSignedUp: 0,
            totalRewarded: 0,
            totalEarned: 0,
          };
        }

        const stats = referrerStats[referral.referrerId];
        stats.totalInvited++;

        if (referral.status !== "invited") {
          stats.totalSignedUp++;
        }

        if (referral.status === "rewarded") {
          stats.totalRewarded++;
          stats.totalEarned += referral.rewardAmount;
        }
      }

      // Sort by total earned and return top performers
      const leaderboard = Object.values(referrerStats)
        .sort((a: any, b: any) => b.totalEarned - a.totalEarned)
        .slice(0, limit);

      return leaderboard;
    } catch (error) {
      console.error("Error getting referral leaderboard:", error);
      throw error;
    }
  }

  /**
   * Get referral analytics
   */
  static async getReferralAnalytics(startDate?: Date, endDate?: Date) {
    try {
      let q = query(collection(db, "referrals"), orderBy("createdAt", "desc"));

      if (startDate) {
        q = query(q, where("createdAt", ">=", Timestamp.fromDate(startDate)));
      }

      if (endDate) {
        q = query(q, where("createdAt", "<=", Timestamp.fromDate(endDate)));
      }

      const snapshot = await getDocs(q);
      const referrals = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Referral[];

      const totalInvitations = referrals.length;
      const totalSignups = referrals.filter(
        (r) => r.status !== "invited",
      ).length;
      const totalBookings = referrals.filter(
        (r) => r.status === "first_booking" || r.status === "rewarded",
      ).length;
      const totalRewards = referrals.filter((r) => r.isRewardClaimed).length;

      const conversionToSignup =
        totalInvitations > 0 ? (totalSignups / totalInvitations) * 100 : 0;
      const conversionToBooking =
        totalSignups > 0 ? (totalBookings / totalSignups) * 100 : 0;

      const totalRewardsPaid = referrals
        .filter((r) => r.isRewardClaimed)
        .reduce((sum, r) => sum + r.rewardAmount, 0);

      return {
        totalInvitations,
        totalSignups,
        totalBookings,
        totalRewards,
        conversionToSignup,
        conversionToBooking,
        totalRewardsPaid,
        referrals,
      };
    } catch (error) {
      console.error("Error getting referral analytics:", error);
      throw error;
    }
  }
}

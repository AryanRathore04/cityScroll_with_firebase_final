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
  AdminUser,
  VendorOnboarding,
  Analytics,
  Dispute,
  AuditLog,
  FranchiseInquiry,
  Vendor,
  User,
  Booking,
} from "../types/platform";

export class AdminService {
  /**
   * Create admin user
   */
  static async createAdminUser(
    adminData: Omit<AdminUser, "id" | "createdAt" | "lastLoginAt">,
  ): Promise<string> {
    try {
      const admin: Omit<AdminUser, "id"> = {
        ...adminData,
        createdAt: Timestamp.now() as any,
        isActive: true,
      };

      const docRef = await addDoc(collection(db, "admins"), admin);
      return docRef.id;
    } catch (error) {
      console.error("Error creating admin user:", error);
      throw error;
    }
  }

  /**
   * Get vendor onboarding requests
   */
  static async getVendorOnboardingRequests(
    status?: string,
  ): Promise<VendorOnboarding[]> {
    try {
      let q = query(
        collection(db, "vendorOnboarding"),
        orderBy("createdAt", "desc"),
      );

      if (status) {
        q = query(q, where("status", "==", status));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as VendorOnboarding[];
    } catch (error) {
      console.error("Error getting vendor onboarding requests:", error);
      throw error;
    }
  }

  /**
   * Approve vendor onboarding
   */
  static async approveVendorOnboarding(
    onboardingId: string,
    adminId: string,
    notes?: string,
  ): Promise<void> {
    try {
      await runTransaction(db, async (transaction) => {
        const onboardingRef = doc(db, "vendorOnboarding", onboardingId);
        const onboardingDoc = await transaction.get(onboardingRef);

        if (!onboardingDoc.exists()) {
          throw new Error("Onboarding request not found");
        }

        const onboarding = onboardingDoc.data() as VendorOnboarding;

        // Update onboarding status
        transaction.update(onboardingRef, {
          status: "approved",
          reviewedAt: Timestamp.now(),
          reviewedBy: adminId,
          adminNotes: notes,
        });

        // Update vendor status
        const vendorRef = doc(db, "vendors", onboarding.vendorId);
        transaction.update(vendorRef, {
          onboardingStatus: "completed",
          kycStatus: "approved",
          isVerified: true,
          updatedAt: Timestamp.now(),
        });

        // Create audit log
        const auditLog: Omit<AuditLog, "id"> = {
          userId: adminId,
          userType: "admin",
          action: "approve_vendor_onboarding",
          module: "vendor_management",
          entityId: onboarding.vendorId,
          entityType: "vendor",
          newData: { status: "approved", notes },
          createdAt: Timestamp.now() as any,
        };

        transaction.set(doc(collection(db, "auditLogs")), auditLog);
      });

      console.log(`Vendor onboarding approved: ${onboardingId}`);
    } catch (error) {
      console.error("Error approving vendor onboarding:", error);
      throw error;
    }
  }

  /**
   * Reject vendor onboarding
   */
  static async rejectVendorOnboarding(
    onboardingId: string,
    adminId: string,
    reason: string,
  ): Promise<void> {
    try {
      await runTransaction(db, async (transaction) => {
        const onboardingRef = doc(db, "vendorOnboarding", onboardingId);
        const onboardingDoc = await transaction.get(onboardingRef);

        if (!onboardingDoc.exists()) {
          throw new Error("Onboarding request not found");
        }

        const onboarding = onboardingDoc.data() as VendorOnboarding;

        // Update onboarding status
        transaction.update(onboardingRef, {
          status: "rejected",
          rejectionReason: reason,
          reviewedAt: Timestamp.now(),
          reviewedBy: adminId,
        });

        // Update vendor status
        const vendorRef = doc(db, "vendors", onboarding.vendorId);
        transaction.update(vendorRef, {
          onboardingStatus: "rejected",
          kycStatus: "rejected",
          updatedAt: Timestamp.now(),
        });

        // Create audit log
        const auditLog: Omit<AuditLog, "id"> = {
          userId: adminId,
          userType: "admin",
          action: "reject_vendor_onboarding",
          module: "vendor_management",
          entityId: onboarding.vendorId,
          entityType: "vendor",
          newData: { status: "rejected", reason },
          createdAt: Timestamp.now() as any,
        };

        transaction.set(doc(collection(db, "auditLogs")), auditLog);
      });

      console.log(`Vendor onboarding rejected: ${onboardingId}`);
    } catch (error) {
      console.error("Error rejecting vendor onboarding:", error);
      throw error;
    }
  }

  /**
   * Get platform analytics
   */
  static async getPlatformAnalytics(
    startDate?: Date,
    endDate?: Date,
  ): Promise<Analytics> {
    try {
      // Build queries with date filters if provided
      const buildQuery = (collectionName: string) => {
        let q = query(collection(db, collectionName));
        if (startDate) {
          q = query(q, where("createdAt", ">=", Timestamp.fromDate(startDate)));
        }
        if (endDate) {
          q = query(q, where("createdAt", "<=", Timestamp.fromDate(endDate)));
        }
        return q;
      };

      // Get all necessary data
      const [
        bookingsSnapshot,
        vendorsSnapshot,
        usersSnapshot,
        transactionsSnapshot,
      ] = await Promise.all([
        getDocs(buildQuery("bookings")),
        getDocs(query(collection(db, "vendors"))),
        getDocs(query(collection(db, "users"))),
        getDocs(buildQuery("transactions")),
      ]);

      const bookings = bookingsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Booking[];

      const vendors = vendorsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Vendor[];

      const users = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];

      const transactions = transactionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Calculate metrics
      const totalRevenue = transactions
        .filter((t) => t.type === "commission")
        .reduce((sum, t) => sum + (t.commissionAmount || 0), 0);

      const currentMonth = new Date();
      currentMonth.setDate(1);
      const monthlyRevenue = transactions
        .filter(
          (t) =>
            t.type === "commission" && t.createdAt.toDate() >= currentMonth,
        )
        .reduce((sum, t) => sum + (t.commissionAmount || 0), 0);

      const totalBookings = bookings.length;
      const completedBookings = bookings.filter(
        (b) => b.status === "completed",
      );

      const activeVendors = vendors.filter((v) => v.isVerified).length;
      const activeCustomers = users.filter((u) => u.role === "customer").length;

      const avgBookingValue =
        completedBookings.length > 0
          ? completedBookings.reduce((sum, b) => sum + b.finalPrice, 0) /
            completedBookings.length
          : 0;

      // Calculate conversion and retention rates (simplified)
      const conversionRate = totalBookings > 0 ? 15.5 : 0; // Placeholder
      const customerRetentionRate = 68.2; // Placeholder
      const vendorRetentionRate = 85.1; // Placeholder

      // Top performing vendors
      const vendorPerformance = vendors
        .map((vendor) => {
          const vendorBookings = bookings.filter(
            (b) => b.vendorId === vendor.id,
          );
          const vendorRevenue = vendorBookings.reduce(
            (sum, b) => sum + b.vendorEarnings,
            0,
          );
          const avgRating = vendor.rating || 0;
          const completionRate =
            vendorBookings.length > 0
              ? (vendorBookings.filter((b) => b.status === "completed").length /
                  vendorBookings.length) *
                100
              : 0;

          return {
            vendorId: vendor.id,
            vendorName: vendor.businessName,
            totalBookings: vendorBookings.length,
            totalRevenue: vendorRevenue,
            avgRating,
            completionRate,
          };
        })
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 10);

      // Revenue by city (placeholder)
      const revenueByCity = [
        {
          cityId: "city1",
          cityName: "Mumbai",
          totalRevenue: totalRevenue * 0.35,
          totalBookings: Math.floor(totalBookings * 0.35),
          vendorCount: Math.floor(activeVendors * 0.3),
        },
        {
          cityId: "city2",
          cityName: "Delhi",
          totalRevenue: totalRevenue * 0.25,
          totalBookings: Math.floor(totalBookings * 0.25),
          vendorCount: Math.floor(activeVendors * 0.25),
        },
        {
          cityId: "city3",
          cityName: "Bangalore",
          totalRevenue: totalRevenue * 0.2,
          totalBookings: Math.floor(totalBookings * 0.2),
          vendorCount: Math.floor(activeVendors * 0.2),
        },
      ];

      // Booking trends (last 30 days)
      const bookingTrends = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];

        const dayBookings = bookings.filter((b) => {
          const bookingDate = b.createdAt.toDate().toISOString().split("T")[0];
          return bookingDate === dateStr;
        });

        return {
          date: dateStr,
          bookings: dayBookings.length,
          revenue: dayBookings.reduce((sum, b) => sum + b.finalPrice, 0),
        };
      }).reverse();

      // Membership growth (placeholder)
      const membershipGrowth = Array.from({ length: 12 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const month = date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
        });

        return {
          month,
          totalMembers: Math.floor(activeCustomers * (0.8 + i * 0.02)),
          newMembers: Math.floor(activeCustomers * 0.1),
          renewals: Math.floor(activeCustomers * 0.05),
        };
      }).reverse();

      return {
        totalRevenue,
        monthlyRevenue,
        totalBookings,
        activeVendors,
        activeCustomers,
        avgBookingValue,
        conversionRate,
        customerRetentionRate,
        vendorRetentionRate,
        topPerformingVendors: vendorPerformance,
        revenueByCity,
        bookingTrends,
        membershipGrowth,
      };
    } catch (error) {
      console.error("Error getting platform analytics:", error);
      throw error;
    }
  }

  /**
   * Flag vendor or customer
   */
  static async flagUser(
    userId: string,
    userType: "vendor" | "customer",
    reason: string,
    adminId: string,
  ): Promise<void> {
    try {
      const collection_name = userType === "vendor" ? "vendors" : "users";
      const userRef = doc(db, collection_name, userId);

      await updateDoc(userRef, {
        isFlagged: true,
        flagReason: reason,
        flaggedBy: adminId,
        flaggedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // Create audit log
      await addDoc(collection(db, "auditLogs"), {
        userId: adminId,
        userType: "admin",
        action: "flag_user",
        module: "user_management",
        entityId: userId,
        entityType: userType,
        newData: { isFlagged: true, reason },
        createdAt: Timestamp.now(),
      });

      console.log(`${userType} ${userId} flagged by admin ${adminId}`);
    } catch (error) {
      console.error("Error flagging user:", error);
      throw error;
    }
  }

  /**
   * Create dispute
   */
  static async createDispute(
    disputeData: Omit<Dispute, "id" | "createdAt" | "updatedAt">,
  ): Promise<string> {
    try {
      const dispute: Omit<Dispute, "id"> = {
        ...disputeData,
        createdAt: Timestamp.now() as any,
        updatedAt: Timestamp.now() as any,
      };

      const docRef = await addDoc(collection(db, "disputes"), dispute);
      return docRef.id;
    } catch (error) {
      console.error("Error creating dispute:", error);
      throw error;
    }
  }

  /**
   * Resolve dispute
   */
  static async resolveDispute(
    disputeId: string,
    resolution: string,
    adminId: string,
  ): Promise<void> {
    try {
      await updateDoc(doc(db, "disputes", disputeId), {
        status: "resolved",
        resolution,
        assignedTo: adminId,
        resolutionDate: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // Create audit log
      await addDoc(collection(db, "auditLogs"), {
        userId: adminId,
        userType: "admin",
        action: "resolve_dispute",
        module: "dispute_management",
        entityId: disputeId,
        entityType: "dispute",
        newData: { status: "resolved", resolution },
        createdAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error resolving dispute:", error);
      throw error;
    }
  }

  /**
   * Get franchise inquiries
   */
  static async getFranchiseInquiries(): Promise<FranchiseInquiry[]> {
    try {
      const q = query(
        collection(db, "franchiseInquiries"),
        orderBy("createdAt", "desc"),
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as FranchiseInquiry[];
    } catch (error) {
      console.error("Error getting franchise inquiries:", error);
      throw error;
    }
  }

  /**
   * Update franchise inquiry status
   */
  static async updateFranchiseInquiryStatus(
    inquiryId: string,
    status: FranchiseInquiry["status"],
    adminId: string,
    note?: string,
  ): Promise<void> {
    try {
      const updates: any = {
        status,
        assignedTo: adminId,
        updatedAt: Timestamp.now(),
      };

      if (note) {
        const inquiryDoc = await getDoc(
          doc(db, "franchiseInquiries", inquiryId),
        );
        const currentNotes = inquiryDoc.data()?.notes || [];
        updates.notes = [
          ...currentNotes,
          {
            note,
            addedBy: adminId,
            addedAt: Timestamp.now(),
          },
        ];
      }

      await updateDoc(doc(db, "franchiseInquiries", inquiryId), updates);
    } catch (error) {
      console.error("Error updating franchise inquiry:", error);
      throw error;
    }
  }

  /**
   * Generate business performance report
   */
  static async generateBusinessReport(): Promise<any> {
    try {
      const analytics = await this.getPlatformAnalytics();

      const report = {
        generatedAt: new Date().toISOString(),
        period: "Last 30 days",
        summary: {
          totalRevenue: analytics.totalRevenue,
          monthlyRevenue: analytics.monthlyRevenue,
          totalBookings: analytics.totalBookings,
          activeVendors: analytics.activeVendors,
          activeCustomers: analytics.activeCustomers,
          avgBookingValue: analytics.avgBookingValue,
        },
        performance: {
          conversionRate: analytics.conversionRate,
          customerRetentionRate: analytics.customerRetentionRate,
          vendorRetentionRate: analytics.vendorRetentionRate,
        },
        topVendors: analytics.topPerformingVendors.slice(0, 5),
        cityPerformance: analytics.revenueByCity,
        trends: analytics.bookingTrends.slice(-7), // Last 7 days
        membershipGrowth: analytics.membershipGrowth.slice(-3), // Last 3 months
      };

      return report;
    } catch (error) {
      console.error("Error generating business report:", error);
      throw error;
    }
  }

  /**
   * Get audit logs
   */
  static async getAuditLogs(
    limit: number = 100,
    userId?: string,
    module?: string,
  ): Promise<AuditLog[]> {
    try {
      let q = query(
        collection(db, "auditLogs"),
        orderBy("createdAt", "desc"),
        limit(limit),
      );

      if (userId) {
        q = query(q, where("userId", "==", userId));
      }

      if (module) {
        q = query(q, where("module", "==", module));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AuditLog[];
    } catch (error) {
      console.error("Error getting audit logs:", error);
      throw error;
    }
  }
}

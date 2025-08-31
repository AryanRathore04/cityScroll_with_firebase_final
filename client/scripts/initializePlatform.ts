import { collection, addDoc, setDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "../lib/firebase";

// Initialize platform with sample data
export async function initializePlatform() {
  try {
    console.log("Initializing CityScroll platform...");

    // 1. Create sample cities
    const cities = [
      {
        id: "mumbai",
        name: "Mumbai",
        state: "Maharashtra",
        isActive: true,
        vendorCount: 0,
        customerCount: 0,
        totalBookings: 0,
        totalRevenue: 0,
      },
      {
        id: "delhi",
        name: "Delhi",
        state: "Delhi",
        isActive: true,
        vendorCount: 0,
        customerCount: 0,
        totalBookings: 0,
        totalRevenue: 0,
      },
      {
        id: "bangalore",
        name: "Bangalore",
        state: "Karnataka",
        isActive: true,
        vendorCount: 0,
        customerCount: 0,
        totalBookings: 0,
        totalRevenue: 0,
      },
    ];

    for (const city of cities) {
      await setDoc(doc(db, "cities", city.id), city);
    }

    // 2. Create default promo codes
    const promoCodes = [
      {
        code: "WELCOME200",
        type: "first_time",
        value: 200,
        minOrderValue: 500,
        usageLimit: 10000,
        usedCount: 0,
        userLimit: 1,
        isActive: true,
        startDate: Timestamp.now(),
        endDate: Timestamp.fromDate(
          new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        ),
        applicableServices: [],
        applicableVendors: [],
        createdBy: "system",
        createdAt: Timestamp.now(),
      },
      {
        code: "SAVE50",
        type: "fixed",
        value: 50,
        minOrderValue: 300,
        usageLimit: 1000,
        usedCount: 0,
        userLimit: 3,
        isActive: true,
        startDate: Timestamp.now(),
        endDate: Timestamp.fromDate(
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        ),
        applicableServices: [],
        applicableVendors: [],
        createdBy: "system",
        createdAt: Timestamp.now(),
      },
    ];

    for (const promo of promoCodes) {
      await addDoc(collection(db, "promoCodes"), promo);
    }

    // 3. Create sample admin user
    const adminUser = {
      email: "admin@cityscroll.com",
      name: "Platform Admin",
      role: "super_admin",
      permissions: [
        {
          module: "vendors",
          actions: ["create", "read", "update", "delete", "approve"],
        },
        {
          module: "users",
          actions: ["create", "read", "update", "delete"],
        },
        {
          module: "bookings",
          actions: ["read", "update"],
        },
        {
          module: "analytics",
          actions: ["read"],
        },
      ],
      isActive: true,
      createdAt: Timestamp.now(),
    };

    await addDoc(collection(db, "admins"), adminUser);

    // 4. Create sample flash deal
    const flashDeal = {
      title: "Weekend Spa Special",
      description: "Relaxing full body massage at 50% off",
      vendorId: "sample_vendor",
      serviceId: "sample_service",
      originalPrice: 2000,
      discountedPrice: 1000,
      discountPercentage: 50,
      startTime: Timestamp.now(),
      endTime: Timestamp.fromDate(
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ),
      totalSlots: 20,
      bookedSlots: 0,
      isActive: true,
      createdAt: Timestamp.now(),
    };

    await addDoc(collection(db, "flashDeals"), flashDeal);

    console.log("✅ Platform initialized successfully!");
    console.log("📧 Admin email: admin@cityscroll.com");
    console.log("🎫 Promo codes: WELCOME200, SAVE50");
    console.log("🏙️ Cities: Mumbai, Delhi, Bangalore");
  } catch (error) {
    console.error("❌ Error initializing platform:", error);
    throw error;
  }
}

// Run initialization
if (typeof window !== "undefined") {
  // Only run in browser environment
  (window as any).initializePlatform = initializePlatform;
}

// @ts-nocheck
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  addDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "../lib/firebase";

export interface VendorService {
  id?: string;
  vendorId: string;
  name: string;
  description: string;
  category: string;
  duration: number; // in minutes
  price: number;
  imageUrl?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VendorProfile {
  id?: string;
  uid: string;
  businessName: string;
  businessType: string;
  businessAddress: string;
  city: string;
  phone: string;
  email: string;
  description: string;
  images: string[];
  rating: number;
  totalReviews: number;
  totalBookings: number;
  verified: boolean;
  isOpen: boolean;
  openingHours: {
    [key: string]: { open: string; close: string; closed: boolean };
  };
  amenities: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Booking {
  id?: string;
  customerId: string;
  vendorId: string;
  serviceId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  bookingDate: Date;
  bookingTime: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id?: string;
  customerId: string;
  vendorId: string;
  bookingId: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

class VendorService {
  // Get vendor profile
  async getVendorProfile(uid: string): Promise<VendorProfile | null> {
    try {
      const vendorDoc = await getDoc(doc(db, "vendors", uid));
      if (!vendorDoc.exists()) return null;

      return { id: vendorDoc.id, ...vendorDoc.data() } as VendorProfile;
    } catch (error) {
      console.error("Error getting vendor profile:", error);
      return null;
    }
  }

  // Update vendor profile
  async updateVendorProfile(
    uid: string,
    updates: Partial<VendorProfile>,
  ): Promise<void> {
    try {
      await setDoc(
        doc(db, "vendors", uid),
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

  // Create vendor profile
  async createVendorProfile(
    profile: Omit<VendorProfile, "id" | "createdAt" | "updatedAt">,
  ): Promise<void> {
    try {
      await setDoc(doc(db, "vendors", profile.uid), {
        ...profile,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Upload vendor image
  async uploadVendorImage(vendorId: string, file: File): Promise<string> {
    try {
      const timestamp = Date.now();
      const imageRef = ref(
        storage,
        `vendors/${vendorId}/images/${timestamp}_${file.name}`,
      );
      const snapshot = await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Get vendor services
  async getVendorServices(vendorId: string): Promise<VendorService[]> {
    try {
      const servicesQuery = query(
        collection(db, "services"),
        where("vendorId", "==", vendorId),
        orderBy("createdAt", "desc"),
      );

      const snapshot = await getDocs(servicesQuery);
      return snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as VendorService,
      );
    } catch (error) {
      console.error("Error getting vendor services:", error);
      return [];
    }
  }

  // Add new service
  async addService(
    service: Omit<VendorService, "id" | "createdAt" | "updatedAt">,
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, "services"), {
        ...service,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return docRef.id;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Update service
  async updateService(
    serviceId: string,
    updates: Partial<VendorService>,
  ): Promise<void> {
    try {
      await updateDoc(doc(db, "services", serviceId), {
        ...updates,
        updatedAt: new Date(),
      });
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Delete service
  async deleteService(serviceId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "services", serviceId));
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Get vendor bookings
  async getVendorBookings(
    vendorId: string,
    status?: string,
  ): Promise<Booking[]> {
    try {
      let bookingsQuery = query(
        collection(db, "bookings"),
        where("vendorId", "==", vendorId),
        orderBy("bookingDate", "desc"),
      );

      if (status) {
        bookingsQuery = query(
          collection(db, "bookings"),
          where("vendorId", "==", vendorId),
          where("status", "==", status),
          orderBy("bookingDate", "desc"),
        );
      }

      const snapshot = await getDocs(bookingsQuery);
      return snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Booking,
      );
    } catch (error) {
      console.error("Error getting vendor bookings:", error);
      return [];
    }
  }

  // Update booking status
  async updateBookingStatus(bookingId: string, status: string): Promise<void> {
    try {
      await updateDoc(doc(db, "bookings", bookingId), {
        status,
        updatedAt: new Date(),
      });
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Get vendor reviews
  async getVendorReviews(vendorId: string): Promise<Review[]> {
    try {
      const reviewsQuery = query(
        collection(db, "reviews"),
        where("vendorId", "==", vendorId),
        orderBy("createdAt", "desc"),
      );

      const snapshot = await getDocs(reviewsQuery);
      return snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Review,
      );
    } catch (error) {
      console.error("Error getting vendor reviews:", error);
      return [];
    }
  }

  // Get vendor analytics
  async getVendorAnalytics(vendorId: string): Promise<{
    totalBookings: number;
    pendingBookings: number;
    completedBookings: number;
    totalRevenue: number;
    averageRating: number;
    totalReviews: number;
  }> {
    try {
      const bookings = await this.getVendorBookings(vendorId);
      const reviews = await this.getVendorReviews(vendorId);

      const totalBookings = bookings.length;
      const pendingBookings = bookings.filter(
        (b) => b.status === "pending",
      ).length;
      const completedBookings = bookings.filter(
        (b) => b.status === "completed",
      ).length;
      const totalRevenue = bookings
        .filter((b) => b.status === "completed")
        .reduce((sum, b) => sum + b.servicePrice, 0);

      const averageRating =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;

      return {
        totalBookings,
        pendingBookings,
        completedBookings,
        totalRevenue,
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: reviews.length,
      };
    } catch (error) {
      console.error("Error getting vendor analytics:", error);
      return {
        totalBookings: 0,
        pendingBookings: 0,
        completedBookings: 0,
        totalRevenue: 0,
        averageRating: 0,
        totalReviews: 0,
      };
    }
  }

  // Search vendors
  async searchVendors(searchParams: {
    city?: string;
    serviceType?: string;
    priceRange?: string;
    rating?: number;
  }): Promise<VendorProfile[]> {
    try {
      let vendorsQuery = query(
        collection(db, "vendors"),
        where("verified", "==", true),
        orderBy("rating", "desc"),
      );

      if (searchParams.city) {
        vendorsQuery = query(
          collection(db, "vendors"),
          where("city", "==", searchParams.city),
          where("verified", "==", true),
          orderBy("rating", "desc"),
        );
      }

      const snapshot = await getDocs(vendorsQuery);
      let vendors = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as VendorProfile,
      );

      // Apply additional filters
      if (searchParams.rating) {
        vendors = vendors.filter((v) => v.rating >= searchParams.rating!);
      }

      return vendors;
    } catch (error) {
      console.error("Error searching vendors:", error);
      return [];
    }
  }
}

export const vendorService = new VendorService();

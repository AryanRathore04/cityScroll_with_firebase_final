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
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../lib/firebase";
import { VendorOnboarding, Vendor, VendorService } from "../types/platform";

export class VendorOnboardingService {
  /**
   * Start vendor onboarding process
   */
  static async startOnboarding(vendorId: string): Promise<string> {
    try {
      const onboarding: Omit<VendorOnboarding, "id"> = {
        vendorId,
        step: 1,
        totalSteps: 6,
        completedSteps: [false, false, false, false, false, false],
        businessDetails: {
          name: "",
          description: "",
          address: "",
          cityId: "",
          phone: "",
          email: "",
        },
        services: [],
        operatingHours: {
          monday: { isOpen: false, openTime: "09:00", closeTime: "18:00" },
          tuesday: { isOpen: false, openTime: "09:00", closeTime: "18:00" },
          wednesday: { isOpen: false, openTime: "09:00", closeTime: "18:00" },
          thursday: { isOpen: false, openTime: "09:00", closeTime: "18:00" },
          friday: { isOpen: false, openTime: "09:00", closeTime: "18:00" },
          saturday: { isOpen: false, openTime: "09:00", closeTime: "18:00" },
          sunday: { isOpen: false, openTime: "09:00", closeTime: "18:00" },
        },
        images: [],
        kycDocuments: {},
        bankDetails: {
          accountNumber: "",
          ifscCode: "",
          accountHolderName: "",
          bankName: "",
        },
        status: "pending",
        createdAt: Timestamp.now() as any,
        updatedAt: Timestamp.now() as any,
      };

      const docRef = await addDoc(
        collection(db, "vendorOnboarding"),
        onboarding,
      );

      // Update vendor onboarding status
      await updateDoc(doc(db, "vendors", vendorId), {
        onboardingStatus: "in_progress",
        updatedAt: Timestamp.now(),
      });

      return docRef.id;
    } catch (error) {
      console.error("Error starting onboarding:", error);
      throw error;
    }
  }

  /**
   * Save business details (Step 1)
   */
  static async saveBusinessDetails(
    onboardingId: string,
    businessDetails: VendorOnboarding["businessDetails"],
  ): Promise<void> {
    try {
      const onboardingRef = doc(db, "vendorOnboarding", onboardingId);
      const onboardingDoc = await getDoc(onboardingRef);

      if (!onboardingDoc.exists()) {
        throw new Error("Onboarding not found");
      }

      const currentData = onboardingDoc.data() as VendorOnboarding;
      const updatedSteps = [...currentData.completedSteps];
      updatedSteps[0] = true;

      await updateDoc(onboardingRef, {
        businessDetails,
        completedSteps: updatedSteps,
        step: Math.max(currentData.step, 2),
        updatedAt: Timestamp.now(),
      });

      console.log("Business details saved for onboarding:", onboardingId);
    } catch (error) {
      console.error("Error saving business details:", error);
      throw error;
    }
  }

  /**
   * Save services (Step 2)
   */
  static async saveServices(
    onboardingId: string,
    services: VendorService[],
  ): Promise<void> {
    try {
      const onboardingRef = doc(db, "vendorOnboarding", onboardingId);
      const onboardingDoc = await getDoc(onboardingRef);

      if (!onboardingDoc.exists()) {
        throw new Error("Onboarding not found");
      }

      const currentData = onboardingDoc.data() as VendorOnboarding;
      const updatedSteps = [...currentData.completedSteps];
      updatedSteps[1] = true;

      await updateDoc(onboardingRef, {
        services,
        completedSteps: updatedSteps,
        step: Math.max(currentData.step, 3),
        updatedAt: Timestamp.now(),
      });

      console.log("Services saved for onboarding:", onboardingId);
    } catch (error) {
      console.error("Error saving services:", error);
      throw error;
    }
  }

  /**
   * Save operating hours (Step 3)
   */
  static async saveOperatingHours(
    onboardingId: string,
    operatingHours: VendorOnboarding["operatingHours"],
  ): Promise<void> {
    try {
      const onboardingRef = doc(db, "vendorOnboarding", onboardingId);
      const onboardingDoc = await getDoc(onboardingRef);

      if (!onboardingDoc.exists()) {
        throw new Error("Onboarding not found");
      }

      const currentData = onboardingDoc.data() as VendorOnboarding;
      const updatedSteps = [...currentData.completedSteps];
      updatedSteps[2] = true;

      await updateDoc(onboardingRef, {
        operatingHours,
        completedSteps: updatedSteps,
        step: Math.max(currentData.step, 4),
        updatedAt: Timestamp.now(),
      });

      console.log("Operating hours saved for onboarding:", onboardingId);
    } catch (error) {
      console.error("Error saving operating hours:", error);
      throw error;
    }
  }

  /**
   * Upload and save images (Step 4)
   */
  static async uploadImages(
    onboardingId: string,
    vendorId: string,
    imageFiles: File[],
  ): Promise<string[]> {
    try {
      const uploadPromises = imageFiles.map(async (file, index) => {
        const imageRef = ref(
          storage,
          `vendors/${vendorId}/onboarding/image_${index}_${Date.now()}`,
        );
        const snapshot = await uploadBytes(imageRef, file);
        return await getDownloadURL(snapshot.ref);
      });

      const imageUrls = await Promise.all(uploadPromises);

      const onboardingRef = doc(db, "vendorOnboarding", onboardingId);
      const onboardingDoc = await getDoc(onboardingRef);

      if (!onboardingDoc.exists()) {
        throw new Error("Onboarding not found");
      }

      const currentData = onboardingDoc.data() as VendorOnboarding;
      const updatedSteps = [...currentData.completedSteps];
      updatedSteps[3] = true;

      await updateDoc(onboardingRef, {
        images: imageUrls,
        completedSteps: updatedSteps,
        step: Math.max(currentData.step, 5),
        updatedAt: Timestamp.now(),
      });

      console.log("Images uploaded for onboarding:", onboardingId);
      return imageUrls;
    } catch (error) {
      console.error("Error uploading images:", error);
      throw error;
    }
  }

  /**
   * Upload KYC documents (Step 5)
   */
  static async uploadKYCDocuments(
    onboardingId: string,
    vendorId: string,
    documents: { [key: string]: File },
  ): Promise<{ [key: string]: string }> {
    try {
      const uploadPromises = Object.entries(documents).map(
        async ([docType, file]) => {
          const docRef = ref(
            storage,
            `vendors/${vendorId}/kyc/${docType}_${Date.now()}`,
          );
          const snapshot = await uploadBytes(docRef, file);
          const url = await getDownloadURL(snapshot.ref);
          return [docType, url];
        },
      );

      const uploadedDocs = await Promise.all(uploadPromises);
      const kycDocuments = Object.fromEntries(uploadedDocs);

      const onboardingRef = doc(db, "vendorOnboarding", onboardingId);
      const onboardingDoc = await getDoc(onboardingRef);

      if (!onboardingDoc.exists()) {
        throw new Error("Onboarding not found");
      }

      const currentData = onboardingDoc.data() as VendorOnboarding;
      const updatedSteps = [...currentData.completedSteps];
      updatedSteps[4] = true;

      await updateDoc(onboardingRef, {
        kycDocuments,
        completedSteps: updatedSteps,
        step: Math.max(currentData.step, 6),
        updatedAt: Timestamp.now(),
      });

      // Update vendor KYC status
      await updateDoc(doc(db, "vendors", vendorId), {
        kycStatus: "submitted",
        updatedAt: Timestamp.now(),
      });

      console.log("KYC documents uploaded for onboarding:", onboardingId);
      return kycDocuments;
    } catch (error) {
      console.error("Error uploading KYC documents:", error);
      throw error;
    }
  }

  /**
   * Save bank details (Step 6)
   */
  static async saveBankDetails(
    onboardingId: string,
    bankDetails: VendorOnboarding["bankDetails"],
  ): Promise<void> {
    try {
      const onboardingRef = doc(db, "vendorOnboarding", onboardingId);
      const onboardingDoc = await getDoc(onboardingRef);

      if (!onboardingDoc.exists()) {
        throw new Error("Onboarding not found");
      }

      const currentData = onboardingDoc.data() as VendorOnboarding;
      const updatedSteps = [...currentData.completedSteps];
      updatedSteps[5] = true;

      const isComplete = updatedSteps.every((step) => step);

      await updateDoc(onboardingRef, {
        bankDetails,
        completedSteps: updatedSteps,
        status: isComplete ? "submitted" : "in_progress",
        submittedAt: isComplete ? Timestamp.now() : undefined,
        updatedAt: Timestamp.now(),
      });

      if (isComplete) {
        // Update vendor status
        await updateDoc(doc(db, "vendors", currentData.vendorId), {
          onboardingStatus: "submitted",
          updatedAt: Timestamp.now(),
        });
      }

      console.log("Bank details saved for onboarding:", onboardingId);
    } catch (error) {
      console.error("Error saving bank details:", error);
      throw error;
    }
  }

  /**
   * Get onboarding progress
   */
  static async getOnboardingProgress(
    vendorId: string,
  ): Promise<VendorOnboarding | null> {
    try {
      const q = query(
        collection(db, "vendorOnboarding"),
        where("vendorId", "==", vendorId),
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as VendorOnboarding;
    } catch (error) {
      console.error("Error getting onboarding progress:", error);
      throw error;
    }
  }

  /**
   * Submit onboarding for review
   */
  static async submitForReview(onboardingId: string): Promise<void> {
    try {
      const onboardingRef = doc(db, "vendorOnboarding", onboardingId);
      const onboardingDoc = await getDoc(onboardingRef);

      if (!onboardingDoc.exists()) {
        throw new Error("Onboarding not found");
      }

      const onboarding = onboardingDoc.data() as VendorOnboarding;

      // Check if all steps are completed
      if (!onboarding.completedSteps.every((step) => step)) {
        throw new Error("Please complete all steps before submitting");
      }

      await updateDoc(onboardingRef, {
        status: "submitted",
        submittedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // Update vendor status
      await updateDoc(doc(db, "vendors", onboarding.vendorId), {
        onboardingStatus: "submitted",
        kycStatus: "submitted",
        updatedAt: Timestamp.now(),
      });

      // TODO: Send notification to admin about new submission

      console.log("Onboarding submitted for review:", onboardingId);
    } catch (error) {
      console.error("Error submitting for review:", error);
      throw error;
    }
  }

  /**
   * Request edit from admin
   */
  static async requestEdit(
    onboardingId: string,
    adminNotes: string,
  ): Promise<void> {
    try {
      const onboardingRef = doc(db, "vendorOnboarding", onboardingId);
      const onboardingDoc = await getDoc(onboardingRef);

      if (!onboardingDoc.exists()) {
        throw new Error("Onboarding not found");
      }

      const onboarding = onboardingDoc.data() as VendorOnboarding;

      await updateDoc(onboardingRef, {
        status: "in_progress",
        adminNotes,
        updatedAt: Timestamp.now(),
      });

      // Update vendor status
      await updateDoc(doc(db, "vendors", onboarding.vendorId), {
        onboardingStatus: "in_progress",
        updatedAt: Timestamp.now(),
      });

      // TODO: Send notification to vendor about edit request

      console.log("Edit requested for onboarding:", onboardingId);
    } catch (error) {
      console.error("Error requesting edit:", error);
      throw error;
    }
  }

  /**
   * Complete vendor profile after approval
   */
  static async completeVendorProfile(
    vendorId: string,
    onboardingData: VendorOnboarding,
  ): Promise<void> {
    try {
      const vendorRef = doc(db, "vendors", vendorId);

      const vendorData: Partial<Vendor> = {
        businessName: onboardingData.businessDetails.name,
        description: onboardingData.businessDetails.description,
        address: onboardingData.businessDetails.address,
        cityId: onboardingData.businessDetails.cityId,
        phone: onboardingData.businessDetails.phone,
        email: onboardingData.businessDetails.email,
        services: onboardingData.services,
        operatingHours: onboardingData.operatingHours,
        images: onboardingData.images,
        isVerified: true,
        onboardingStatus: "completed",
        kycStatus: "approved",
        commissionRate: 0.22, // 22% commission
        totalEarnings: 0,
        pendingPayouts: 0,
        updatedAt: Timestamp.now() as any,
      };

      await updateDoc(vendorRef, vendorData);

      console.log("Vendor profile completed:", vendorId);
    } catch (error) {
      console.error("Error completing vendor profile:", error);
      throw error;
    }
  }

  /**
   * Get vendor onboarding checklist
   */
  static getOnboardingChecklist(): Array<{
    step: number;
    title: string;
    description: string;
    required: boolean;
  }> {
    return [
      {
        step: 1,
        title: "Business Details",
        description: "Provide your business name, description, and location",
        required: true,
      },
      {
        step: 2,
        title: "Services & Pricing",
        description: "Add your services with pricing and duration",
        required: true,
      },
      {
        step: 3,
        title: "Operating Hours",
        description: "Set your business hours for each day of the week",
        required: true,
      },
      {
        step: 4,
        title: "Photos",
        description: "Upload photos of your salon/spa and services",
        required: true,
      },
      {
        step: 5,
        title: "KYC Documents",
        description:
          "Upload required documents (Aadhar, PAN, Business License)",
        required: true,
      },
      {
        step: 6,
        title: "Bank Details",
        description: "Provide bank account details for payments",
        required: true,
      },
    ];
  }
}

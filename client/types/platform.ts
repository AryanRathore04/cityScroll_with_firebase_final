export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: "customer" | "vendor" | "admin";
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  cityId?: string;
  loyaltyPoints: number;
  totalBookings: number;
  isFirstTimeUser: boolean;
  referralCode: string;
  referredBy?: string;
  membershipStatus: "none" | "basic" | "premium" | "vip";
  membershipExpiry?: Date;
}

export interface Vendor {
  id: string;
  userId: string;
  businessName: string;
  description: string;
  address: string;
  cityId: string;
  phone: string;
  email: string;
  images: string[];
  services: VendorService[];
  operatingHours: OperatingHours;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isPremium: boolean;
  premiumExpiry?: Date;
  subscriptionStatus: "active" | "expired" | "cancelled";
  subscriptionExpiry?: Date;
  onboardingStatus: "pending" | "in_progress" | "completed" | "rejected";
  kycStatus: "pending" | "submitted" | "approved" | "rejected";
  commissionRate: number;
  totalEarnings: number;
  pendingPayouts: number;
  createdAt: Date;
  updatedAt: Date;
  isFlagged: boolean;
  flagReason?: string;
}

export interface VendorService {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  category: "hair" | "spa" | "massage" | "facial" | "nail" | "beauty";
  isActive: boolean;
  images: string[];
  addOns: AddOnService[];
}

export interface AddOnService {
  id: string;
  name: string;
  price: number;
  duration: number;
}

export interface OperatingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  breakStart?: string;
  breakEnd?: string;
}

export interface Booking {
  id: string;
  customerId: string;
  vendorId: string;
  serviceId: string;
  addOnServices: string[];
  date: Date;
  timeSlot: string;
  duration: number;
  basePrice: number;
  addOnPrice: number;
  totalPrice: number;
  discountAmount: number;
  finalPrice: number;
  commissionAmount: number;
  vendorEarnings: number;
  status:
    | "pending"
    | "confirmed"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "no_show";
  paymentStatus: "pending" | "paid" | "refunded" | "failed";
  paymentMethod: "card" | "wallet" | "cash" | "upi";
  loyaltyPointsEarned: number;
  loyaltyPointsUsed: number;
  promoCode?: string;
  promoDiscount: number;
  cancellationReason?: string;
  cancellationTokens?: number;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
}

export interface Review {
  id: string;
  bookingId: string;
  customerId: string;
  vendorId: string;
  rating: number;
  comment: string;
  images: string[];
  response?: string;
  responseDate?: Date;
  createdAt: Date;
  isVerified: boolean;
  isHidden: boolean;
}

export interface Transaction {
  id: string;
  type:
    | "booking"
    | "commission"
    | "subscription"
    | "premium_listing"
    | "payout"
    | "refund";
  bookingId?: string;
  vendorId?: string;
  customerId?: string;
  amount: number;
  commissionAmount?: number;
  description: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  paymentMethod?: string;
  paymentId?: string;
  createdAt: Date;
  processedAt?: Date;
}

export interface LoyaltyTransaction {
  id: string;
  customerId: string;
  type: "earned" | "redeemed" | "expired";
  points: number;
  bookingId?: string;
  description: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface PromoCode {
  id: string;
  code: string;
  type: "percentage" | "fixed" | "first_time";
  value: number;
  minOrderValue: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  userLimit: number;
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  applicableServices: string[];
  applicableVendors: string[];
  createdBy: string;
  createdAt: Date;
}

export interface FlashDeal {
  id: string;
  title: string;
  description: string;
  vendorId: string;
  serviceId: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  startTime: Date;
  endTime: Date;
  totalSlots: number;
  bookedSlots: number;
  isActive: boolean;
  createdAt: Date;
}

export interface Referral {
  id: string;
  referrerId: string;
  referredUserId?: string;
  referredEmail: string;
  referralCode: string;
  status: "invited" | "signed_up" | "first_booking" | "rewarded";
  rewardAmount: number;
  isRewardClaimed: boolean;
  createdAt: Date;
  signedUpAt?: Date;
  firstBookingAt?: Date;
  rewardClaimedAt?: Date;
}

export interface Subscription {
  id: string;
  vendorId: string;
  plan: "basic" | "premium" | "enterprise";
  amount: number;
  startDate: Date;
  endDate: Date;
  status: "active" | "expired" | "cancelled";
  paymentStatus: "paid" | "pending" | "failed";
  autoRenewal: boolean;
  createdAt: Date;
  renewedAt?: Date;
}

export interface PremiumListing {
  id: string;
  vendorId: string;
  plan: "featured" | "spotlight" | "premium";
  amount: number;
  startDate: Date;
  endDate: Date;
  status: "active" | "expired" | "cancelled";
  paymentStatus: "paid" | "pending" | "failed";
  benefits: string[];
  createdAt: Date;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "super_admin" | "admin" | "moderator";
  permissions: AdminPermission[];
  createdAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
}

export interface AdminPermission {
  module: string;
  actions: ("create" | "read" | "update" | "delete" | "approve")[];
}

export interface VendorOnboarding {
  id: string;
  vendorId: string;
  step: number;
  totalSteps: number;
  completedSteps: boolean[];
  businessDetails: {
    name: string;
    description: string;
    address: string;
    cityId: string;
    phone: string;
    email: string;
  };
  services: VendorService[];
  operatingHours: OperatingHours;
  images: string[];
  kycDocuments: {
    aadhar?: string;
    pan?: string;
    businessLicense?: string;
    gst?: string;
  };
  bankDetails: {
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
    bankName: string;
  };
  status: "pending" | "in_progress" | "submitted" | "approved" | "rejected";
  rejectionReason?: string;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
}

export interface City {
  id: string;
  name: string;
  state: string;
  isActive: boolean;
  vendorCount: number;
  customerCount: number;
  totalBookings: number;
  totalRevenue: number;
}

export interface Dispute {
  id: string;
  bookingId: string;
  customerId: string;
  vendorId: string;
  type: "service_quality" | "no_show" | "billing" | "refund" | "other";
  description: string;
  images: string[];
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  assignedTo?: string;
  resolution?: string;
  resolutionDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  id: string;
  userId: string;
  userType: "admin" | "vendor" | "customer";
  action: string;
  module: string;
  entityId: string;
  entityType: string;
  oldData?: any;
  newData?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface FranchiseInquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  businessExperience: string;
  investmentCapacity: string;
  message: string;
  status: "new" | "contacted" | "interested" | "rejected" | "converted";
  assignedTo?: string;
  notes: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Analytics {
  totalRevenue: number;
  monthlyRevenue: number;
  totalBookings: number;
  activeVendors: number;
  activeCustomers: number;
  avgBookingValue: number;
  conversionRate: number;
  customerRetentionRate: number;
  vendorRetentionRate: number;
  topPerformingVendors: VendorPerformance[];
  revenueByCity: CityRevenue[];
  bookingTrends: BookingTrend[];
  membershipGrowth: MembershipGrowth[];
}

export interface VendorPerformance {
  vendorId: string;
  vendorName: string;
  totalBookings: number;
  totalRevenue: number;
  avgRating: number;
  completionRate: number;
}

export interface CityRevenue {
  cityId: string;
  cityName: string;
  totalRevenue: number;
  totalBookings: number;
  vendorCount: number;
}

export interface BookingTrend {
  date: string;
  bookings: number;
  revenue: number;
}

export interface MembershipGrowth {
  month: string;
  totalMembers: number;
  newMembers: number;
  renewals: number;
}

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PageLoading } from "@/components/ui/loading";
import {
  ToastNotification,
  useToasts,
} from "@/components/ui/toast-notification";
import { useAuth } from "@/hooks/useAuth";
import {
  vendorService,
  type VendorProfile,
  type VendorService as Service,
  type Booking,
} from "@/services/vendor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Leaf,
  DollarSign,
  Calendar,
  Users,
  Star,
  Plus,
  Edit,
  Trash2,
  Upload,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Settings,
  LogOut,
  ArrowLeft,
} from "lucide-react";

export default function VendorDashboard() {
  const { user, userProfile, signOut } = useAuth();
  const { toasts, removeToast, showSuccess, showError } = useToasts();

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(
    null,
  );
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [analytics, setAnalytics] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    averageRating: 0,
    totalReviews: 0,
  });

  // Service form state
  const [serviceForm, setServiceForm] = useState({
    name: "",
    description: "",
    category: "",
    duration: 30,
    price: 0,
    active: true,
  });
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    businessName: "",
    businessType: "",
    businessAddress: "",
    city: "",
    phone: "",
    description: "",
    amenities: [] as string[],
  });

  useEffect(() => {
    if (user && userProfile?.userType === "vendor") {
      loadVendorData();
    } else if (!isLoading) {
      // Redirect non-vendor users
      window.location.href = "/signin";
    }
  }, [user, userProfile]);

  const loadVendorData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Load vendor profile
      const profile = await vendorService.getVendorProfile(user.uid);
      setVendorProfile(profile);

      if (profile) {
        setProfileForm({
          businessName: profile.businessName,
          businessType: profile.businessType,
          businessAddress: profile.businessAddress,
          city: profile.city,
          phone: profile.phone,
          description: profile.description,
          amenities: profile.amenities || [],
        });
      }

      // Load services
      const vendorServices = await vendorService.getVendorServices(user.uid);
      setServices(vendorServices as any);

      // Load bookings
      const vendorBookings = await vendorService.getVendorBookings(user.uid);
      setBookings(vendorBookings);

      // Load analytics
      const analyticsData = await vendorService.getVendorAnalytics(user.uid);
      setAnalytics(analyticsData);
    } catch (error: any) {
      showError("Failed to load dashboard data: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      await vendorService.updateVendorProfile(user.uid, {
        ...profileForm,
        uid: user.uid,
        email: user.email || "",
        images: vendorProfile?.images || [],
        rating: vendorProfile?.rating || 0,
        totalReviews: vendorProfile?.totalReviews || 0,
        totalBookings: vendorProfile?.totalBookings || 0,
        verified: vendorProfile?.verified || false,
        isOpen: vendorProfile?.isOpen || true,
        openingHours: vendorProfile?.openingHours || {},
      });

      showSuccess("Profile updated successfully!");
      loadVendorData();
    } catch (error: any) {
      showError("Failed to update profile: " + error.message);
    }
  };

  const handleServiceSubmit = async () => {
    if (!user) return;

    try {
      if (editingService) {
        await vendorService.updateService(editingService.id!, serviceForm as any);
        showSuccess("Service updated successfully!");
      } else {
        await vendorService.addService({
          ...serviceForm,
          vendorId: user.uid,
        } as any);
        showSuccess("Service added successfully!");
      }

      setIsServiceDialogOpen(false);
      setEditingService(null);
      setServiceForm({
        name: "",
        description: "",
        category: "",
        duration: 30,
        price: 0,
        active: true,
      });
      loadVendorData();
    } catch (error: any) {
      showError("Failed to save service: " + error.message);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;

    try {
      await vendorService.deleteService(serviceId);
      showSuccess("Service deleted successfully!");
      loadVendorData();
    } catch (error: any) {
      showError("Failed to delete service: " + error.message);
    }
  };

  const handleUpdateBookingStatus = async (
    bookingId: string,
    status: string,
  ) => {
    try {
      await vendorService.updateBookingStatus(bookingId, status);
      showSuccess(`Booking ${status} successfully!`);
      loadVendorData();
    } catch (error: any) {
      showError("Failed to update booking: " + error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = "/";
    } catch (error: any) {
      showError("Failed to sign out: " + error.message);
    }
  };

  if (isLoading) {
    return <PageLoading />;
  }

  if (!user || userProfile?.userType !== "vendor") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-heading text-foreground mb-4">
            Access Denied
          </h1>
          <p className="text-muted-foreground font-body mb-6">
            You don't have permission to access the vendor dashboard.
          </p>
          <Button onClick={() => (window.location.href = "/")}>
            Go to Homepage
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <ToastNotification toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => (window.location.href = "/")}
              >
                <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Leaf className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-xl font-heading text-foreground">
                  CityScroll
                </span>
              </div>
              <Badge variant="secondary" className="ml-4">
                Vendor Dashboard
              </Badge>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => (window.location.href = "/")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Site
              </Button>
              <Button variant="ghost" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 space-y-2">
            <nav className="space-y-2">
              {[
                { id: "overview", label: "Overview", icon: BarChart3 },
                { id: "bookings", label: "Bookings", icon: Calendar },
                { id: "services", label: "Services", icon: Settings },
                { id: "profile", label: "Profile", icon: Users },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === item.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="font-body">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-3xl font-heading text-foreground">
                    Welcome back, {vendorProfile?.businessName || "Partner"}!
                  </h1>
                </div>

                {/* Analytics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-card p-6 rounded-lg border border-border">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-full">
                        <Calendar className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-body text-muted-foreground">
                          Total Bookings
                        </p>
                        <p className="text-2xl font-heading text-foreground">
                          {analytics.totalBookings}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card p-6 rounded-lg border border-border">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-cta/10 rounded-full">
                        <DollarSign className="h-6 w-6 text-cta" />
                      </div>
                      <div>
                        <p className="text-sm font-body text-muted-foreground">
                          Total Revenue
                        </p>
                        <p className="text-2xl font-heading text-foreground">
                          ₹{analytics.totalRevenue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card p-6 rounded-lg border border-border">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-secondary/20 rounded-full">
                        <Star className="h-6 w-6 text-secondary" />
                      </div>
                      <div>
                        <p className="text-sm font-body text-muted-foreground">
                          Average Rating
                        </p>
                        <p className="text-2xl font-heading text-foreground">
                          {analytics.averageRating}/5
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card p-6 rounded-lg border border-border">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-amber-500/10 rounded-full">
                        <Clock className="h-6 w-6 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-body text-muted-foreground">
                          Pending Bookings
                        </p>
                        <p className="text-2xl font-heading text-foreground">
                          {analytics.pendingBookings}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card p-6 rounded-lg border border-border">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-emerald-500/10 rounded-full">
                        <CheckCircle className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-body text-muted-foreground">
                          Completed
                        </p>
                        <p className="text-2xl font-heading text-foreground">
                          {analytics.completedBookings}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card p-6 rounded-lg border border-border">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-500/10 rounded-full">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-body text-muted-foreground">
                          Total Reviews
                        </p>
                        <p className="text-2xl font-heading text-foreground">
                          {analytics.totalReviews}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Bookings */}
                <div className="bg-card p-6 rounded-lg border border-border">
                  <h2 className="text-xl font-heading text-foreground mb-4">
                    Recent Bookings
                  </h2>
                  <div className="space-y-4">
                    {bookings.slice(0, 5).map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                      >
                        <div>
                          <p className="font-body text-foreground">
                            {booking.customerName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {booking.serviceName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {booking.bookingDate.toLocaleDateString()} at{" "}
                            {booking.bookingTime}
                          </p>
                        </div>
                        <Badge
                          variant={
                            booking.status === "completed"
                              ? "default"
                              : booking.status === "pending"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {booking.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "bookings" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-3xl font-heading text-foreground">
                    Bookings
                  </h1>
                </div>

                <div className="bg-card rounded-lg border border-border overflow-hidden">
                  <div className="p-6">
                    <h2 className="text-xl font-heading text-foreground mb-4">
                      All Bookings
                    </h2>
                  </div>
                  <div className="space-y-1">
                    {bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-6 border-t border-border"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="font-heading text-foreground">
                                {booking.customerName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {booking.customerEmail}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {booking.customerPhone}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="font-body text-foreground">
                              {booking.serviceName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {booking.bookingDate.toLocaleDateString()} at{" "}
                              {booking.bookingTime}
                            </p>
                            <p className="text-sm font-body text-foreground">
                              ₹{booking.servicePrice}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              booking.status === "completed"
                                ? "default"
                                : booking.status === "pending"
                                  ? "secondary"
                                  : booking.status === "confirmed"
                                    ? "default"
                                    : "destructive"
                            }
                          >
                            {booking.status}
                          </Badge>
                          {booking.status === "pending" && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleUpdateBookingStatus(
                                    booking.id!,
                                    "confirmed",
                                  )
                                }
                                className="bg-emerald-600 hover:bg-emerald-700"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  handleUpdateBookingStatus(
                                    booking.id!,
                                    "cancelled",
                                  )
                                }
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          {booking.status === "confirmed" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                handleUpdateBookingStatus(
                                  booking.id!,
                                  "completed",
                                )
                              }
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "services" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-3xl font-heading text-foreground">
                    Services
                  </h1>
                  <Dialog
                    open={isServiceDialogOpen}
                    onOpenChange={setIsServiceDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Service
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingService ? "Edit Service" : "Add New Service"}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="serviceName">Service Name</Label>
                          <Input
                            id="serviceName"
                            value={serviceForm.name}
                            onChange={(e) =>
                              setServiceForm({
                                ...serviceForm,
                                name: e.target.value,
                              })
                            }
                            placeholder="e.g., Swedish Massage"
                          />
                        </div>
                        <div>
                          <Label htmlFor="serviceDescription">
                            Description
                          </Label>
                          <Textarea
                            id="serviceDescription"
                            value={serviceForm.description}
                            onChange={(e) =>
                              setServiceForm({
                                ...serviceForm,
                                description: e.target.value,
                              })
                            }
                            placeholder="Describe your service..."
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="serviceCategory">Category</Label>
                            <Select
                              value={serviceForm.category}
                              onValueChange={(value) =>
                                setServiceForm({
                                  ...serviceForm,
                                  category: value,
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="hair">Hair Care</SelectItem>
                                <SelectItem value="spa">
                                  Spa & Wellness
                                </SelectItem>
                                <SelectItem value="facial">
                                  Facial & Skincare
                                </SelectItem>
                                <SelectItem value="massage">Massage</SelectItem>
                                <SelectItem value="nails">Nail Care</SelectItem>
                                <SelectItem value="makeup">Makeup</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="serviceDuration">
                              Duration (minutes)
                            </Label>
                            <Input
                              id="serviceDuration"
                              type="number"
                              value={serviceForm.duration}
                              onChange={(e) =>
                                setServiceForm({
                                  ...serviceForm,
                                  duration: parseInt(e.target.value) || 0,
                                })
                              }
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="servicePrice">Price (₹)</Label>
                          <Input
                            id="servicePrice"
                            type="number"
                            value={serviceForm.price}
                            onChange={(e) =>
                              setServiceForm({
                                ...serviceForm,
                                price: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="serviceActive"
                            checked={serviceForm.active}
                            onChange={(e) =>
                              setServiceForm({
                                ...serviceForm,
                                active: e.target.checked,
                              })
                            }
                            className="rounded border-border"
                          />
                          <Label htmlFor="serviceActive">Active</Label>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleServiceSubmit}
                            className="flex-1"
                          >
                            {editingService ? "Update" : "Add"} Service
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsServiceDialogOpen(false);
                              setEditingService(null);
                              setServiceForm({
                                name: "",
                                description: "",
                                category: "",
                                duration: 30,
                                price: 0,
                                active: true,
                              });
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className="bg-card p-6 rounded-lg border border-border"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-heading text-foreground">
                            {service.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {service.category}
                          </p>
                        </div>
                        <Badge
                          variant={service.active ? "default" : "secondary"}
                        >
                          {service.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        {service.description}
                      </p>
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-body text-foreground">
                          ₹{service.price}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {service.duration} mins
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingService(service);
                            setServiceForm({
                              name: service.name,
                              description: service.description,
                              category: service.category,
                              duration: service.duration,
                              price: service.price,
                              active: service.active,
                            });
                            setIsServiceDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteService(service.id!)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "profile" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-3xl font-heading text-foreground">
                    Business Profile
                  </h1>
                </div>

                <div className="bg-card p-6 rounded-lg border border-border">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleUpdateProfile();
                    }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="businessName">Business Name</Label>
                        <Input
                          id="businessName"
                          value={profileForm.businessName}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              businessName: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="businessType">Business Type</Label>
                        <Select
                          value={profileForm.businessType}
                          onValueChange={(value) =>
                            setProfileForm({
                              ...profileForm,
                              businessType: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select business type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Spa & Wellness Center">
                              Spa & Wellness Center
                            </SelectItem>
                            <SelectItem value="Hair Salon">
                              Hair Salon
                            </SelectItem>
                            <SelectItem value="Beauty Salon">
                              Beauty Salon
                            </SelectItem>
                            <SelectItem value="Massage Therapy">
                              Massage Therapy
                            </SelectItem>
                            <SelectItem value="Nail Salon">
                              Nail Salon
                            </SelectItem>
                            <SelectItem value="Ayurvedic Center">
                              Ayurvedic Center
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="businessAddress">Business Address</Label>
                      <Input
                        id="businessAddress"
                        value={profileForm.businessAddress}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            businessAddress: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={profileForm.city}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              city: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={profileForm.phone}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              phone: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Business Description</Label>
                      <Textarea
                        id="description"
                        value={profileForm.description}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            description: e.target.value,
                          })
                        }
                        placeholder="Tell customers about your business..."
                        rows={4}
                      />
                    </div>

                    <Button type="submit" className="w-full">
                      Update Profile
                    </Button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

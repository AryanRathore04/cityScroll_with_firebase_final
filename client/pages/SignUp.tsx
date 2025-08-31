import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PageLoading } from "@/components/ui/loading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Leaf,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  MapPin,
  Building,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Shield,
  Star,
  Users,
} from "lucide-react";

export default function SignUp() {
  const [isLoading, setIsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Check URL parameter to set initial user type
  const urlParams = new URLSearchParams(window.location.search);
  const typeParam = urlParams.get("type");

  const [userType, setUserType] = useState<"customer" | "vendor">(
    typeParam === "vendor" ? "vendor" : "customer",
  );

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Personal Info
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    // Business Info (for vendors)
    businessName: "",
    businessType: "",
    businessAddress: "",
    city: "",
    description: "",
    // Agreements
    agreeTerms: false,
    agreeMarketing: false,
  });

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <PageLoading />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (userType === "vendor" && currentStep === 1) {
      // Validate step 1 for vendors
      if (
        !formData.firstName ||
        !formData.lastName ||
        !formData.email ||
        !formData.phone ||
        !formData.password ||
        !formData.confirmPassword
      ) {
        alert("Please fill in all required fields");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        alert("Passwords do not match");
        return;
      }
      setCurrentStep(2);
      return;
    }

    // Final validation
    if (!formData.agreeTerms) {
      alert("Please agree to the Terms of Service");
      return;
    }

    if (
      userType === "vendor" &&
      (!formData.businessName || !formData.businessType || !formData.city)
    ) {
      alert("Please fill in all business information");
      return;
    }

    // Simulate sign up process
    console.log("Sign up data:", formData);
    console.log("User type:", userType);
    console.log("Current step:", currentStep);

    // Navigate based on user type with better debugging
    if (userType === "vendor") {
      alert(
        `Welcome to CityScroll, ${formData.firstName}! Setting up your vendor dashboard...`,
      );
      console.log("✅ Redirecting vendor to dashboard");
      // Use setTimeout to ensure alert is shown before navigation
      setTimeout(() => {
        console.log("🚀 Navigating to /vendor-dashboard");
        window.location.href = "/vendor-dashboard";
      }, 1000);
    } else {
      alert(
        `Welcome to CityScroll, ${formData.firstName}! Account created successfully!`,
      );
      console.log("✅ Redirecting customer to homepage");
      setTimeout(() => {
        console.log("🚀 Navigating to /");
        window.location.href = "/";
      }, 1000);
    }
  };

  const businessTypes = [
    "Spa & Wellness Center",
    "Hair Salon",
    "Beauty Salon",
    "Massage Therapy",
    "Nail Salon",
    "Ayurvedic Center",
    "Fitness & Yoga",
    "Other",
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div
            className="flex items-center justify-center gap-3 mb-8 cursor-pointer group"
            onClick={() => (window.location.href = "/")}
          >
            <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
              <Leaf className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-heading text-foreground tracking-wide">
              CityScroll
            </span>
          </div>
          <h1 className="text-3xl font-heading text-foreground mb-2">
            Join CityScroll
          </h1>
          <p className="text-muted-foreground font-body">
            {userType === "customer"
              ? "Start your wellness journey today"
              : "Grow your business with us"}
          </p>
        </div>

        {/* User Type Selection */}
        <div className="bg-card/80 backdrop-blur-sm rounded-full p-1 sophisticated-shadow border border-border relative">
          <div
            className="absolute top-1 bottom-1 bg-primary rounded-full transition-all duration-300 ease-in-out"
            style={{
              left: userType === "customer" ? "4px" : "50%",
              right: userType === "customer" ? "50%" : "4px",
            }}
          />
          <div className="grid grid-cols-2 gap-1 relative">
            <button
              onClick={() => {
                setUserType("customer");
                setCurrentStep(1);
              }}
              className={`py-3 px-4 rounded-full text-sm font-body transition-all duration-300 relative z-10 ${
                userType === "customer"
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Customer
            </button>
            <button
              onClick={() => {
                setUserType("vendor");
                setCurrentStep(1);
              }}
              className={`py-3 px-4 rounded-full text-sm font-body transition-all duration-300 relative z-10 ${
                userType === "vendor"
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Business Partner
            </button>
          </div>
        </div>

        {/* Step Indicator for Vendors */}
        {userType === "vendor" && (
          <div className="flex items-center justify-center space-x-4">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-heading transition-all duration-300 ${
                currentStep >= 1
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              1
            </div>
            <div
              className={`h-px w-12 transition-all duration-300 ${
                currentStep > 1 ? "bg-primary" : "bg-border"
              }`}
            />
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-heading transition-all duration-300 ${
                currentStep >= 2
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              2
            </div>
          </div>
        )}

        {/* Sign Up Form */}
        <div className="bg-card/90 backdrop-blur-sm rounded-2xl sophisticated-shadow border border-border p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-body text-foreground mb-3 block">
                      First Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-spa-charcoal/40" />
                      <Input
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            firstName: e.target.value,
                          })
                        }
                        className="pl-10 border-spa-stone/20 rounded-lg font-light"
                        placeholder="John"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-spa-charcoal mb-3 block">
                      Last Name
                    </Label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      className="border-spa-stone/20 rounded-lg font-light"
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-spa-charcoal mb-3 block">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-spa-charcoal/40" />
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="pl-10 border-spa-stone/20 rounded-lg font-light"
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-spa-charcoal mb-3 block">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-spa-charcoal/40" />
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="pl-10 border-spa-stone/20 rounded-lg font-light"
                      placeholder="+91 98765 43210"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-spa-charcoal mb-3 block">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-spa-charcoal/40" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="pl-10 pr-10 border-spa-stone/20 rounded-lg font-light"
                      placeholder="Create a strong password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-spa-charcoal/40 hover:text-spa-charcoal"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-spa-charcoal mb-3 block">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-spa-charcoal/40" />
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="pl-10 pr-10 border-spa-stone/20 rounded-lg font-light"
                      placeholder="Confirm your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-spa-charcoal/40 hover:text-spa-charcoal"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Business Information (Vendors Only) */}
            {userType === "vendor" && currentStep === 2 && (
              <>
                <div>
                  <Label className="text-sm font-medium text-spa-charcoal mb-3 block">
                    Business Name
                  </Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-spa-charcoal/40" />
                    <Input
                      value={formData.businessName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          businessName: e.target.value,
                        })
                      }
                      className="pl-10 border-spa-stone/20 rounded-lg font-light"
                      placeholder="Your Spa/Salon Name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-spa-charcoal mb-3 block">
                    Business Type
                  </Label>
                  <Select
                    value={formData.businessType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, businessType: value })
                    }
                  >
                    <SelectTrigger className="border-spa-stone/20 rounded-lg font-light">
                      <SelectValue placeholder="Select your business type" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-spa-charcoal mb-3 block">
                    Business Address
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-spa-charcoal/40" />
                    <Input
                      value={formData.businessAddress}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          businessAddress: e.target.value,
                        })
                      }
                      className="pl-10 border-spa-stone/20 rounded-lg font-light"
                      placeholder="123 Wellness Street"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-spa-charcoal mb-3 block">
                    City
                  </Label>
                  <Input
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className="border-spa-stone/20 rounded-lg font-light"
                    placeholder="Mumbai"
                    required
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-spa-charcoal mb-3 block">
                    Business Description
                  </Label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full border border-spa-stone/20 rounded-lg p-3 font-light text-sm resize-none"
                    rows={3}
                    placeholder="Brief description of your services and specialties..."
                  />
                </div>
              </>
            )}

            {/* Terms and Conditions */}
            {(userType === "customer" || currentStep === 2) && (
              <div className="space-y-4">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={formData.agreeTerms}
                    onChange={(e) =>
                      setFormData({ ...formData, agreeTerms: e.target.checked })
                    }
                    className="mt-1 rounded border-spa-stone/30 text-primary focus:ring-primary focus:ring-offset-0"
                    required
                  />
                  <span className="text-sm font-light text-spa-charcoal/80">
                    I agree to the{" "}
                    <a href="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </a>
                  </span>
                </label>
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={formData.agreeMarketing}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        agreeMarketing: e.target.checked,
                      })
                    }
                    className="mt-1 rounded border-spa-stone/30 text-primary focus:ring-primary focus:ring-offset-0"
                  />
                  <span className="text-sm font-light text-spa-charcoal/80">
                    I'd like to receive wellness tips and special offers via
                    email
                  </span>
                </label>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              {userType === "vendor" && currentStep === 2 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 border-spa-stone/30 text-spa-charcoal font-light"
                >
                  Back
                </Button>
              )}
              <Button
                type="submit"
                className="flex-1 bg-primary text-white hover:bg-spa-sage rounded-full py-3 font-medium"
              >
                {userType === "vendor" && currentStep === 1
                  ? "Continue"
                  : "Create Account"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </form>

          {/* Social Sign Up (Step 1 only) */}
          {currentStep === 1 && (
            <>
              <div className="my-6">
                <Separator className="bg-spa-stone/20" />
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-spa-stone/20"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-spa-charcoal/60 font-light">
                      Or sign up with
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="border-spa-stone/30 text-spa-charcoal font-light hover:bg-spa-cream"
                >
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </Button>
                <Button
                  variant="outline"
                  className="border-spa-stone/30 text-spa-charcoal font-light hover:bg-spa-cream"
                >
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Back Button */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={() => (window.location.href = "/")}
            className="flex items-center gap-2 font-body text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>

        {/* Sign In Link */}
        <div className="text-center">
          <p className="text-muted-foreground font-body">
            Already have an account?{" "}
            <a
              href="/signin"
              className="text-primary hover:text-cta font-heading transition-colors"
            >
              Sign in here
            </a>
          </p>
        </div>

        {/* Benefits */}
        <div className="bg-card/70 backdrop-blur-sm rounded-lg p-6 sophisticated-shadow border border-border">
          <h3 className="font-heading text-foreground mb-4 text-center">
            {userType === "customer"
              ? "Why Join CityScroll?"
              : "Partner Benefits"}
          </h3>
          <div className="space-y-3">
            {userType === "customer" ? (
              <>
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-sm font-body text-muted-foreground">
                    Verified & trusted wellness providers
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Star className="h-4 w-4 text-primary" />
                  <span className="text-sm font-body text-muted-foreground">
                    Exclusive member discounts and offers
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm font-body text-muted-foreground">
                    Easy booking and rescheduling
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-sm font-body text-muted-foreground">
                    Reach 25,000+ potential customers
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Star className="h-4 w-4 text-primary" />
                  <span className="text-sm font-body text-muted-foreground">
                    Professional business dashboard
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm font-body text-muted-foreground">
                    Marketing support and insights
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

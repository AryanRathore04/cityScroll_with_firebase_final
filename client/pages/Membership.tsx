import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageLoading } from "@/components/ui/loading";
import {
  ToastNotification,
  useToasts,
} from "@/components/ui/toast-notification";
import {
  Check,
  Star,
  Leaf,
  ArrowRight,
  Users,
  Calendar,
  Gift,
  Crown,
  ArrowLeft,
} from "lucide-react";

const plans = [
  {
    id: "basic",
    name: "Essential",
    price: 999,
    period: "month",
    popular: false,
    description: "Perfect for occasional wellness treatments",
    features: [
      "1 Complimentary Treatment per month",
      "10% Discount on all services",
      "Priority booking",
      "Access to basic workshops",
      "Member-only offers",
    ],
    color: "bg-card/70",
    textColor: "text-foreground",
    buttonStyle: "bg-primary text-primary-foreground hover:bg-primary/90",
  },
  {
    id: "premium",
    name: "Premium",
    price: 2499,
    period: "month",
    popular: true,
    description: "Most popular choice for wellness enthusiasts",
    features: [
      "2 Complimentary Treatments per month",
      "20% Discount on all services",
      "Free partner guest sessions",
      "Exclusive workshop access",
      "Personalized wellness consultation",
      "Flexible booking & cancellation",
    ],
    color: "bg-primary",
    textColor: "text-white",
    buttonStyle: "bg-white text-primary hover:bg-white/90",
  },
  {
    id: "vip",
    name: "VIP",
    price: 4999,
    period: "month",
    popular: false,
    description: "Ultimate luxury wellness experience",
    features: [
      "Unlimited monthly treatments",
      "30% Discount on premium services",
      "Dedicated wellness concierge",
      "Exclusive VIP events & retreats",
      "Complimentary home service visits",
      "Priority access to new treatments",
      "24/7 customer support",
    ],
    color: "bg-cta",
    textColor: "text-cta-foreground",
    buttonStyle: "bg-white text-cta hover:bg-white/90",
  },
];

const membershipBenefits = [
  {
    icon: <Calendar className="h-6 w-6" />,
    title: "Flexible Scheduling",
    description:
      "Book appointments that fit your lifestyle with priority access",
  },
  {
    icon: <Gift className="h-6 w-6" />,
    title: "Exclusive Perks",
    description: "Members-only treatments, events, and special offers",
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Community Access",
    description:
      "Join our wellness community and connect with like-minded individuals",
  },
  {
    icon: <Star className="h-6 w-6" />,
    title: "Premium Experience",
    description: "Enhanced service quality and personalized attention",
  },
];

const testimonials = [
  {
    name: "Priya Sharma",
    membership: "Premium Member",
    text: "The membership has transformed my wellness routine. The priority booking and discounts make it so convenient.",
    rating: 5,
  },
  {
    name: "Rajesh Kumar",
    membership: "VIP Member",
    text: "Exceptional service and value. The dedicated concierge makes everything seamless and personalized.",
    rating: 5,
  },
  {
    name: "Anita Patel",
    membership: "Essential Member",
    text: "Great way to start my wellness journey. The monthly treatments and workshops are fantastic.",
    rating: 5,
  },
];

export default function Membership() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState("premium");
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const { toasts, removeToast, showSuccess } = useToasts();

  useEffect(() => {
    // Check for success parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("success") === "true") {
      showSuccess("Payment successful! Welcome to CityScroll membership!");
    }

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [showSuccess]);

  const handleSelectPlan = (planId: string) => {
    showSuccess(
      `${plans.find((p) => p.id === planId)?.name} plan selected! Redirecting to payment...`,
    );
    setTimeout(() => {
      window.location.href = `/payment?plan=${planId}&billing=${billingPeriod}`;
    }, 1500);
  };

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <ToastNotification toasts={toasts} removeToast={removeToast} />

      {/* Navigation */}
      <nav className="bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => (window.location.href = "/")}
            >
              <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
                <Leaf className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-heading text-foreground tracking-wide">
                CityScroll
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a
                href="/"
                className="text-sm font-body text-muted-foreground hover:text-primary transition-colors"
              >
                Home
              </a>
              <a
                href="/salons"
                className="text-sm font-body text-muted-foreground hover:text-primary transition-colors"
              >
                Find Venues
              </a>
              <a
                href="/membership"
                className="text-sm font-body text-primary font-heading"
              >
                Membership
              </a>
              <Button
                variant="ghost"
                size="sm"
                className="text-sm font-body"
                onClick={() => (window.location.href = "/signin")}
              >
                Sign In
              </Button>
              <Button
                variant="ghost"
                onClick={() => (window.location.href = "/")}
                className="flex items-center gap-2 font-body text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <Crown className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-4xl md:text-6xl font-heading text-foreground mb-6 leading-tight">
            Wellness
            <span className="text-primary"> Membership</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto font-body leading-relaxed">
            Join our exclusive wellness community and unlock unlimited access to
            premium treatments, priority booking, and personalized care.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-12">
            <div className="relative bg-card rounded-full p-1 sophisticated-shadow border border-border">
              <div
                className={`absolute top-1 bottom-1 w-1/2 bg-primary rounded-full transition-transform duration-300 ease-in-out ${
                  billingPeriod === "yearly"
                    ? "translate-x-full"
                    : "translate-x-0"
                }`}
              />
              <div className="relative flex">
                <button
                  onClick={() => setBillingPeriod("monthly")}
                  className={`px-6 py-2 rounded-full font-body transition-all duration-300 z-10 ${
                    billingPeriod === "monthly"
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingPeriod("yearly")}
                  className={`px-6 py-2 rounded-full font-body transition-all duration-300 z-10 relative ${
                    billingPeriod === "yearly"
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Yearly
                  <Badge className="ml-2 bg-secondary text-foreground text-xs absolute top-0 right-2 transform translate-x-1/2 -translate-y-1/2">
                    Save 20%
                  </Badge>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-2xl p-8 sophisticated-shadow border border-border relative overflow-hidden transition-all hover:scale-[1.02] ${plan.color} ${plan.id === "premium" ? "h-[600px] mt-0" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-secondary text-foreground px-4 py-2 font-heading text-sm rounded-full">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3
                    className={`text-2xl font-heading mb-2 ${plan.textColor}`}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className={`text-sm font-body mb-6 ${
                      plan.id === "premium" || plan.id === "vip"
                        ? "text-white/80"
                        : "text-muted-foreground"
                    }`}
                  >
                    {plan.description}
                  </p>
                  <div className={`${plan.textColor}`}>
                    <span className="text-4xl font-heading">
                      ₹
                      {billingPeriod === "yearly"
                        ? Math.round(plan.price * 12 * 0.8).toLocaleString()
                        : plan.price.toLocaleString()}
                    </span>
                    <span className="text-sm font-body">
                      /{billingPeriod === "yearly" ? "year" : "month"}
                    </span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check
                        className={`h-5 w-5 mt-0.5 ${
                          plan.id === "premium" || plan.id === "vip"
                            ? "text-white"
                            : "text-primary"
                        }`}
                      />
                      <span
                        className={`text-sm font-body ${
                          plan.id === "premium" || plan.id === "vip"
                            ? "text-white/90"
                            : "text-muted-foreground"
                        }`}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full rounded-lg font-heading h-12 ${plan.buttonStyle}`}
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  Choose {plan.name}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-heading text-foreground mb-4">
              Membership Benefits
            </h2>
            <p className="text-muted-foreground font-body max-w-2xl mx-auto">
              Experience wellness like never before with exclusive member
              privileges and personalized care.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {membershipBenefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-spa-cream rounded-full text-primary">
                    {benefit.icon}
                  </div>
                </div>
                <h3 className="font-medium text-spa-charcoal mb-3">
                  {benefit.title}
                </h3>
                <p className="text-sm text-spa-charcoal/60 font-light leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-spa-cream">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-light text-spa-charcoal mb-4">
              What Our Members Say
            </h2>
            <p className="text-spa-charcoal/60 font-light">
              Join thousands of satisfied members on their wellness journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-spa-cream/70 rounded-lg p-6 sophisticated-shadow"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-spa-lime text-spa-lime"
                    />
                  ))}
                </div>
                <p className="text-spa-charcoal/80 font-light leading-relaxed mb-6">
                  "{testimonial.text}"
                </p>
                <div>
                  <div className="font-medium text-spa-charcoal">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-spa-charcoal/60 font-light">
                    {testimonial.membership}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-light mb-6">
            Ready to Begin Your
            <br />
            Wellness Journey?
          </h2>
          <p className="text-xl font-light mb-8 text-white/90">
            Join our community today and experience the difference membership
            makes
          </p>
          <Button
            size="lg"
            className="bg-white text-primary hover:bg-white/90 px-8 py-3 rounded-full font-medium"
          >
            Start Your Membership
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-spa-charcoal text-muted-foreground py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                <Leaf className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-light tracking-wide">
                CityScroll
              </span>
            </div>
            <p className=" font-light text-sm">
              © 2024 CityScroll. Your wellness journey starts here.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/ui/search-bar";
import { CategoryButton } from "@/components/ui/category-button";
import { ServiceCard } from "@/components/ui/service-card";
import { Badge } from "@/components/ui/badge";
import { PageLoading } from "@/components/ui/loading";
import {
  Scissors,
  Flower2,
  Hand,
  Palette,
  Star,
  ChevronRight,
  Quote,
  MapPin,
  Users,
  Award,
  Clock,
  ArrowRight,
  Leaf,
  CheckCircle,
  User,
} from "lucide-react";

const categories = [
  { id: "hair", icon: <Scissors className="h-5 w-5" />, label: "Hair Care" },
  { id: "spa", icon: <Flower2 className="h-5 w-5" />, label: "Spa & Wellness" },
  { id: "massage", icon: <Hand className="h-5 w-5" />, label: "Massage" },
  { id: "makeup", icon: <Palette className="h-5 w-5" />, label: "Beauty" },
];

const featuredServices = [
  {
    id: "1",
    name: "Serenity Wellness Spa",
    image:
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=300&fit=crop&crop=center",
    rating: 4.9,
    reviewCount: 186,
    location: "Connaught Place, Delhi",
    services: ["Deep Tissue Massage", "Hot Stone Therapy", "Aromatherapy"],
    priceRange: "���₹₹",
    isOpen: true,
  },
  {
    id: "2",
    name: "Zen Beauty Lounge",
    image:
      "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=400&h=300&fit=crop&crop=center",
    rating: 4.8,
    reviewCount: 234,
    location: "Bandra West, Mumbai",
    services: ["Facial Treatment", "Hair Spa", "Manicure & Pedicure"],
    priceRange: "₹₹₹₹",
    isOpen: true,
  },
  {
    id: "3",
    name: "Natural Glow Studio",
    image:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center",
    rating: 4.7,
    reviewCount: 156,
    location: "Koramangala, Bangalore",
    services: ["Organic Facial", "Natural Hair Care", "Wellness Therapy"],
    priceRange: "₹₹",
    isOpen: true,
  },
];

const testimonials = [
  {
    id: "1",
    name: "Priya Sharma",
    rating: 5,
    text: "The most relaxing spa experience I've ever had. The therapists are incredibly skilled and the atmosphere is so peaceful.",
    treatment: "Deep Tissue Massage",
    location: "Mumbai",
  },
  {
    id: "2",
    name: "Rajesh Kumar",
    rating: 5,
    text: "Professional service and excellent facilities. I feel completely rejuvenated after every visit.",
    treatment: "Wellness Package",
    location: "Delhi",
  },
  {
    id: "3",
    name: "Anita Patel",
    rating: 5,
    text: "CityScroll helped me find the perfect salon. The booking process was seamless and the service was outstanding.",
    treatment: "Hair & Beauty",
    location: "Bangalore",
  },
];

const stats = [
  {
    icon: <Users className="h-5 w-5" />,
    label: "Satisfied Clients",
    value: "25K+",
  },
  {
    icon: <MapPin className="h-5 w-5" />,
    label: "Partner Venues",
    value: "500+",
  },
  {
    icon: <Award className="h-5 w-5" />,
    label: "Cities Covered",
    value: "15+",
  },
  {
    icon: <Clock className="h-5 w-5" />,
    label: "Treatments/Month",
    value: "5K+",
  },
];

export default function Index() {
  const [activeCategory, setActiveCategory] = useState("spa");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
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
                href="/salons"
                className="text-sm font-body text-muted-foreground hover:text-primary transition-colors"
              >
                Services
              </a>
              <a
                href="/salons"
                className="text-sm font-body text-muted-foreground hover:text-primary transition-colors"
              >
                Find Venues
              </a>
              <a
                href="/membership"
                className="text-sm font-body text-muted-foreground hover:text-primary transition-colors"
              >
                Membership
              </a>
              <a
                href="/about"
                className="text-sm font-body text-muted-foreground hover:text-primary transition-colors"
              >
                About
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
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-secondary text-sm px-6 rounded-full font-heading"
                onClick={() => (window.location.href = "/signup?type=vendor")}
              >
                Become a Partner
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Clean Modern Design */}
      <section className="relative min-h-screen bg-background overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center min-h-[90vh]">
            {/* Left Content */}
            <div className="space-y-8 lg:pr-8">
              {/* Main Heading */}
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading text-foreground leading-tight">
                  Discover the
                  <br />
                  <span className="italic text-primary font-serif">
                    Perfect Place
                  </span>{" "}
                  to Relax
                  <br />
                  and <span className="text-primary">Rejuvenate</span>
                  <span className="inline-block ml-3">
                    <Flower2 className="h-10 w-10 text-primary" />
                  </span>
                </h1>
              </div>

              {/* Description */}
              <p className="text-lg text-muted-foreground font-body leading-relaxed max-w-lg">
                Explore a curated selection of premium salons and spas that fit
                your wellness lifestyle and preferences.
              </p>

              {/* Search Bar in Hero */}
              <div className="space-y-6">
                <SearchBar className="max-w-2xl" />

                {/* CTA Button */}
                <div className="flex items-center gap-4 group hover:gap-0 transition-all duration-500 ease-out">
                  <Button
                    size="lg"
                    className="bg-foreground hover:bg-foreground/90 text-background px-8 py-4 rounded-full font-body text-base shadow-lg hover:shadow-xl transition-all duration-300 group-hover:rounded-r-none"
                    onClick={() => (window.location.href = "/salons")}
                  >
                    View Treatments
                  </Button>
                  <div
                    className="w-12 h-12 bg-foreground rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-all duration-300 group-hover:rounded-l-none group-hover:w-14"
                    onClick={() => (window.location.href = "/salons")}
                  >
                    <ArrowRight className="h-5 w-5 text-background" />
                  </div>
                </div>
              </div>

              {/* Reviews Section */}
              <div className="flex items-center gap-6 pt-8 flex-wrap">
                <div className="flex -space-x-3">
                  <img
                    src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=60&h=60&fit=crop&crop=face"
                    alt="Customer"
                    className="w-12 h-12 rounded-full border-2 border-background object-cover"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face"
                    alt="Customer"
                    className="w-12 h-12 rounded-full border-2 border-background object-cover"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face"
                    alt="Customer"
                    className="w-12 h-12 rounded-full border-2 border-background object-cover"
                  />
                </div>
                <div className="text-sm">
                  <div className="font-heading text-foreground">More than</div>
                  <div className="font-body text-muted-foreground">
                    1000+ happy clients
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-body text-foreground">5/5</span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-primary text-primary"
                      />
                    ))}
                  </div>
                </div>
                <div className="text-sm">
                  <div className="font-body text-muted-foreground">
                    25 Reviews On Google
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content - Spa Image with Overlays */}
            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-sage-100 to-olive-100 p-8">
                {/* Main Spa Image */}
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2F6373fffa9c4144baa03315aef7b6a7f2%2F13d130be36644801a74d4a1ac374ae48?format=webp&width=800"
                  alt="Serene spa massage and wellness treatment"
                  className="w-full h-[500px] object-cover rounded-2xl shadow-2xl animate-fade-in hover:scale-105 transition-transform duration-700"
                />

                {/* Floating Discount Card */}
                <div className="absolute top-12 left-12 bg-white rounded-2xl p-4 shadow-xl border border-sage-200 animate-float-slow">
                  <div className="text-center">
                    <div className="text-xs font-body text-muted-foreground mb-1">
                      Get discount up to
                    </div>
                    <div className="text-3xl font-heading text-primary mb-2">
                      50%
                    </div>
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-white px-4 py-1 rounded-lg text-xs font-body"
                      onClick={() => (window.location.href = "/membership")}
                    >
                      Get it Now
                    </Button>
                  </div>
                </div>

                {/* Floating Service Card */}
                <div className="absolute bottom-12 right-12 bg-white rounded-2xl p-4 shadow-xl border border-sage-200 min-w-[200px] animate-float-medium">
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=60&h=60&fit=crop&crop=center"
                      alt="Spa treatment"
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div>
                      <div className="font-body text-foreground text-sm">
                        Deep Relaxation
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Signature spa treatment
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-heading text-foreground">
                      ₹2,500
                    </div>
                  </div>
                </div>

                {/* Floating Rating Card */}
                <div className="absolute top-1/2 -left-6 bg-white rounded-2xl p-4 shadow-xl border border-sage-200 animate-float-fast">
                  <div className="text-center">
                    <div className="flex items-center gap-1 justify-center mb-2">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      <span className="font-heading text-foreground">4.9</span>
                    </div>
                    <div className="text-xs font-body text-muted-foreground max-w-[120px]">
                      Excellence in wellness with years of experience and a
                      passion for creating exceptional experiences.
                    </div>
                  </div>
                </div>

                {/* Price Tag */}
                <div className="absolute bottom-8 left-8 bg-foreground text-background rounded-xl px-4 py-2">
                  <div className="text-lg font-heading">₹1,850</div>
                </div>

                {/* Additional Info */}
                <div className="absolute top-1/2 -right-6 bg-white rounded-2xl p-3 shadow-xl border border-sage-200">
                  <div className="text-xs font-body text-muted-foreground mb-1">
                    Affordable luxury
                  </div>
                  <div className="font-heading text-foreground text-sm">
                    Premium Services
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Why Choose Us Section */}
          <div className="mt-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-heading text-foreground mb-4">
                Why Choose CityScroll?
              </h2>
              <p className="text-muted-foreground font-body text-lg max-w-2xl mx-auto">
                Experience the difference with our premium wellness platform
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Quality Assurance */}
              <div className="text-center group cursor-pointer">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-heading text-foreground mb-3">
                  Verified Quality
                </h3>
                <p className="text-muted-foreground font-body leading-relaxed">
                  All partner venues are thoroughly vetted to ensure exceptional standards and premium service quality.
                </p>
              </div>

              {/* Easy Booking */}
              <div className="text-center group cursor-pointer">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-heading text-foreground mb-3">
                  Instant Booking
                </h3>
                <p className="text-muted-foreground font-body leading-relaxed">
                  Book your preferred time slot instantly with real-time availability and instant confirmation.
                </p>
              </div>

              {/* Best Prices */}
              <div className="text-center group cursor-pointer">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                  <Award className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-heading text-foreground mb-3">
                  Best Prices
                </h3>
                <p className="text-muted-foreground font-body leading-relaxed">
                  Get exclusive deals and member discounts on premium treatments across all partner venues.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-muted/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading text-foreground mb-4">
              Discover Our Services
            </h2>
            <p className="text-muted-foreground font-body">
              Choose from our curated selection of wellness treatments
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {categories.map((category) => (
              <CategoryButton
                key={category.id}
                icon={category.icon}
                label={category.label}
                isActive={activeCategory === category.id}
                onClick={() => {
                  setActiveCategory(category.id);
                  // Navigate to salons page with category filter
                  window.location.href = `/salons?category=${category.id}`;
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Elegant Transition */}
      <div className="py-8 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/50 to-muted"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-3 bg-card/80 backdrop-blur-sm rounded-full px-8 py-4 sophisticated-shadow border border-border">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span className="text-sm font-body text-muted-foreground">
                Trusted by thousands across India
              </span>
              <div
                className="w-2 h-2 bg-primary rounded-full animate-pulse"
                style={{ animationDelay: "0.5s" }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <section className="py-16 bg-muted">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="text-center transform transition-all duration-300 hover:scale-105"
              >
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-card rounded-full sophisticated-shadow">
                    <div className="text-primary">{stat.icon}</div>
                  </div>
                </div>
                <div className="text-2xl font-heading text-foreground mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground font-body">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Decorative Separator */}
      <div className="py-8 bg-gradient-to-r from-background via-muted/30 to-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-4">
              <div className="w-16 h-px bg-gradient-to-r from-transparent to-primary"></div>
              <div className="p-3 bg-primary/10 rounded-full">
                <Leaf className="h-6 w-6 text-primary" />
              </div>
              <div className="w-16 h-px bg-gradient-to-l from-transparent to-primary"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Venues */}
      <section className="py-24 bg-gradient-to-br from-background to-muted/30 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Star className="h-4 w-4 text-primary" />
              <span className="text-sm font-body text-primary">
                Premium Collection
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-heading text-foreground mb-4">
              Featured Wellness
              <br />
              <span className="text-primary italic">Destinations</span>
            </h2>
            <p className="text-lg text-muted-foreground font-body max-w-2xl mx-auto leading-relaxed">
              Discover our handpicked selection of premium venues offering
              exceptional treatments and unparalleled service
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredServices.map((service, index) => (
              <div
                key={service.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <ServiceCard {...service} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Decorative Wave Separator */}
      <div className="relative py-12 bg-background overflow-hidden">
        <div className="absolute inset-0">
          <svg
            className="w-full h-full"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id="wave-gradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop
                  offset="0%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity="0.1"
                />
                <stop
                  offset="50%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity="0.3"
                />
                <stop
                  offset="100%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity="0.1"
                />
              </linearGradient>
            </defs>
            <path
              d="M0,60 Q300,10 600,60 T1200,60 L1200,120 L0,120 Z"
              fill="url(#wave-gradient)"
            />
          </svg>
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-body text-muted-foreground">
                Trusted Community
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-body text-muted-foreground">
                Premium Quality
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-body text-muted-foreground">
                Excellence Guaranteed
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <section className="py-24 bg-gradient-to-b from-muted/30 to-background relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-secondary/10 rounded-full blur-3xl"></div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Quote className="h-4 w-4 text-primary" />
              <span className="text-sm font-body text-primary">
                Client Stories
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-heading text-foreground mb-4">
              What Our Clients
              <br />
              <span className="text-primary italic">Say About Us</span>
            </h2>
            <p className="text-lg text-muted-foreground font-body max-w-2xl mx-auto leading-relaxed">
              Real experiences from our valued wellness community members
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial.id}
                className="bg-card/80 backdrop-blur-sm rounded-2xl p-8 sophisticated-shadow transform transition-all duration-500 hover:scale-105 hover:shadow-xl border border-border/50 animate-slide-up group"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="flex items-center gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-primary text-primary transition-transform group-hover:scale-110"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
                <div className="relative">
                  <Quote className="h-8 w-8 text-primary/20 absolute -top-2 -left-2" />
                  <p className="text-muted-foreground font-body leading-relaxed mb-6 relative z-10 text-lg">
                    "{testimonial.text}"
                  </p>
                </div>
                <div className="border-t border-border/30 pt-6 flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-heading text-foreground text-base">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-muted-foreground font-body">
                      {testimonial.treatment} • {testimonial.location}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-white relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1920&h=600&fit=crop&crop=center"
            alt="Wellness background"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-primary/80"></div>
        </div>

        {/* Background Animation */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full animate-float-slow"></div>
          <div className="absolute bottom-10 right-10 w-24 h-24 bg-white/10 rounded-full animate-float-medium"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-heading mb-6 animate-slide-up text-white">
            Begin Your Wellness Journey
          </h2>
          <p className="text-xl font-body mb-8 text-white/90 animate-slide-up-delay">
            Join thousands who trust CityScroll for their wellness needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up-delay-2">
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90 px-8 py-3 rounded-full font-heading transition-all duration-300 hover:scale-105"
              onClick={() => (window.location.href = "/salons")}
            >
              Book Your Treatment
            </Button>
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90 px-8 py-3 rounded-full font-heading transition-all duration-300 hover:scale-105"
              onClick={() => (window.location.href = "/signup?type=vendor")}
            >
              Become a Partner
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                  <Leaf className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-xl font-heading tracking-wide text-white">
                  CityScroll
                </span>
              </div>
              <p className="text-white/70 font-body leading-relaxed max-w-md">
                Your trusted companion for discovering exceptional wellness
                experiences. We connect you with premium salons and spas that
                prioritize your well-being.
              </p>
            </div>
            <div>
              <h3 className="font-heading mb-6 text-sm tracking-wide text-white">
                Services
              </h3>
              <ul className="space-y-3 text-white/70 font-body text-sm">
                <li className="hover:text-white transition-colors cursor-pointer">
                  Spa & Wellness
                </li>
                <li className="hover:text-white transition-colors cursor-pointer">
                  Hair Care
                </li>
                <li className="hover:text-white transition-colors cursor-pointer">
                  Massage Therapy
                </li>
                <li className="hover:text-white transition-colors cursor-pointer">
                  Beauty Treatments
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-heading mb-6 text-sm tracking-wide text-white">
                Company
              </h3>
              <ul className="space-y-3 text-white/70 font-body text-sm">
                <li className="hover:text-white transition-colors cursor-pointer">
                  About Us
                </li>
                <li className="hover:text-white transition-colors cursor-pointer">
                  Partner Program
                </li>
                <li className="hover:text-white transition-colors cursor-pointer">
                  Careers
                </li>
                <li className="hover:text-white transition-colors cursor-pointer">
                  Contact
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center">
            <p className="text-white/60 font-body text-sm">
              © 2024 CityScroll. All rights reserved. Made with care for your
              wellness journey.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

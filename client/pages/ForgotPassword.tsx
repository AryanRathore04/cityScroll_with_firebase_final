import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loading } from "@/components/ui/loading";
import {
  ToastNotification,
  useToasts,
} from "@/components/ui/toast-notification";
import { useAuth } from "@/hooks/useAuth";
import { Leaf, Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { resetPassword } = useAuth();
  const { toasts, removeToast, showSuccess, showError } = useToasts();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      showError("Please enter your email address");
      return;
    }

    if (!email.includes("@")) {
      showError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword(email);
      setIsSubmitted(true);
      showSuccess("Password reset email sent successfully!");
    } catch (error: any) {
      showError(error.message || "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSignIn = () => {
    window.location.href = "/signin";
  };

  const handleBackToHome = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <ToastNotification toasts={toasts} removeToast={removeToast} />
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div
            className="flex items-center justify-center gap-3 mb-8 cursor-pointer group"
            onClick={handleBackToHome}
          >
            <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
              <Leaf className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-heading text-foreground tracking-wide">
              CityScroll
            </span>
          </div>

          {!isSubmitted ? (
            <>
              <h2 className="text-3xl font-heading text-foreground mb-2">
                Forgot Password?
              </h2>
              <p className="text-muted-foreground font-body">
                Enter your email address and we'll send you a link to reset your
                password.
              </p>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-cta" />
              </div>
              <h2 className="text-3xl font-heading text-foreground mb-2">
                Check Your Email
              </h2>
              <p className="text-muted-foreground font-body">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
            </>
          )}
        </div>

        {!isSubmitted ? (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-body">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="pl-10 h-12 font-body"
                  disabled={isLoading}
                />
              </div>
            </div>


            <Button
              type="submit"
              className="w-full h-12 bg-cta hover:bg-cta/90 text-cta-foreground font-heading rounded-lg"
              disabled={isLoading}
            >
              {isLoading ? <Loading size="sm" className="mr-2" /> : null}
              {isLoading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <Button
              onClick={() => setIsSubmitted(false)}
              variant="outline"
              className="w-full h-12 font-body"
            >
              Resend Email
            </Button>
          </div>
        )}

        {/* Back buttons */}
        <div className="flex flex-col space-y-3">
          <Button
            variant="ghost"
            onClick={handleBackToSignIn}
            className="w-full flex items-center justify-center gap-2 font-body text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Button>

          <Button
            variant="ghost"
            onClick={handleBackToHome}
            className="w-full font-body text-muted-foreground hover:text-foreground"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}

import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { getAuthCallbackUrl } from "../../lib/authRedirects";
import { toast } from "sonner";
import authBg from "../../imports/auth.png";

export function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords don't match!");
      return;
    }
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) throw error;

      toast.success("Registration successful! Please check your email for verification.");
      navigate("/signin");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: 'google') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: getAuthCallbackUrl(),
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || `Failed to sign up with ${provider}`);
    }
  };

  return (
    <div className="min-h-screen bg-white grid lg:grid-cols-2">
      {/* Left Column - Form */}
      <div className="flex items-center justify-center px-5 py-12 bg-gradient-to-b from-[#F0EFFF] to-white relative">
        <Link to="/" className="absolute top-6 left-6">
          <Button variant="ghost" className="gap-2 text-[13px] font-bold uppercase tracking-[0.5px]">
            ← Back to website
          </Button>
        </Link>
        <div className="w-full max-w-md">
          {/* Logo/Brand */}
          <div className="mb-8">
            <h2 className="text-[28px] font-bold text-gray-text mt-6 mb-2">Create account.</h2>
            <p className="text-[15px] text-gray-light">Start transforming URLs for free.</p>
          </div>

          {/* Sign Up Form */}
          <Card className="p-8 shadow-[0_8px_0_0_#CFCFCF] border-2 border-border-color rounded-2xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Input */}
              <div className="space-y-2">
                <label htmlFor="name" className="text-[13px] font-bold text-gray-text uppercase tracking-wide">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full h-12 px-4 text-[15px] border-2 border-border-color rounded-xl focus:outline-none focus:border-primary transition-colors"
                  required
                />
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-[13px] font-bold text-gray-text uppercase tracking-wide">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-12 px-4 text-[15px] border-2 border-border-color rounded-xl focus:outline-none focus:border-primary transition-colors"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-[13px] font-bold text-gray-text uppercase tracking-wide">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  className="w-full h-12 px-4 text-[15px] border-2 border-border-color rounded-xl focus:outline-none focus:border-primary transition-colors"
                  required
                  minLength={8}
                />
                <p className="text-[11px] text-gray-light">Must be at least 8 characters</p>
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-[13px] font-bold text-gray-text uppercase tracking-wide">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full h-12 px-4 text-[15px] border-2 border-border-color rounded-xl focus:outline-none focus:border-primary transition-colors"
                  required
                  minLength={8}
                />
              </div>

              {/* Terms & Conditions */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  className="mt-1 w-4 h-4 border-2 border-border-color rounded"
                  required
                />
                <label htmlFor="terms" className="text-[13px] text-gray-light leading-relaxed">
                  I agree to the{" "}
                  <Link to="/terms" className="text-primary font-bold hover:opacity-70 transition-opacity">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="text-primary font-bold hover:opacity-70 transition-opacity">
                    Privacy
                  </Link>
                </label>
              </div>

              {/* Sign Up Button */}
              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "CREATE ACCOUNT"}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border-color"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-light text-[12px] uppercase font-bold">Or</span>
                </div>
              </div>

              {/* Social Sign Up */}
              <div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="lg" 
                  className="w-full"
                  onClick={() => handleSocialSignIn('google')}
                  disabled={loading}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  SIGN UP WITH GOOGLE
                </Button>
              </div>
            </form>
          </Card>

          {/* Sign In Link */}
          <div className="text-center mt-6">
            <p className="text-[14px] text-gray-light">
              Have an account?{" "}
              <Link to="/signin" className="text-primary font-bold hover:opacity-70 transition-opacity">
                Sign in.
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Column - Branding */}
      <div 
        className="hidden lg:flex items-center justify-center relative overflow-hidden bg-primary px-12 py-12 min-h-screen"
        style={{ backgroundImage: `url(${authBg})`, backgroundSize: 'cover', backgroundPosition: 'center', transform: 'scaleX(-1)' }}
      >
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-primary/60"></div>

        <div className="max-w-lg relative z-10 text-white" style={{ transform: 'scaleX(-1)' }}>
          <Link to="/" className="inline-block mb-12">
            <h1 className="text-[32px] font-display lowercase text-white">iLoveURL<span className="text-[18px]">.space</span></h1>
          </Link>
          <h2 className="text-[42px] font-display lowercase mb-6 leading-tight">
            Any URL. Anything.
          </h2>
          <p className="text-[17px] text-white/90 mb-12 leading-relaxed">
            Join thousands of users who are already transforming URLs into powerful tools for career, content, and productivity. 
          </p>

          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div>
                <h3 className="text-[19px] font-bold text-white mb-2">Instant Processing</h3>
                <p className="text-[15px] text-white/80 leading-relaxed">Transform any URL in seconds. No waiting, no complexity — just paste and go.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div>
                <h3 className="text-[19px] font-bold text-white mb-2">AI-Powered Tools</h3>
                <p className="text-[15px] text-white/80 leading-relaxed">Advanced analysis that generates cover letters, summaries, and insights automatically.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div>
                <h3 className="text-[19px] font-bold text-white mb-2">Secure & Private</h3>
                <p className="text-[15px] text-white/80 leading-relaxed">Bank-level encryption protects your data. We never store or share your processed URLs.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

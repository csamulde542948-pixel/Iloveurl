import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { Button } from "./components/ui/button";
import { Menu, X, LogOut, LayoutDashboard, History, Settings, FileText as FileTextIcon } from "lucide-react";
import { HomePage } from "./pages/home";
import { ToolsPage } from "./pages/tools";
import { PricingPage } from "./pages/pricing";
import { PaymentPage } from "./pages/payment";
import { AboutPage } from "./pages/about";
import { SignInPage } from "./pages/signin";
import { SignUpPage } from "./pages/signup";
import { AuthCallbackPage } from "./pages/auth-callback";
import { PrivacyPage } from "./pages/privacy";
import { TermsPage } from "./pages/terms";
import { ToolPage } from "./pages/tool-page";
import { NotFoundPage } from "./pages/not-found";
import { DashboardOverview } from "./pages/dashboard/overview";
import { DashboardHistory } from "./pages/dashboard/history";
import { DashboardResume } from "./pages/dashboard/resume";
import { DashboardSettings } from "./pages/dashboard/settings";
import { DashboardBilling } from "./pages/dashboard/billing";
import { GuestOnlyRoute, ProtectedRoute } from "./components/protected-route";
import { DesignSystemDocs } from "./components/design-system-docs";
import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./components/auth-provider";
import footerBg from "../imports/footer.png";
import { Avatar, AvatarFallback, AvatarImage } from "./components/ui/avatar";
import { cn } from "./components/ui/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";
import { Toaster } from "./components/ui/sonner";

const SITE_URL = "https://iloveurl.space";
const OG_IMAGE_URL = `${SITE_URL}/iloveurl-og.png`;
const DEFAULT_SEO = {
  title: "iLoveURL | Transform Any Link Into Useful Outputs",
  description:
    "iLoveURL turns URLs into summaries, SEO audits, brand reports, study notes, QR codes, short links, resume matches, and other useful workflows.",
};

const ROUTE_SEO: Record<string, { title: string; description: string }> = {
  "/": DEFAULT_SEO,
  "/tools": {
    title: "URL Tools Library | iLoveURL",
    description:
      "Explore iLoveURL tools for URL summarization, SEO audits, brand analysis, QR codes, short links, link previews, study notes, and career workflows.",
  },
  "/pricing": {
    title: "Pricing | iLoveURL",
    description:
      "Simple credit-based pricing for iLoveURL URL workflows. Start free, then upgrade for more credits, exports, and premium tools.",
  },
  "/about": {
    title: "About iLoveURL | URL Workflow Toolkit",
    description:
      "Learn about iLoveURL, a URL-to-output toolkit that helps users turn links into practical reports, documents, summaries, and shareable assets.",
  },
  "/privacy": {
    title: "Privacy Policy | iLoveURL",
    description:
      "Read how iLoveURL handles account data, URL processing, generated outputs, subscriptions, and third-party services.",
  },
  "/terms": {
    title: "Terms of Service | iLoveURL",
    description:
      "Read the terms that apply when using iLoveURL tools, subscriptions, credits, exports, and URL processing workflows.",
  },
  "/signin": {
    title: "Sign In | iLoveURL",
    description: "Sign in to iLoveURL to access your dashboard, saved history, resume profile, credits, and billing.",
  },
  "/signup": {
    title: "Create Account | iLoveURL",
    description: "Create an iLoveURL account to save URL workflow history, manage credits, and access premium tools.",
  },
};

function setMeta(nameOrProperty: string, content: string, attribute: "name" | "property" = "name") {
  let tag = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${nameOrProperty}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attribute, nameOrProperty);
    document.head.appendChild(tag);
  }
  tag.content = content;
}

function setCanonical(href: string) {
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = href;
}

function useRouteSeo() {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname;
    const toolMatch = pathname.match(/^\/tool\/([^/]+)/);
    const dashboardMatch = pathname.startsWith("/dashboard");
    const seo = toolMatch
      ? {
          title: "URL Tool Result | iLoveURL",
          description:
            "Run an iLoveURL tool to transform a URL into a useful output such as a report, summary, QR code, short link, or analysis.",
        }
      : dashboardMatch
        ? {
            title: "Dashboard | iLoveURL",
            description: "Manage iLoveURL history, credits, billing, resume files, and saved URL workflow outputs.",
          }
        : ROUTE_SEO[pathname] || DEFAULT_SEO;
    const canonical = `${SITE_URL}${pathname === "/" ? "/" : pathname}`;

    document.title = seo.title;
    setMeta("description", seo.description);
    setMeta("og:title", seo.title, "property");
    setMeta("og:description", seo.description, "property");
    setMeta("og:url", canonical, "property");
    setMeta("og:image", OG_IMAGE_URL, "property");
    setMeta("og:image:alt", "iLoveURL.space URL workflow toolkit", "property");
    setMeta("twitter:image", OG_IMAGE_URL);
    setMeta("twitter:title", seo.title);
    setMeta("twitter:description", seo.description);
    setCanonical(canonical);
  }, [location.pathname]);
}

function Navigation() {
  const location = useLocation();
  const [showDocs, setShowDocs] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;
  const isAuthPage = location.pathname === "/signin" || location.pathname === "/signup";
  const isDashboardPage = location.pathname.startsWith("/dashboard");

  const closeMobileMenu = () => setMobileMenuOpen(false);

  // Get user profile data
  const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || "";
  const firstName = fullName.split(" ")[0] || user?.email?.split("@")[0] || "User";
  const avatarUrl = user?.user_metadata?.avatar_url;

  if (showDocs) {
    return (
      <>
        <div className="fixed top-4 right-4 z-50">
          <Button onClick={() => setShowDocs(false)} variant="outline" className="gap-2">
            ← Back to App
          </Button>
        </div>
        <DesignSystemDocs />
      </>
    );
  }

  if (isAuthPage) return null;

  return (
    /* Header - Conditional Design (Pill for main, Full-width for dashboard) */
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300 backdrop-blur-md",
      isDashboardPage 
        ? "bg-white/80 border-b border-border-color shadow-sm" 
        : "top-3 left-3 right-3 sm:left-5 sm:right-5 md:top-4 md:left-10 md:right-10 bg-white/70 border border-white/20 rounded-full shadow-lg"
    )}>
      <div className={cn(
        "mx-auto flex h-full items-center justify-between px-4 sm:px-6 md:px-8",
        isDashboardPage ? "max-w-full" : "max-w-[1440px]"
      )}>
        <Link to="/" className="flex items-center gap-0 no-underline" onClick={closeMobileMenu}>
          <h1 className="font-display text-[19px] lowercase text-primary md:text-[24px]">iLoveURL<span className="text-[11px] md:text-[14px]">.space</span></h1>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-white/30 p-1.5 rounded-full border border-white/20">
          {!isDashboardPage && (
            <>
              <Link
                to="/"
                className={`text-[13px] font-bold uppercase tracking-[0.5px] px-4 py-2 rounded-full transition-all no-underline ${
                  isActive("/")
                    ? "text-primary bg-white shadow-sm"
                    : "text-nav-text hover:text-primary hover:bg-white/50"
                }`}
              >
                Home
              </Link>
              <Link
                to="/tools"
                className={`text-[13px] font-bold uppercase tracking-[0.5px] px-4 py-2 rounded-full transition-all no-underline ${
                  isActive("/tools")
                    ? "text-primary bg-white shadow-sm"
                    : "text-nav-text hover:text-primary hover:bg-white/50"
                }`}
              >
                Tools
              </Link>
              <Link
                to="/pricing"
                className={`text-[13px] font-bold uppercase tracking-[0.5px] px-4 py-2 rounded-full transition-all no-underline ${
                  isActive("/pricing")
                    ? "text-primary bg-white shadow-sm"
                    : "text-nav-text hover:text-primary hover:bg-white/50"
                }`}
              >
                Pricing
              </Link>
              <Link
                to="/about"
                className={`text-[13px] font-bold uppercase tracking-[0.5px] px-4 py-2 rounded-full transition-all no-underline ${
                  isActive("/about")
                    ? "text-primary bg-white shadow-sm"
                    : "text-nav-text hover:text-primary hover:bg-white/50"
                }`}
              >
                About
              </Link>
            </>
          )}
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="ml-2 flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 bg-white/50 hover:bg-white border border-white/40 rounded-full transition-all shadow-sm outline-none group">
                  <Avatar className="w-7 h-7 border border-primary/20 transition-transform group-hover:scale-105">
                    <AvatarImage src={avatarUrl} alt={fullName} />
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                      {firstName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-[13px] font-bold uppercase tracking-[0.5px] text-nav-text group-hover:text-primary transition-colors">
                    {firstName}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2 p-2 rounded-2xl shadow-xl border-border-color/50 bg-white/95 backdrop-blur-md">
                <DropdownMenuLabel className="px-3 py-2">
                  <div className="flex flex-col">
                    <span className="text-[14px] font-bold text-gray-text leading-tight">{fullName}</span>
                    <span className="text-[11px] text-gray-light font-medium truncate">{user.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1 bg-border-color/50" />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer font-bold text-[12px] uppercase tracking-wide text-nav-text hover:text-primary hover:bg-primary/5 transition-all">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/history" className="flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer font-bold text-[12px] uppercase tracking-wide text-nav-text hover:text-primary hover:bg-primary/5 transition-all">
                    <History className="w-4 h-4" />
                    History
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/resume" className="flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer font-bold text-[12px] uppercase tracking-wide text-nav-text hover:text-primary hover:bg-primary/5 transition-all">
                    <FileTextIcon className="w-4 h-4" />
                    Resume
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/settings" className="flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer font-bold text-[12px] uppercase tracking-wide text-nav-text hover:text-primary hover:bg-primary/5 transition-all">
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1 bg-border-color/50" />
                <DropdownMenuItem onClick={signOut} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-destructive focus:text-destructive focus:bg-destructive/5 cursor-pointer font-bold text-[12px] uppercase tracking-wide transition-all">
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/signin" className="ml-2">
              <Button size="sm" className="font-bold uppercase tracking-[0.5px] text-[12px] rounded-full px-5">
                Sign In
              </Button>
            </Link>
          )}
        </nav>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-primary hover:bg-white/50 rounded-full transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute left-0 right-0 top-20 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-3xl border border-white/20 bg-white/95 p-5 shadow-xl backdrop-blur-lg md:hidden">
          <nav className="flex flex-col space-y-2">
            <Link to="/" onClick={closeMobileMenu} className="text-[15px] font-bold uppercase px-4 py-3 rounded-full hover:bg-white/50 transition-colors">Home</Link>
            <Link to="/tools" onClick={closeMobileMenu} className="text-[15px] font-bold uppercase px-4 py-3 rounded-full hover:bg-white/50 transition-colors">Tools</Link>
            <Link to="/pricing" onClick={closeMobileMenu} className="text-[15px] font-bold uppercase px-4 py-3 rounded-full hover:bg-white/50 transition-colors">Pricing</Link>
            <Link to="/about" onClick={closeMobileMenu} className="text-[15px] font-bold uppercase px-4 py-3 rounded-full hover:bg-white/50 transition-colors">About</Link>
            <div className="pt-2 border-t border-border-color">
              {user ? (
                <div className="space-y-2">
                  <Link to="/dashboard" onClick={closeMobileMenu} className="flex items-center justify-between rounded-full px-4 py-3 text-[15px] font-bold uppercase transition-colors hover:bg-white/50">
                    Dashboard <LayoutDashboard className="h-4 w-4" />
                  </Link>
                  <Link to="/dashboard/history" onClick={closeMobileMenu} className="flex items-center justify-between rounded-full px-4 py-3 text-[15px] font-bold uppercase transition-colors hover:bg-white/50">
                    History <History className="h-4 w-4" />
                  </Link>
                  <Link to="/dashboard/resume" onClick={closeMobileMenu} className="flex items-center justify-between rounded-full px-4 py-3 text-[15px] font-bold uppercase transition-colors hover:bg-white/50">
                    Resume <FileTextIcon className="h-4 w-4" />
                  </Link>
                  <Button variant="outline" size="lg" className="w-full justify-between rounded-full" onClick={() => { signOut(); closeMobileMenu(); }}>
                    SIGN OUT <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Link to="/signin" onClick={closeMobileMenu}>
                  <Button size="lg" className="w-full rounded-full">Sign In</Button>
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

function InternalDocsPage() {
  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="fixed right-4 top-4 z-50">
        <Link to="/dashboard">
          <Button variant="outline" className="gap-2 rounded-full bg-white">
            Back to dashboard
          </Button>
        </Link>
      </div>
      <DesignSystemDocs />
    </div>
  );
}

function MainLayout() {
  const location = useLocation();
  useRouteSeo();
  const isAuthPage = location.pathname === "/signin" || location.pathname === "/signup";
  const isDashboardPage = location.pathname.startsWith("/dashboard");
  const isInternalPage = location.pathname.startsWith("/internal");

  return (
    <>
      <Navigation />
      
      {/* Scroll Blur Transition Mask - Creates a 'frosted' zone for content approaching the navbar */}
      {!isAuthPage && !isInternalPage && (
        <div 
          className={cn(
            "fixed top-0 left-0 right-0 z-40 pointer-events-none transition-all duration-300 backdrop-blur-[8px]",
            isDashboardPage ? "h-24" : "h-32"
          )}
          style={{ 
            maskImage: 'linear-gradient(to bottom, black 0%, black 50%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 50%, transparent 100%)'
          }}
        />
      )}
      
      {/* Main Content */}
      <main className="min-h-screen bg-background">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tools" element={<ToolsPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/payment" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/signin" element={<GuestOnlyRoute><SignInPage /></GuestOnlyRoute>} />
          <Route path="/signup" element={<GuestOnlyRoute><SignUpPage /></GuestOnlyRoute>} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/tool/:toolId" element={<ToolPage />} />
          <Route path="/internal/docs" element={<ProtectedRoute><InternalDocsPage /></ProtectedRoute>} />

          {/* Protected Dashboard Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardOverview /></ProtectedRoute>} />
          <Route path="/dashboard/history" element={<ProtectedRoute><DashboardHistory /></ProtectedRoute>} />
          <Route path="/dashboard/resume" element={<ProtectedRoute><DashboardResume /></ProtectedRoute>} />
          <Route path="/dashboard/settings" element={<ProtectedRoute><DashboardSettings /></ProtectedRoute>} />
          <Route path="/dashboard/billing" element={<ProtectedRoute><DashboardBilling /></ProtectedRoute>} />
          <Route path="/dashboard/*" element={<ProtectedRoute><NotFoundPage /></ProtectedRoute>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {/* Footer - Only show on non-auth pages and non-dashboard pages */}
      {!isAuthPage && !isDashboardPage && !isInternalPage && (
        <footer 
          className="relative bg-primary text-white border-t border-white/10 overflow-hidden min-h-[400px] flex items-end"
        >
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center opacity-30" 
            style={{ backgroundImage: `url(${footerBg})` }}
          ></div>
          <div className="max-w-[1440px] mx-auto px-5 md:px-10 pt-16 pb-8 relative z-10 w-full">
            <div className="mb-12 grid grid-cols-2 gap-8 sm:gap-10 md:mb-16 md:grid-cols-5 md:gap-12">
              <div className="col-span-2 md:col-span-1 space-y-4">
                <h1 className="text-[24px] font-display lowercase text-white">iLoveURL<span className="text-[14px]">.space</span></h1>
                <p className="text-[13px] text-white/70 leading-relaxed">
                  Transform any link into something powerful. The toolkit for the modern web.
                </p>
              </div>
              <div>
                <h3 className="text-[11px] font-extrabold uppercase tracking-[2px] text-white/50 mb-4">Tools</h3>
                <ul className="space-y-3">
                  {["Career", "Content", "Brand", "Research", "Quick"].map(item => (
                    <li key={item}><Link to="/" className="text-[14px] text-white/80 hover:text-white transition-colors">{item}</Link></li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-[11px] font-extrabold uppercase tracking-[2px] text-white/50 mb-4">Company</h3>
                <ul className="space-y-3">
                  <li><Link to="/about" className="text-[14px] text-white/80 hover:text-white">About</Link></li>
                  <li><Link to="/pricing" className="text-[14px] text-white/80 hover:text-white">Pricing</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-[11px] font-extrabold uppercase tracking-[2px] text-white/50 mb-4">Quick Links</h3>
                <ul className="space-y-3">
                  <li><Link to="/signin" className="text-[14px] text-white/80 hover:text-white">Sign In</Link></li>
                  <li><Link to="/signup" className="text-[14px] text-white/80 hover:text-white">Create Account</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-[11px] font-extrabold uppercase tracking-[2px] text-white/50 mb-4">Legal</h3>
                <ul className="space-y-3">
                  <li><Link to="/privacy" className="text-[14px] text-white/80 hover:text-white">Privacy</Link></li>
                  <li><Link to="/terms" className="text-[14px] text-white/80 hover:text-white">Terms</Link></li>
                </ul>
              </div>
            </div>
            <div className="flex flex-col gap-5 border-t border-white/10 pt-8 text-[12px] text-white/60 sm:flex-row sm:items-center sm:justify-between">
              <p>© 2026 iLoveURL. All rights reserved.</p>
              <div className="flex flex-wrap gap-4 sm:gap-6">
                {["Twitter", "GitHub", "LinkedIn"].map(s => <a key={s} href="#" className="font-bold uppercase hover:text-white transition-colors">{s}</a>)}
              </div>
            </div>
          </div>
        </footer>
      )}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MainLayout />
        <Toaster position="top-right" closeButton />
      </AuthProvider>
    </BrowserRouter>
  );
}

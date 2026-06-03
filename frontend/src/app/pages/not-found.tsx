import { Link } from "react-router-dom";
import { ArrowLeft, Compass, Home, Search } from "lucide-react";
import { Button } from "../components/ui/button";

export function NotFoundPage() {
  return (
    <main className="min-h-screen bg-[#F8F9FC] px-5 pb-20 pt-32 md:px-10">
      <div className="mx-auto max-w-[980px]">
        <Link to="/" className="mb-10 inline-flex items-center gap-2 text-[12px] font-black uppercase tracking-[2px] text-primary no-underline transition hover:opacity-70">
          <ArrowLeft className="h-4 w-4" />
          Back home
        </Link>

        <section className="overflow-hidden rounded-[40px] border-2 border-border-color bg-white shadow-[0_10px_0_0_#CFCFCF]">
          <div className="grid gap-0 lg:grid-cols-[1fr_320px]">
            <div className="p-8 md:p-12">
              <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-[24px] border-2 border-gray-950 bg-primary text-white shadow-[0_5px_0_0_#CFCFCF]">
                <Compass className="h-7 w-7" />
              </div>
              <p className="text-[11px] font-black uppercase tracking-[2px] text-primary/45">404 page not found</p>
              <h1 className="mt-4 max-w-2xl font-display text-[44px] lowercase leading-[0.9] text-gray-950 md:text-[72px]">
                this link wandered off.
              </h1>
              <p className="mt-6 max-w-xl text-[16px] font-semibold leading-relaxed text-gray-500">
                The page you are looking for does not exist, moved, or is not available in this workspace.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/">
                  <Button className="h-12 rounded-full px-7">
                    <Home className="mr-2 h-4 w-4" />
                    Home
                  </Button>
                </Link>
                <Link to="/tools">
                  <Button variant="outline" className="h-12 rounded-full bg-white px-7">
                    <Search className="mr-2 h-4 w-4" />
                    Browse Tools
                  </Button>
                </Link>
              </div>
            </div>

            <div className="border-t-2 border-border-color bg-primary/[0.04] p-8 lg:border-l-2 lg:border-t-0">
              <p className="text-[10px] font-black uppercase tracking-[2px] text-primary/45">try these</p>
              <div className="mt-5 space-y-3">
                {[
                  { label: "Article Summarizer", href: "/tool/article-summary" },
                  { label: "Brand Analyzer", href: "/tool/brand-analyzer" },
                  { label: "SEO Analyzer", href: "/tool/seo-analyzer" },
                  { label: "Dashboard", href: "/dashboard" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="block rounded-2xl bg-white px-4 py-3 text-[12px] font-black uppercase tracking-[1px] text-gray-700 no-underline shadow-sm transition hover:text-primary"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}


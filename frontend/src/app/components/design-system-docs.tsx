import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Logo } from "./logo";
import { ToolCard } from "./tool-card";
import { CategoryBadge } from "./category-badge";
import { URLInput } from "./url-input";
import { Container } from "./container";
import { FileSignature, Heart } from "lucide-react";

export function DesignSystemDocs() {
  return (
    <div className="min-h-screen bg-background py-12">
      <Container size="xl">
        <div className="space-y-12">
          {/* Header */}
          <div className="space-y-4">
            <h1 className="text-6xl">iLoveURL Design System</h1>
            <p className="text-xl text-muted-foreground">
              A comprehensive design system for building powerful URL transformation tools.
            </p>
          </div>

          <Separator />

          {/* Brand Colors */}
          <section className="space-y-6">
            <div>
              <h2 className="mb-2">Brand Colors</h2>
              <p className="text-muted-foreground">
                The core color palette that defines the iLoveURL brand identity.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <div className="h-24 rounded-lg bg-[#4F46E5] border border-border shadow-sm" />
                <div className="space-y-1">
                  <p className="text-sm font-mono">--brand-primary</p>
                  <p className="text-xs text-muted-foreground">#4F46E5</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-24 rounded-lg bg-[#3730A3] border border-border shadow-sm" />
                <div className="space-y-1">
                  <p className="text-sm font-mono">--brand-primary-dark</p>
                  <p className="text-xs text-muted-foreground">#3730A3</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-24 rounded-lg bg-[#F8F7FF] border border-border shadow-sm" />
                <div className="space-y-1">
                  <p className="text-sm font-mono">--brand-bg</p>
                  <p className="text-xs text-muted-foreground">#F8F7FF</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-24 rounded-lg bg-[#0F0E17] border border-border shadow-sm" />
                <div className="space-y-1">
                  <p className="text-sm font-mono">--brand-text</p>
                  <p className="text-xs text-muted-foreground">#0F0E17</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-24 rounded-lg bg-[#6B7280] border border-border shadow-sm" />
                <div className="space-y-1">
                  <p className="text-sm font-mono">--brand-muted</p>
                  <p className="text-xs text-muted-foreground">#6B7280</p>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Tool Category Colors */}
          <section className="space-y-6">
            <div>
              <h2 className="mb-2">Tool Category Colors</h2>
              <p className="text-muted-foreground">
                Each tool category has its own color identity for easy recognition.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <div className="h-24 rounded-lg bg-[#7C3AED] border border-border shadow-sm" />
                <div className="space-y-1">
                  <p className="text-sm font-mono">Career</p>
                  <p className="text-xs text-muted-foreground">#7C3AED</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-24 rounded-lg bg-[#0EA5E9] border border-border shadow-sm" />
                <div className="space-y-1">
                  <p className="text-sm font-mono">Content</p>
                  <p className="text-xs text-muted-foreground">#0EA5E9</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-24 rounded-lg bg-[#F97316] border border-border shadow-sm" />
                <div className="space-y-1">
                  <p className="text-sm font-mono">Design</p>
                  <p className="text-xs text-muted-foreground">#F97316</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-24 rounded-lg bg-[#10B981] border border-border shadow-sm" />
                <div className="space-y-1">
                  <p className="text-sm font-mono">Research</p>
                  <p className="text-xs text-muted-foreground">#10B981</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-24 rounded-lg bg-[#F59E0B] border border-border shadow-sm" />
                <div className="space-y-1">
                  <p className="text-sm font-mono">Quick</p>
                  <p className="text-xs text-muted-foreground">#F59E0B</p>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Typography */}
          <section className="space-y-6">
            <div>
              <h2 className="mb-2">Typography</h2>
              <p className="text-muted-foreground">
                A clear typographic hierarchy using Plus Jakarta Sans for headings and Inter for body text.
              </p>
            </div>

            <Card>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-2">
                  <h1>Hero Heading - Plus Jakarta Sans 800</h1>
                  <p className="text-sm text-muted-foreground font-mono">font-display / 56-72px / 800</p>
                </div>
                <div className="space-y-2">
                  <h2>Section Heading - Plus Jakarta Sans 700</h2>
                  <p className="text-sm text-muted-foreground font-mono">font-display / 32-40px / 700</p>
                </div>
                <div className="space-y-2">
                  <h3>Component Heading - Plus Jakarta Sans 600</h3>
                  <p className="text-sm text-muted-foreground font-mono">font-display / 18px / 600</p>
                </div>
                <div className="space-y-2">
                  <p className="text-base">Body Text - Inter 400</p>
                  <p className="text-sm text-muted-foreground font-mono">font-body / 16px / 400</p>
                </div>
                <div className="space-y-2">
                  <p className="font-mono text-sm">https://example.com/url - JetBrains Mono 400</p>
                  <p className="text-sm text-muted-foreground font-mono">font-mono / 14px / 400</p>
                </div>
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* Logo */}
          <section className="space-y-6">
            <div>
              <h2 className="mb-2">Logo</h2>
              <p className="text-muted-foreground">
                The iLoveURL logo in different sizes.
              </p>
            </div>

            <Card>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-3">
                  <Logo size="lg" showTagline />
                  <p className="text-sm text-muted-foreground">Large with tagline</p>
                </div>
                <Separator />
                <div className="space-y-3">
                  <Logo size="md" />
                  <p className="text-sm text-muted-foreground">Medium</p>
                </div>
                <Separator />
                <div className="space-y-3">
                  <Logo size="sm" />
                  <p className="text-sm text-muted-foreground">Small</p>
                </div>
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* Buttons */}
          <section className="space-y-6">
            <div>
              <h2 className="mb-2">Buttons</h2>
              <p className="text-muted-foreground">
                Button variants and sizes for different use cases.
              </p>
            </div>

            <Card>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-3">
                  <p className="text-sm font-semibold">Variants</p>
                  <div className="flex flex-wrap gap-3">
                    <Button>Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="destructive">Destructive</Button>
                    <Button variant="link">Link</Button>
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <p className="text-sm font-semibold">Sizes</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button size="sm">Small</Button>
                    <Button size="default">Default</Button>
                    <Button size="lg">Large</Button>
                    <Button size="icon">
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* Inputs */}
          <section className="space-y-6">
            <div>
              <h2 className="mb-2">Inputs</h2>
              <p className="text-muted-foreground">
                Input components including the specialized URL input.
              </p>
            </div>

            <Card>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-3">
                  <p className="text-sm font-semibold">Standard Input</p>
                  <Input placeholder="Enter text..." />
                </div>
                <Separator />
                <div className="space-y-3">
                  <p className="text-sm font-semibold">URL Input</p>
                  <URLInput placeholder="Paste any URL..." onSubmit={(url) => console.log(url)} />
                </div>
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* Category Badges */}
          <section className="space-y-6">
            <div>
              <h2 className="mb-2">Category Badges</h2>
              <p className="text-muted-foreground">
                Badges for categorizing tools by their purpose.
              </p>
            </div>

            <Card>
              <CardContent className="p-8">
                <div className="flex flex-wrap gap-3">
                  <CategoryBadge category="career" />
                  <CategoryBadge category="content" />
                  <CategoryBadge category="design" />
                  <CategoryBadge category="research" />
                  <CategoryBadge category="quick" />
                </div>
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* Tool Cards */}
          <section className="space-y-6">
            <div>
              <h2 className="mb-2">Tool Cards</h2>
              <p className="text-muted-foreground">
                The primary component for displaying individual tools.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ToolCard
                title="Cover Letter Generator"
                description="Transform any job posting into a tailored cover letter"
                icon={<FileSignature className="w-6 h-6" />}
                category="career"
              />
              <ToolCard
                title="Article Summarizer"
                description="Get the key points from any article instantly"
                icon={<FileSignature className="w-6 h-6" />}
                category="content"
              />
              <ToolCard
                title="Brand Analyzer"
                description="Extract colors, fonts, and design patterns from any site"
                icon={<FileSignature className="w-6 h-6" />}
                category="design"
              />
            </div>
          </section>
        </div>
      </Container>
    </div>
  );
}

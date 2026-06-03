import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "../components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Copy,
  Check,
  Loader2,
  ExternalLink,
  Download,
  Globe,
  User,
  Tag,
  FileText,
  File as FileIcon,
  Braces,
  Code2,
  LayoutTemplate,
  Eye,
  X,
  Zap as ZapIcon,
  Gauge,
  Sparkles,
  Crown,
  ChevronDown,
  Edit3,
  QrCode,
  Link as LinkIcon,
  BarChart3,
  Palette,
  Smartphone
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../components/auth-provider";
import { jsPDF } from "jspdf";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { ReportBlockRenderer } from "../components/generated/report-block-renderer";

const tools: Record<string, any> = {
  "cover-letter": { id: "cover-letter", name: "Cover Letter Generator", description: "Personalized cover letters from job links", purpose: "Turns a job post and your context into a tailored application letter.", output: "A polished cover letter with role alignment, proof points, and a professional close.", placeholder: "https://example.com/job" },
  "resume": { id: "resume", name: "Resume Match", description: "Match your resume to a job URL", purpose: "Compares an existing resume against a job post and recommends truthful, targeted improvements.", output: "A job-fit report with strong matches, gaps, supported keywords, recommended edits, and an optimized draft.", placeholder: "https://example.com/job" },
  "interview-prep": { id: "interview-prep", name: "Interview Prep Pack", description: "Questions, answer angles, and practice plan from a job URL", purpose: "Uses the job post and your resume profile to prepare realistic interview practice material.", output: "Role snapshot, likely interview themes, candidate talking points, practice questions, STAR prompts, and a 30-minute prep plan.", placeholder: "https://example.com/job" },
  "article-summary": { id: "article-summary", name: "URL Summarizer", description: "Instant key insights from any readable URL", purpose: "Reads the source page and compresses it into the ideas that matter.", output: "An executive summary, key points, important details, limits, and practical takeaways.", placeholder: "https://example.com/article" },
  "cross-article": { id: "cross-article", name: "Cross-Article Comparison", description: "Compare multiple sources side by side", purpose: "Reads 2-4 article URLs and compares agreement, differences, unique angles, and missing context.", output: "A source-by-source comparison with shared facts, key differences, verification notes, and a reader takeaway.", placeholder: "Paste 2-4 article URLs, one per line" },
  "study-notes": { id: "study-notes", name: "Study Notes", description: "Turn any source into notes, flashcards, and a quiz", purpose: "Converts educational pages, docs, and articles into active study material.", output: "Structured notes, a concept map, revealable flashcards, and an interactive quiz.", placeholder: "https://example.com/lesson" },
  "brand-analyzer": { id: "brand-analyzer", name: "Brand Analyzer", description: "Design system & brand identity audit", purpose: "Extracts brand evidence from a website and turns it into a usable brand report.", output: "Colors, typography, visual identity, positioning insights, and a downloadable brand document.", placeholder: "https://brand.com" },
  "seo-analyzer": { id: "seo-analyzer", name: "SEO Analyzer", description: "Complete technical & content SEO audit", purpose: "Checks a site for search visibility, content clarity, metadata, and performance signals.", output: "A prioritized SEO audit with PageSpeed/CrUX evidence, quick wins, and owner-friendly fixes.", placeholder: "https://site.com" },
  "url-shortener": { id: "url-shortener", name: "URL Shortener", description: "Memorable tracking links", purpose: "Converts long URLs into cleaner links that are easier to share.", output: "A shortened URL ready for campaigns, messages, or internal sharing.", placeholder: "https://long-link.com" },
  "qr-code": { id: "qr-code", name: "QR Code Generator", description: "Scannable design-ready codes", purpose: "Creates a QR code from any destination URL.", output: "A scannable QR asset for print, events, packaging, or quick mobile access.", placeholder: "https://target.com" },
  "presentation": { id: "presentation", name: "URL to Presentation", description: "Transform content to slides", purpose: "Transforms source material into presentation-ready structure.", output: "A slide outline or deck-style narrative based on the page content.", placeholder: "https://example.com/article" },
  "slide-deck": { id: "slide-deck", name: "URL to Slide Deck", description: "Highlights from release notes", purpose: "Turns a page into a structured slide deck draft.", output: "Slide-ready sections, talking points, and visual story flow.", placeholder: "https://example.com" },
  "mind-map": { id: "mind-map", name: "URL to Mind Map", description: "Visualize hierarchy structure", purpose: "Maps a URL into concepts and relationships.", output: "A hierarchy of main ideas, supporting topics, and connected details.", placeholder: "https://example.com" },
  "podcast-script": { id: "podcast-script", name: "URL to Transcribe", description: "Extract transcripts from YouTube, Facebook, Instagram, and TikTok", purpose: "Turns supported social video URLs into readable transcript text.", output: "A clean transcript with timestamps when available and reuse-ready text.", placeholder: "https://youtube.com/watch?v=..." },
  "link-preview": { id: "link-preview", name: "Link Preview", description: "Visualize Open Graph data", purpose: "Reads social preview metadata from a URL.", output: "A preview card showing title, description, image, and share metadata.", placeholder: "https://example.com" },
  "meta-tags": { id: "meta-tags", name: "Meta Tags Generator", description: "Optimize SEO tags", purpose: "Generates useful metadata from a page or target URL.", output: "Suggested title tags, descriptions, and social preview tags.", placeholder: "https://example.com" },
  "utm-manager": { id: "utm-manager", name: "UTM Link Manager", description: "Campaign tracking links", purpose: "Adds campaign tracking parameters to a destination URL.", output: "A tagged URL for analytics attribution across source, medium, and campaign.", placeholder: "https://example.com" },
  "url-cleaner": { id: "url-cleaner", name: "URL Cleaner", description: "Remove tracking parameters", purpose: "Strips unnecessary tracking noise from shared links.", output: "A cleaner URL that keeps the destination while removing common tracking parameters.", placeholder: "https://example.com?utm=..." },
  "social-post": { id: "social-post", name: "AI Social Post", description: "Generate viral content from URL", purpose: "Turns a URL into platform-ready social copy.", output: "Post drafts, hooks, and shareable angles from the source.", placeholder: "https://example.com" },
  "geo-audit": { id: "geo-audit", name: "GEO AI Audit", description: "Optimize AI engine visibility", purpose: "Reviews whether a page is easy for AI answer engines to understand.", output: "Recommendations for entity clarity, source structure, and answer-engine readiness.", placeholder: "https://example.com" },
  "chat-url": { id: "chat-url", name: "Chat with URL", description: "Interact with any webpage", purpose: "Lets you ask questions against the content of a URL.", output: "Conversational answers grounded in the source page.", placeholder: "https://example.com" },
  "broken-links": { id: "broken-links", name: "Broken Link Checker", description: "Scan for dead ends", purpose: "Checks links on a page for broken or risky destinations.", output: "A list of dead links, redirects, and pages that need attention.", placeholder: "https://example.com" },
  "tech-profiler": { id: "tech-profiler", name: "Tech Profiler", description: "Discover tech stack", purpose: "Inspects a website for visible technology signals.", output: "A detected stack profile covering frameworks, analytics, hosting, and scripts.", placeholder: "https://example.com" },
  "sitemap-gen": { id: "sitemap-gen", name: "Sitemap Generator", description: "Generate XML sitemaps", purpose: "Discovers site URLs and formats them for search engine crawling.", output: "A sitemap-ready URL list or XML structure.", placeholder: "https://example.com" },
};

const aiModeTools = new Set(["cover-letter", "resume", "interview-prep", "article-summary", "cross-article", "study-notes", "brand-analyzer", "seo-analyzer", "presentation"]);
const multiPreviewTools = new Set(["brand-analyzer", "seo-analyzer", "geo-audit"]);
const unreleasedTools = new Set(["presentation"]);
const socialVideoHostPatterns = [
  /(^|\.)youtube\.com$/,
  /(^|\.)youtu\.be$/,
  /(^|\.)facebook\.com$/,
  /(^|\.)fb\.watch$/,
  /(^|\.)instagram\.com$/,
  /(^|\.)tiktok\.com$/,
  /(^|\.)vm\.tiktok\.com$/,
];

const modes = [
  { id: "quick", label: "quick", icon: Gauge, title: "Quick mode" },
  { id: "standard", label: "standard", icon: Sparkles, title: "Standard mode" },
  { id: "deep", label: "deep", icon: Crown, title: "Deep mode" },
] as const;

const presentationThemes = [
  {
    id: "auto",
    label: "Auto",
    description: "Let iLoveURL choose based on the URL.",
    palette: ["#4F46E5", "#111827", "#E0F2FE"],
  },
  {
    id: "swift",
    label: "Swift",
    description: "Clean product pitch with bold sections.",
    palette: ["#4F46E5", "#0F172A", "#F8FAFC"],
  },
  {
    id: "modern",
    label: "Modern",
    description: "Visual-heavy, polished startup style.",
    palette: ["#111827", "#8B5CF6", "#E0E7FF"],
  },
  {
    id: "standard",
    label: "Standard",
    description: "Readable business/report deck.",
    palette: ["#2563EB", "#334155", "#DBEAFE"],
  },
  {
    id: "general",
    label: "General",
    description: "Simple flexible deck layout.",
    palette: ["#0284C7", "#111827", "#F1F5F9"],
  },
] as const;

type SavedResumeFileMeta = {
  name: string;
  type: string;
  size: number;
  updatedAt: number;
};

type CreditSummary = {
  plan_key: string;
  monthly_allowance: number;
  credits_remaining: number;
  topup_credits_remaining?: number;
};

type BillingPromptReason = "plan_required" | "insufficient_credits";

type BillingPromptState = {
  open: boolean;
  reason: BillingPromptReason;
  toolName?: string;
  creditsRequired?: number;
  creditsRemaining?: number;
};

const PLAN_ORDER = ["free", "starter", "pro", "pro-plus"] as const;
const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  "pro-plus": "Pro+",
};

function normalizePlanKey(plan?: string | null) {
  const normalized = String(plan || "free").toLowerCase();
  if (normalized === "team") return "pro-plus";
  return PLAN_ORDER.includes(normalized as any) ? normalized : "free";
}

function nextPlanKey(plan?: string | null) {
  const current = normalizePlanKey(plan);
  const index = PLAN_ORDER.indexOf(current as any);
  return PLAN_ORDER[Math.min(index + 1, PLAN_ORDER.length - 1)];
}

function openResumeDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("iloveurl-resume-profile", 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("files")) db.createObjectStore("files");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveResumeFileToDevice(key: string, file: File) {
  const db = await openResumeDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("files", "readwrite");
    tx.objectStore("files").put(
      {
        blob: file,
        meta: { name: file.name, type: file.type, size: file.size, updatedAt: Date.now() },
      },
      key
    );
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function loadSavedResumeFileFromDevice(key: string): Promise<{ file: File; meta: SavedResumeFileMeta } | null> {
  const db = await openResumeDb();
  const saved = await new Promise<any>((resolve, reject) => {
    const tx = db.transaction("files", "readonly");
    const request = tx.objectStore("files").get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  db.close();
  if (!saved?.blob || !saved?.meta) return null;
  return {
    file: new File([saved.blob], saved.meta.name, { type: saved.meta.type }),
    meta: saved.meta,
  };
}

export function ToolPage() {
  const { toolId } = useParams<{ toolId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [url, setUrl] = useState("");
  const [comparisonUrls, setComparisonUrls] = useState(["", ""]);
  const [userContext, setUserContext] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [saveResumeProfile, setSaveResumeProfile] = useState(true);
  const [savedResumeProfile, setSavedResumeProfile] = useState("");
  const [savedResumeFileMeta, setSavedResumeFileMeta] = useState<SavedResumeFileMeta | null>(null);
  const [selectedModel, setSelectedModel] = useState("deepseek/deepseek-v4-pro");
  const selectedMode = "standard";
  const [selectedPresentationTheme, setSelectedPresentationTheme] = useState<typeof presentationThemes[number]["id"]>("auto");
  const [qrOptions, setQrOptions] = useState({
    foreground: "#111827",
    background: "#ffffff",
    size: 500,
    margin: 2,
  });
  const [linkAnalytics, setLinkAnalytics] = useState<any>(null);
  const [previewMode, setPreviewMode] = useState<"document" | "markdown" | "json">("document");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingSavedResult, setIsLoadingSavedResult] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [creditSummary, setCreditSummary] = useState<CreditSummary | null>(null);
  const [billingPrompt, setBillingPrompt] = useState<BillingPromptState>({
    open: false,
    reason: "plan_required",
  });
  const [result, setResult] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const notificationAudioRef = useRef<AudioContext | null>(null);

  const loadingMessages = [
    "Preparing your workspace",
    "Reading the source URL",
    "Extracting the useful signals",
    "Structuring the report",
    "Polishing the final output",
    "Almost ready"
  ];

  const loadingDetails = [
    "Checking the request, selected mode, and destination tool.",
    "Collecting page content and filtering out page noise.",
    "Separating facts, metadata, media, and useful context.",
    "Building sections, cards, and export-ready document blocks.",
    "Running the final quality pass before the result appears.",
    "Saving the completed result to your history."
  ];

  // 0. Handle Dynamic Loading Steps
  useEffect(() => {
    let interval: any;
    if (isProcessing) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingMessages.length);
      }, 5000); // Change step every 5 seconds
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { user, session } = useAuth();

  useEffect(() => {
    if (!session?.access_token) {
      setCreditSummary(null);
      return;
    }

    let cancelled = false;
    const api = import.meta.env.VITE_API_URL || "http://localhost:8080";
    fetch(`${api}/api/credits/me`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((response) => response.ok ? response.json() : null)
      .then((summary) => {
        if (!cancelled) setCreditSummary(summary);
      })
      .catch(() => {
        if (!cancelled) setCreditSummary(null);
      });

    return () => {
      cancelled = true;
    };
  }, [session?.access_token]);

  const tool = toolId ? tools[toolId] : null;
  const isUnreleasedTool = tool ? unreleasedTools.has(tool.id) : false;
  const showModeSelector = false;
  const supportsPreviewFormats = tool ? multiPreviewTools.has(tool.id) : false;
  const activePreviewMode = supportsPreviewFormats ? previewMode : "document";
  const resumeProfileStorageKey = user?.id ? `iloveurl.resumeProfile.${user.id}` : "iloveurl.resumeProfile.guest";
  const resumeFileStorageKey = user?.id ? `iloveurl.resumeFile.${user.id}` : "iloveurl.resumeFile.guest";
  const normalizedComparisonUrls = comparisonUrls.map((item) => item.trim()).filter(Boolean);

  const validateToolUrl = (value: string, label = "URL") => {
    const trimmed = value.trim();
    if (!trimmed) return `${label} is required.`;
    if (trimmed.length > 2048) return `${label} is too long.`;
    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      return `${label} must start with http:// or https://.`;
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return `${label} must use http:// or https://.`;
    if (parsed.username || parsed.password) return `${label} cannot include embedded credentials.`;
    const hostname = parsed.hostname.toLowerCase();
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".local") || /^10\.|^172\.(1[6-9]|2\d|3[0-1])\.|^192\.168\./.test(hostname)) {
      return `${label} must be a public website URL.`;
    }
    if (toolId === "podcast-script" && !socialVideoHostPatterns.some((pattern) => pattern.test(hostname))) {
      return "URL to Transcribe supports YouTube, Facebook, Instagram, and TikTok links only.";
    }
    return null;
  };

  const showUrlErrorToast = (message: string) => {
    if (toolId === "podcast-script" && /youtube|facebook|instagram|tiktok|supported/i.test(message)) {
      toast.error("Unsupported video URL", {
        description: "URL to Transcribe currently supports YouTube, Facebook, Instagram, and TikTok links.",
        duration: 6200,
      });
      return;
    }

    toast.error("Check the URL", {
      description: message,
      duration: 5200,
    });
  };

  useEffect(() => {
    const slug = result?.data?.slug || result?.slug;
    if (!slug || !["url-shortener", "qr-code"].includes(tool?.id || "")) {
      setLinkAnalytics(null);
      return;
    }

    let cancelled = false;
    const api = import.meta.env.VITE_API_URL || "http://localhost:8080";
    fetch(`${api}/api/tools/shorten/${slug}/analytics`)
      .then((res) => (res.ok ? res.json() : null))
      .then((analytics) => {
        if (!cancelled) setLinkAnalytics(analytics);
      })
      .catch(() => {
        if (!cancelled) setLinkAnalytics(null);
      });

    return () => {
      cancelled = true;
    };
  }, [result, tool?.id]);

  const ensureNotificationAudio = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass || notificationAudioRef.current) return;
      notificationAudioRef.current = new AudioContextClass();
      const oscillator = notificationAudioRef.current.createOscillator();
      const gain = notificationAudioRef.current.createGain();
      gain.gain.setValueAtTime(0.0001, notificationAudioRef.current.currentTime);
      oscillator.connect(gain);
      gain.connect(notificationAudioRef.current.destination);
      oscillator.start();
      oscillator.stop(notificationAudioRef.current.currentTime + 0.01);
    } catch {
      // Browsers may still block audio until the user interacts again.
    }
  };

  const playDoneSound = () => {
    try {
      ensureNotificationAudio();
      const audioContext = notificationAudioRef.current;
      if (!audioContext) return;
      const gain = audioContext.createGain();
      gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.55);
      gain.connect(audioContext.destination);

      [660, 880].forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + index * 0.12);
        oscillator.connect(gain);
        oscillator.start(audioContext.currentTime + index * 0.12);
        oscillator.stop(audioContext.currentTime + 0.22 + index * 0.12);
      });
    } catch {
      // Sound notifications are best-effort; browsers may block audio in some cases.
    }
  };

  // 1. Calculate Unique Fonts
  const uniqueFonts = useMemo(() => {
    const rawFonts = result?.data?.typography || [];
    return Array.from(new Set(rawFonts.map((f: any) => typeof f === 'string' ? f : f.family))).filter(Boolean);
  }, [result]);

  // 2. Initial State Loading
  useEffect(() => {
    const taskId = searchParams.get("taskId");
    if (taskId) {
      let pollInterval: any;
      let completed = false;
      let hasSeenProcessing = false;

      const fetchTask = async (isInitialLoad = false) => {
        if (isInitialLoad) {
          setIsLoadingSavedResult(true);
        }
        try {
          const api = import.meta.env.VITE_API_URL || "http://localhost:8080";
          const res = await fetch(`${api}/api/tasks/${taskId}`, {
            headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
          });
          if (!res.ok) throw new Error("Result not found");
          const data = await res.json();

          if (data.status === 'completed') {
            if (completed) return;
            completed = true;
            setResult(data); // The response is already transformed/flattened in tasks.ts
            if (data.logs) setLogs(data.logs);
            if (tool?.id === "cross-article" && Array.isArray(data.data?.urls)) {
              setComparisonUrls(data.data.urls.slice(0, 4));
            } else if (data.url) {
              setUrl(data.url);
            }
            setIsProcessing(false);
            if (!isInitialLoad || hasSeenProcessing) {
              toast.success(`${tool?.name || "Your result"} is ready`);
              playDoneSound();
            }
            clearInterval(pollInterval);
          } else if (data.status === 'failed') {
            console.error("Task failed:", data);
            if (!isInitialLoad) {
              toast.error("Analysis failed: " + (data.error || data.data?.error || "Unknown error"));
            }
            setIsProcessing(false);
            clearInterval(pollInterval);
          } else {
            // Still processing, update logs for live view
            hasSeenProcessing = true;
            setIsProcessing(true);
            if (data.logs) setLogs(data.logs);
            if (tool?.id !== "cross-article" && data.url) setUrl(data.url);
          }
        } catch (e) {
          toast.error("Could not retrieve document");
          setIsProcessing(false);
          clearInterval(pollInterval);
        } finally {
          if (isInitialLoad) {
            setIsLoadingSavedResult(false);
          }
        }
      };

      fetchTask(true).then(() => {
        if (!completed) {
          pollInterval = setInterval(() => fetchTask(false), 3000); // Poll every 3 seconds
        }
      });
      return () => clearInterval(pollInterval);
    } else {
      const urlParam = searchParams.get("url");
      if (urlParam) {
        if (tool?.id === "cross-article") {
          const urls = urlParam.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean);
          setComparisonUrls(urls.length >= 2 ? urls.slice(0, 4) : [urls[0] || "", ""]);
        } else {
          setUrl(urlParam);
        }
      }
    }
  }, [searchParams, tool?.name, session?.access_token]);

  useEffect(() => {
    if (tool?.id !== "resume" && tool?.id !== "cover-letter" && tool?.id !== "interview-prep") return;
    const saved = window.localStorage.getItem(resumeProfileStorageKey) || "";
    setSavedResumeProfile(saved);
    if (saved && !userContext) setUserContext(saved);
    if (user?.id) {
      const api = import.meta.env.VITE_API_URL || "http://localhost:8080";
      fetch(`${api}/api/resume-profile/${user.id}`, {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      })
        .then((response) => response.ok ? response.json() : null)
        .then((payload) => {
          const profile = payload?.profile;
          if (!profile?.resume_text) return;
          setSavedResumeProfile(profile.resume_text);
          if (!userContext) setUserContext(profile.resume_text);
          if (profile.file_name) {
            setSavedResumeFileMeta({
              name: profile.file_name,
              type: "database",
              size: profile.resume_text.length,
              updatedAt: profile.updated_at ? new Date(profile.updated_at).getTime() : Date.now(),
            });
          }
        })
        .catch(() => undefined);
    }
    loadSavedResumeFileFromDevice(resumeFileStorageKey)
      .then((savedFile) => {
        if (savedFile?.meta) setSavedResumeFileMeta(savedFile.meta);
      })
      .catch(() => setSavedResumeFileMeta(null));
  }, [resumeProfileStorageKey, resumeFileStorageKey, tool?.id, user?.id, session?.access_token]);

  // 3. Dynamic Font Loader for Typography Specimens
  useEffect(() => {
    if (uniqueFonts.length > 0) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      const families = uniqueFonts.map((f: any) => `${f.replace(/\s+/g, '+')}:wght@400;700;800`).join('&family=');
      link.href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
      document.head.appendChild(link);
      return () => { document.head.removeChild(link); };
    }
  }, [uniqueFonts]);

  // 4. High-Fidelity Continuous Document Engine
  const formattedHtml = useMemo(() => {
    if (!result?.summary) return "";

    let contentMd = result.summary;
    const statusLabel = (status: string) => ({
      strong: "Strong",
      needs_work: "Needs Work",
      critical: "Critical",
      insufficient_data: "Insufficient Data",
    } as Record<string, string>)[status] || status || "Unknown";
    const statusColor = (status: string) => ({
      strong: "#16A34A",
      needs_work: "#D97706",
      critical: "#DC2626",
      insufficient_data: "#6B7280",
    } as Record<string, string>)[status] || "#6B7280";

    let seoSnapshotHtml = "";
    if (toolId === "seo-analyzer" && result.data?.auditSnapshot) {
      const snapshot = result.data.auditSnapshot;
      const pillars = snapshot.pillars || [];
      const priorities = snapshot.topPriorities || [];
      const pageSpeed = result.data?.seoContext?.performanceSignals?.pageSpeed || [];
      const crux = result.data?.seoContext?.performanceSignals?.crux;

      seoSnapshotHtml = `
        <div class="seo-visual-report" style="margin-bottom: 32px;">
          <p style="font-size: 10px !important; font-weight: 900 !important; color: rgb(156, 163, 175) !important; text-transform: uppercase !important; letter-spacing: 3px !important; margin-bottom: 14px !important; text-align: left !important;">SEO Health Snapshot</p>
          <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-bottom: 22px;">
            ${pillars.map((pillar: any) => `
              <div style="border: 1px solid #E5E7EB; padding: 12px; border-radius: 8px;">
                <p style="font-size: 10px !important; color: #6B7280 !important; text-transform: uppercase !important; font-weight: 800 !important; margin: 0 0 6px !important; text-align: left !important;">${pillar.name}</p>
                <p style="font-size: 16px !important; font-weight: 900 !important; margin: 0 0 6px !important; color: ${statusColor(pillar.status)} !important; text-align: left !important;">${statusLabel(pillar.status)}</p>
                <p style="font-size: 11px !important; line-height: 1.35 !important; color: #374151 !important; margin: 0 !important; text-align: left !important;">${pillar.rationale || ""}</p>
              </div>
            `).join("")}
          </div>

          <p style="font-size: 10px !important; font-weight: 900 !important; color: rgb(156, 163, 175) !important; text-transform: uppercase !important; letter-spacing: 3px !important; margin-bottom: 14px !important; text-align: left !important;">Top Priorities</p>
          <table style="width: 100%; border-collapse: collapse; margin: 0 0 22px 0; border: 1.5px solid #111827;">
            <thead>
              <tr>
                <th style="text-align: left !important;">Priority</th>
                <th style="text-align: left !important;">Owner</th>
                <th style="text-align: left !important;">Impact / Effort</th>
              </tr>
            </thead>
            <tbody>
              ${priorities.map((priority: any, index: number) => `
                <tr>
                  <td><strong>${index + 1}. ${priority.title}</strong><br/><span style="font-size: 11px !important; color: #4B5563 !important;">${priority.action}</span></td>
                  <td>${priority.owner}</td>
                  <td>${priority.impact} / ${priority.effort}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          ${pageSpeed.length ? `
            <p style="font-size: 10px !important; font-weight: 900 !important; color: rgb(156, 163, 175) !important; text-transform: uppercase !important; letter-spacing: 3px !important; margin-bottom: 14px !important; text-align: left !important;">PageSpeed Evidence</p>
            <div style="display: grid; grid-template-columns: repeat(${Math.min(pageSpeed.length, 2)}, minmax(0, 1fr)); gap: 10px;">
              ${pageSpeed.slice(0, 2).map((item: any) => `
                <div style="border: 1px solid #E5E7EB; padding: 12px; border-radius: 8px;">
                  <p style="font-size: 12px !important; font-weight: 900 !important; text-transform: capitalize !important; margin: 0 0 8px !important; text-align: left !important;">${item.strategy}</p>
                  <p style="font-size: 22px !important; font-weight: 900 !important; margin: 0 0 4px !important; color: ${statusColor(item.scores?.performance < 50 ? "critical" : item.scores?.performance < 75 ? "needs_work" : "strong")} !important; text-align: left !important;">${item.scores?.performance ?? "n/a"}</p>
                  <p style="font-size: 10px !important; color: #6B7280 !important; margin: 0 !important; text-align: left !important;">Source: ${item.sourceLabel || "Google PageSpeed Insights"}${item.fetchedAt ? `, fetched ${new Date(item.fetchedAt).toLocaleString()}` : ""}</p>
                </div>
              `).join("")}
            </div>
          ` : ""}

          ${crux ? `
            <p style="font-size: 10px !important; font-weight: 900 !important; color: rgb(156, 163, 175) !important; text-transform: uppercase !important; letter-spacing: 3px !important; margin: 18px 0 14px !important; text-align: left !important;">CrUX Real-User Evidence</p>
            <div style="border: 1px solid #E5E7EB; padding: 12px; border-radius: 8px;">
              <p style="font-size: 12px !important; font-weight: 900 !important; margin: 0 0 8px !important; text-align: left !important;">${crux.available ? `Core Web Vitals: ${crux.coreWebVitalsAssessment}` : "Core Web Vitals: insufficient data"}</p>
              <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin-bottom: 8px;">
                <p style="font-size: 11px !important; margin: 0 !important; text-align: left !important;"><strong>LCP</strong><br/>${crux.metrics?.largestContentfulPaint?.p75 ?? "n/a"} ms</p>
                <p style="font-size: 11px !important; margin: 0 !important; text-align: left !important;"><strong>INP</strong><br/>${crux.metrics?.interactionToNextPaint?.p75 ?? "n/a"} ms</p>
                <p style="font-size: 11px !important; margin: 0 !important; text-align: left !important;"><strong>CLS</strong><br/>${crux.metrics?.cumulativeLayoutShift?.p75 ?? "n/a"}</p>
                <p style="font-size: 11px !important; margin: 0 !important; text-align: left !important;"><strong>FCP</strong><br/>${crux.metrics?.firstContentfulPaint?.p75 ?? "n/a"} ms</p>
              </div>
              <p style="font-size: 10px !important; color: #6B7280 !important; margin: 0 !important; text-align: left !important;">Source: ${crux.sourceLabel || "Chrome UX Report"}${crux.collectionPeriod?.lastDate ? `, collection through ${crux.collectionPeriod.lastDate}` : ""}${crux.scope ? `, ${crux.scope}-level data` : ""}</p>
            </div>
          ` : ""}
        </div>
      `;
    }

    let reportBlocksHtml = "";
    if (Array.isArray(result.data?.reportBlocks) && result.data.reportBlocks.length > 0) {
      reportBlocksHtml = `
        <div class="report-blocks-pdf" style="margin-bottom: 32px;">
          ${result.data.reportBlocks.map((block: any, blockIndex: number) => {
            if (block.type === "overview") {
              return `
                <div style="border:1px solid #E5E7EB; border-radius:8px; padding:16px; margin-bottom:14px;">
                  <p style="font-size:10px !important; font-weight:900 !important; color:#9CA3AF !important; text-transform:uppercase !important; letter-spacing:3px !important; margin:0 0 8px !important; text-align:left !important;">Generated Overview</p>
                  <h2 style="font-size:20px !important; border:0 !important; margin:0 0 10px !important; padding:0 !important;">${block.title}</h2>
                  <p style="font-size:14px !important; margin:0 0 12px !important; text-align:left !important;">${block.body}</p>
                  ${Array.isArray(block.meta) ? `<table style="width:100%; border-collapse:collapse; margin:12px 0 0; border:1px solid #E5E7EB;">${block.meta.map((item: any) => `<tr><td style="border:1px solid #E5E7EB; font-weight:800;">${item.label}</td><td style="border:1px solid #E5E7EB;">${item.value}</td></tr>`).join("")}</table>` : ""}
                </div>
              `;
            }
            if (block.type === "key_points") {
              return `
                <div style="border:1px solid #E5E7EB; border-radius:8px; padding:16px; margin-bottom:14px;">
                  <p style="font-size:10px !important; font-weight:900 !important; color:#9CA3AF !important; text-transform:uppercase !important; letter-spacing:3px !important; margin:0 0 10px !important; text-align:left !important;">${block.title}</p>
                  <ol style="margin:0; padding-left:20px;">${(block.points || []).map((point: string) => `<li>${point}</li>`).join("")}</ol>
                </div>
              `;
            }
            if (block.type === "info_table") {
              return `
                <div style="border:1px solid #E5E7EB; border-radius:8px; padding:16px; margin-bottom:14px;">
                  <p style="font-size:10px !important; font-weight:900 !important; color:#9CA3AF !important; text-transform:uppercase !important; letter-spacing:3px !important; margin:0 0 10px !important; text-align:left !important;">${block.title}</p>
                  <table style="width:100%; border-collapse:collapse; margin:0; border:1px solid #111827;">${(block.rows || []).map((row: any) => `<tr><td style="border:1px solid #111827; font-weight:800; width:32%;">${row.label}</td><td style="border:1px solid #111827;">${row.value}</td></tr>`).join("")}</table>
                </div>
              `;
            }
            if (block.type === "action_list") {
              return `
                <div style="border:1px solid #E5E7EB; border-radius:8px; padding:16px; margin-bottom:14px;">
                  <p style="font-size:10px !important; font-weight:900 !important; color:#9CA3AF !important; text-transform:uppercase !important; letter-spacing:3px !important; margin:0 0 10px !important; text-align:left !important;">${block.title}</p>
                  ${(block.actions || []).map((action: any) => `<p style="margin:0 0 8px !important; text-align:left !important;"><strong>${action.label}:</strong> ${action.detail}</p>`).join("")}
                </div>
              `;
            }
            if (block.type === "faq") {
              return `
                <div style="border:1px solid #E5E7EB; border-radius:8px; padding:16px; margin-bottom:14px;">
                  <p style="font-size:10px !important; font-weight:900 !important; color:#9CA3AF !important; text-transform:uppercase !important; letter-spacing:3px !important; margin:0 0 10px !important; text-align:left !important;">${block.title}</p>
                  ${(block.items || []).map((item: any) => `<p style="margin:0 0 10px !important; text-align:left !important;"><strong>${item.question}</strong><br/>${item.answer}</p>`).join("")}
                </div>
              `;
            }
            if (block.type === "flashcards") {
              return `
                <div style="border:1px solid #E5E7EB; border-radius:8px; padding:16px; margin-bottom:14px;">
                  <p style="font-size:10px !important; font-weight:900 !important; color:#9CA3AF !important; text-transform:uppercase !important; letter-spacing:3px !important; margin:0 0 10px !important; text-align:left !important;">${block.title}</p>
                  <table style="width:100%; border-collapse:collapse; margin:0; border:1px solid #111827;">${(block.cards || []).map((card: any) => `<tr><td style="border:1px solid #111827; font-weight:800; width:34%;">${card.front}</td><td style="border:1px solid #111827;">${card.back}</td></tr>`).join("")}</table>
                </div>
              `;
            }
            if (block.type === "quiz") {
              return `
                <div style="border:1px solid #E5E7EB; border-radius:8px; padding:16px; margin-bottom:14px;">
                  <p style="font-size:10px !important; font-weight:900 !important; color:#9CA3AF !important; text-transform:uppercase !important; letter-spacing:3px !important; margin:0 0 10px !important; text-align:left !important;">${block.title}</p>
                  ${(block.questions || []).map((item: any, questionIndex: number) => `<p style="margin:0 0 10px !important; text-align:left !important;"><strong>${questionIndex + 1}. ${item.question}</strong><br/><span style="font-size:12px !important;">Answer: ${item.answer}</span></p>`).join("")}
                </div>
              `;
            }
            if (block.type === "mind_map") {
              return `
                <div style="border:1px solid #E5E7EB; border-radius:8px; padding:16px; margin-bottom:14px;">
                  <p style="font-size:10px !important; font-weight:900 !important; color:#9CA3AF !important; text-transform:uppercase !important; letter-spacing:3px !important; margin:0 0 10px !important; text-align:left !important;">${block.title}</p>
                  <p style="font-weight:900 !important; margin:0 0 8px !important; text-align:left !important;">${block.root?.label || "Main Topic"}</p>
                  <ul>${(block.root?.children || []).map((child: any) => `<li><strong>${child.label}</strong>${child.children?.length ? `<ul>${child.children.map((grandchild: any) => `<li>${grandchild.label}</li>`).join("")}</ul>` : ""}</li>`).join("")}</ul>
                </div>
              `;
            }
            if (block.type === "presentation_deck") {
              return `
                <div style="border:1px solid #E5E7EB; border-radius:8px; padding:16px; margin-bottom:18px;">
                  <p style="font-size:10px !important; font-weight:900 !important; color:#9CA3AF !important; text-transform:uppercase !important; letter-spacing:3px !important; margin:0 0 8px !important; text-align:left !important;">Slide Deck Plan</p>
                  <h2 style="font-size:22px !important; border:0 !important; margin:0 0 8px !important; padding:0 !important;">${block.title}</h2>
                  <p style="font-size:12px !important; margin:0 0 12px !important; text-align:left !important;"><strong>Theme:</strong> ${block.theme} &nbsp; <strong>Audience:</strong> ${block.audience}</p>
                  ${(block.slides || []).map((slide: any) => `
                    <div style="border-top:1px solid #E5E7EB; padding-top:12px; margin-top:12px;">
                      <h3 style="font-size:15px !important; margin:0 0 8px !important; text-align:left !important;">Slide ${slide.slideNumber}: ${slide.title}</h3>
                      <p style="font-size:11px !important; margin:0 0 8px !important; text-align:left !important;"><strong>Role:</strong> ${slide.role}</p>
                      <ul>${(slide.bullets || []).map((bullet: string) => `<li>${bullet}</li>`).join("")}</ul>
                      <p style="font-size:12px !important; margin:8px 0 0 !important; text-align:left !important;"><strong>Visual:</strong> ${slide.visualDirection}</p>
                      <p style="font-size:12px !important; margin:6px 0 0 !important; text-align:left !important;"><strong>Speaker note:</strong> ${slide.speakerNotes}</p>
                    </div>
                  `).join("")}
                </div>
              `;
            }
            return "";
          }).join("")}
        </div>
      `;
    }

    // Create Typography Specimen sample
    let specimenHtml = "";
    if (toolId === "brand-analyzer" && uniqueFonts.length > 0) {
      specimenHtml = `
        <div class="typography-specimen-container" style="margin-top: 40px; padding-top: 40px; border-top: 2px solid rgb(243, 244, 246);">
          <p style="font-size: 10px !important; font-weight: 900 !important; color: rgb(156, 163, 175) !important; text-transform: uppercase !important; letter-spacing: 4px !important; margin-bottom: 20px !important; font-family: Arial, sans-serif !important;">Typography Specimen</p>
          ${uniqueFonts.slice(0, 2).map((family: any) => `
              <div style="margin-bottom: 24px;">
                <p style="font-size: 12px !important; font-weight: bold !important; color: rgb(209, 213, 219) !important; margin-bottom: 6px !important; font-family: Arial, sans-serif !important;">${family}</p>
                <p class="font-sample" style="font-family: '${family}', sans-serif !important; font-size: 28px !important; line-height: 1.1 !important; color: rgb(0, 0, 0) !important; font-weight: 400 !important; text-align: left !important;">The quick brown fox jumps over the lazy dog.</p>
                <p class="font-sample" style="font-family: '${family}', sans-serif !important; font-size: 28px !important; line-height: 1.1 !important; color: rgb(0, 0, 0) !important; font-weight: 700 !important; text-align: left !important;">The quick brown fox jumps over the lazy dog.</p>
              </div>
            `).join('')}
        </div>
      `;
    }

    // Process markdown to HTML
    const renderContent = (md: string) => {
      return marked.parse(md.replace(/^#+\s*(Final Verdict|Conclusion|Verdict)\s*$/gim, "").trim())
        .replace(/(?<!["':])#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\b/g, (match) => {
          return `<span style="display:inline-flex; align-items:center; gap:6px; margin-right:4px;"><span style="width:12px; height:12px; border-radius:100%; background-color:${match}; border:1px solid rgb(238,238,238); display:inline-block;"></span>${match}</span>`;
        });
    };

    let htmlBody = renderContent(contentMd);
    if (specimenHtml) {
      const lines = contentMd.split('\n');
      const visualIdentityIdx = lines.findIndex((line) => /^##\s+Visual Identity\b/i.test(line.trim()));

      if (visualIdentityIdx !== -1) {
        const nextSectionIdx = lines.findIndex((line, index) => index > visualIdentityIdx && /^##\s+/.test(line.trim()));
        const insertIdx = nextSectionIdx === -1 ? lines.length : nextSectionIdx;
        const beforeSpecimen = lines.slice(0, insertIdx).join('\n');
        const afterSpecimen = lines.slice(insertIdx).join('\n');
        htmlBody = renderContent(beforeSpecimen) + specimenHtml + renderContent(afterSpecimen);
      } else {
        htmlBody += specimenHtml;
      }
    }

    // Logo Header with reduced spacing (20px instead of 60px)
    let header = "";
    if (toolId === "brand-analyzer" && result.data?.logoUrl) {
      header = `<div style="text-align: center; margin-bottom: 20px;"><img src="${result.data.logoUrl}" style="max-height: 80px; object-fit: contain;" /></div>`;
    }

    return `<div class="raw-doc-studio">${header}${seoSnapshotHtml}${reportBlocksHtml}${htmlBody}</div>`;
  }, [result, toolId, uniqueFonts]);

  const markdownPreview = useMemo(() => {
    return result?.summary || "";
  }, [result]);

  const jsonPreview = useMemo(() => {
    if (!result) return "";
    return JSON.stringify(result.data || result, null, 2);
  }, [result]);

  const jsonPreviewLines = useMemo(() => {
    return jsonPreview ? jsonPreview.split("\n") : [];
  }, [jsonPreview]);

  const downloadTextFile = (content: string, filename: string, mimeType: string) => {
    if (!content) return;
    const blob = new Blob([content], { type: mimeType });
    const objectUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(objectUrl);
    toast.success(`${filename} saved`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeUrl = toolId === "cross-article" ? normalizedComparisonUrls[0] || "" : url;
    if (!activeUrl) return;
    if (toolId === "cross-article" && normalizedComparisonUrls.length < 2) {
      toast.error("Add at least two article URLs to compare.");
      return;
    }
    if (toolId === "cross-article") {
      const invalidComparisonUrl = normalizedComparisonUrls
        .map((item, index) => ({ item, error: validateToolUrl(item, `Source ${index + 1}`) }))
        .find((item) => item.error);
      if (invalidComparisonUrl?.error) {
        showUrlErrorToast(invalidComparisonUrl.error);
        return;
      }
    } else {
      const urlError = validateToolUrl(activeUrl);
      if (urlError) {
        showUrlErrorToast(urlError);
        return;
      }
    }
    if (isUnreleasedTool) {
      toast.info(`${tool?.name || "This tool"} is coming soon.`);
      return;
    }
    ensureNotificationAudio();
    setIsProcessing(true);
    setResult(null);
    setLogs([
      "Request received",
      `Selected tool: ${tool?.name || toolId}`,
      "Mode: standard",
    ]);
    try {
      const api = import.meta.env.VITE_API_URL || "http://localhost:8080";
      const body: any = { url: activeUrl, userId: user?.id, model: selectedModel, mode: "standard" };
      if (userContext) body.context = userContext;
      if (toolId === "cross-article") {
        body.urls = normalizedComparisonUrls;
      }
      if (toolId === "presentation") body.presentonTemplate = selectedPresentationTheme;
      if (toolId === "qr-code") {
        body.options = {
          width: qrOptions.size,
          margin: qrOptions.margin,
          color: {
            dark: qrOptions.foreground,
            light: qrOptions.background,
          },
          errorCorrectionLevel: "H",
        };
      }

      let endpoint = `/api/tools/${toolId?.replace("-analyzer", "")}`;
      if (toolId === "article-summary") endpoint = "/api/tools/summarize";
      if (toolId === "cross-article") endpoint = "/api/tools/cross-article";
      if (toolId === "study-notes") endpoint = "/api/tools/studynotes";
      if (toolId === "presentation") endpoint = "/api/tools/presentation";
      if (toolId === "interview-prep") endpoint = "/api/tools/interview-prep";
      if (toolId === "podcast-script") endpoint = "/api/tools/transcribe";
      if (toolId === "qr-code") endpoint = "/api/tools/qrcode";
      if (toolId === "url-shortener") endpoint = "/api/tools/shorten";
      if (toolId === "utm-manager") endpoint = "/api/tools/utm";
      if (toolId === "url-cleaner") endpoint = "/api/tools/cleaner";
      if (toolId === "meta-tags") endpoint = "/api/tools/metatags";
      if (toolId === "link-preview") endpoint = "/api/tools/linkpreview";

      let requestBody: BodyInit = JSON.stringify(body);
      const authHeaders: HeadersInit = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
      let requestHeaders: HeadersInit | undefined = { "Content-Type": "application/json", ...authHeaders };

      if (toolId === "resume" || toolId === "cover-letter" || toolId === "interview-prep") {
        if (!userContext.trim() && !resumeFile) {
          throw new Error("Paste, upload, or reuse your saved resume before processing this job URL.");
        }
        if (saveResumeProfile && userContext.trim()) {
          window.localStorage.setItem(resumeProfileStorageKey, userContext.trim());
          setSavedResumeProfile(userContext.trim());
        }
        if (saveResumeProfile && resumeFile) {
          await saveResumeFileToDevice(resumeFileStorageKey, resumeFile);
          setSavedResumeFileMeta({
            name: resumeFile.name,
            type: resumeFile.type,
            size: resumeFile.size,
            updatedAt: Date.now(),
          });
        }
        const formData = new FormData();
        formData.append("url", activeUrl);
        if (user?.id) formData.append("userId", user.id);
        if (selectedModel) formData.append("model", selectedModel);
        formData.append("mode", "standard");
        if (userContext.trim()) formData.append("context", userContext.trim());
        formData.append("saveResumeProfile", String(saveResumeProfile));
        if (resumeFile) formData.append("resumeFile", resumeFile);
        requestBody = formData;
        requestHeaders = Object.keys(authHeaders).length ? authHeaders : undefined;
      }

      const res = await fetch(`${api}${endpoint}`, {
        method: "POST",
        headers: requestHeaders,
        body: requestBody,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const message = errData.error || "Xenia service communication failed";
        if (res.status === 401 || errData.code === "AUTH_REQUIRED") {
          toast.error(message || "Sign in before using this tool.");
          window.setTimeout(() => {
            window.location.href = "/signin";
          }, 900);
          setIsProcessing(false);
          return;
        }
        if (res.status === 402 || errData.code === "INSUFFICIENT_CREDITS") {
          setBillingPrompt({
            open: true,
            reason: "insufficient_credits",
            toolName: tool?.name,
            creditsRequired: Number(errData.creditsRequired || 0),
            creditsRemaining: Number(errData.creditsRemaining || 0),
          });
          setIsProcessing(false);
          return;
        }
        if (res.status === 403 || errData.code === "PLAN_REQUIRED") {
          setBillingPrompt({
            open: true,
            reason: "plan_required",
            toolName: tool?.name,
            creditsRequired: Number(errData.creditsRequired || 0),
          });
          setIsProcessing(false);
          return;
        }
        const isUrlError = /url|website|domain|http|https|localhost|private|supported/i.test(message);
        if (isUrlError) {
          showUrlErrorToast(message);
          setIsProcessing(false);
          return;
        }
        throw new Error(message);
      }

      const { taskId } = await res.json();

      const newParams = new URLSearchParams(searchParams);
      newParams.set("taskId", taskId);
      setSearchParams(newParams, { replace: true });

      toast.success(`${tool?.name || "Processing"} started`);
    } catch (err: any) {
      toast.error(err.message);
      setIsProcessing(false);
    }
  };

  const downloadPDF = async () => {
    if (!formattedHtml) return;

    if (!session?.access_token) {
      toast.error("Sign in to export PDF reports.");
      window.setTimeout(() => {
        window.location.href = "/signin";
      }, 900);
      return;
    }

    setIsExporting(true);
    const tId = toast.loading(`Generating PDF export...`);
    try {
      const api = import.meta.env.VITE_API_URL || "http://localhost:8080";
      const res = await fetch(`${api}/api/export/pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          html: formattedHtml,
          title: result.data?.brandName || "Xenia Analysis",
          fonts: uniqueFonts
        }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        if (res.status === 401 || errorBody?.code === "AUTH_REQUIRED") {
          toast.error(errorBody?.error || "Sign in to export PDF reports.", { id: tId });
          window.setTimeout(() => {
            window.location.href = "/signin";
          }, 900);
          return;
        }
        if (res.status === 403 || errorBody?.code === "PLAN_REQUIRED") {
          toast.dismiss(tId);
          setBillingPrompt({
            open: true,
            reason: "plan_required",
            toolName: "PDF Export",
          });
          return;
        }
        throw new Error(errorBody?.error || "PDF export failed");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Xenia-Report-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success("PDF saved!", { id: tId });
    } catch (e) {
      console.error("Puppeteer Export Error:", e);
      toast.error(e instanceof Error ? e.message : "Export failed. Try again in a moment.", { id: tId });
    } finally {
      setIsExporting(false);
    }
  };

  const downloadPresentonPptx = async () => {
    const downloadUrl = result?.data?.presenton?.downloadUrl;
    if (!downloadUrl) {
      toast.error("PPTX export is not available for this result yet.");
      return;
    }

    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `${(result.title || "iLoveURL-Presentation").replace(/[^\w.-]+/g, "-")}.pptx`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success("PPTX download started");
  };

  const downloadMarkdown = () => {
    downloadTextFile(markdownPreview, `Xenia-Report-${Date.now()}.md`, "text/markdown;charset=utf-8");
  };

  const downloadJson = () => {
    downloadTextFile(jsonPreview, `Xenia-Report-${Date.now()}.json`, "application/json;charset=utf-8");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const isQuickResult = ["url-shortener", "qr-code", "meta-tags", "link-preview"].includes(tool.id);

  const presentonFieldText = (value: any): string => {
    if (!value) return "";
    if (typeof value === "string" || typeof value === "number") return String(value).trim();
    if (Array.isArray(value)) {
      return value
        .map((item) => presentonFieldText(item))
        .filter(Boolean)
        .join(" · ");
    }
    if (typeof value === "object") {
      if (value.title || value.name || value.label || value.description) {
        return [value.title, value.name, value.label, value.description]
          .map((item) => presentonFieldText(item))
          .filter(Boolean)
          .join(" · ");
      }
      return "";
    }
    return "";
  };

  const presentonImageUrl = (content: any): string | null => {
    const candidates = [
      content?.image,
      content?.media,
      content?.mapImage,
      content?.backgroundImage,
      content?.heroImage,
    ];
    for (const candidate of candidates) {
      if (typeof candidate === "string" && /^https?:\/\//i.test(candidate)) return candidate;
      if (candidate?.__image_url__ && /^https?:\/\//i.test(candidate.__image_url__)) return candidate.__image_url__;
      if (candidate?.url && /^https?:\/\//i.test(candidate.url)) return candidate.url;
    }
    return null;
  };

  const presentonSlidePoints = (content: any): string[] => {
    const ignored = new Set(["title", "__speaker_note__", "image", "media", "mapImage", "backgroundImage", "heroImage"]);
    const points: string[] = [];

    Object.entries(content || {}).forEach(([key, value]) => {
      if (ignored.has(key)) return;
      if (key.toLowerCase().includes("image")) return;
      if (Array.isArray(value)) {
        value.forEach((item) => {
          const text = presentonFieldText(item);
          if (text) points.push(text);
        });
        return;
      }
      const text = presentonFieldText(value);
      if (text && text !== presentonFieldText(content?.title)) points.push(text);
    });

    return [...new Set(points)]
      .filter((point) => point.length > 3)
      .slice(0, 5);
  };

  const renderPresentonPreview = () => {
    if (tool.id !== "presentation") return null;
    const presenton = result?.data?.presenton;
    const presentonError = result?.data?.presentonError;
    const generatedSlides = Array.isArray(presenton?.slides) ? presenton.slides : [];

    if (!presenton?.downloadUrl) {
      return (
        <div className="mb-8 rounded-[28px] border-2 border-amber-200 bg-amber-50 p-5">
          <p className="text-[10px] font-black uppercase tracking-[2px] text-amber-600/70">presentation preview</p>
          <h3 className="mt-2 text-[24px] font-display lowercase leading-none text-gray-950">pptx preview is not ready</h3>
          <p className="mt-3 text-[13px] font-bold leading-relaxed text-amber-900/70">
            {presentonError || "The slide plan is ready, but the Presenton renderer did not return an editable preview for this run."}
          </p>
        </div>
      );
    }

    return (
      <div className="mb-8 overflow-hidden rounded-[32px] border-2 border-gray-950 bg-white shadow-[0_8px_0_0_#CFCFCF]">
        <div className="flex flex-col gap-4 border-b-2 border-border-color bg-[#F8F9FC] p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[2px] text-primary/40">generated presentation preview</p>
            <h3 className="mt-2 text-[28px] font-display lowercase leading-none text-primary">review the deck before export.</h3>
            <p className="mt-2 text-[13px] font-bold leading-relaxed text-gray-500">
              This preview is built from the Presenton-generated slide data. Use Export PPTX for the actual editable deck.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {presenton.editUrl && (
            <Button type="button" variant="outline" onClick={() => window.open(presenton.editUrl, "_blank", "noopener,noreferrer")} className="h-11 rounded-full gap-2">
              <ExternalLink className="h-4 w-4" />
              Open Editor
            </Button>
            )}
            <Button type="button" onClick={downloadPresentonPptx} className="h-11 rounded-full gap-2">
              <Download className="h-4 w-4" />
              Export PPTX
            </Button>
          </div>
        </div>
        <div className="grid gap-5 bg-gray-100 p-3 md:p-5">
          {generatedSlides.length > 0 ? generatedSlides.map((slide: any, index: number) => {
            const content = slide.content || {};
            const title = presentonFieldText(content.title || content.titleLine1 || content.header) || `Slide ${index + 1}`;
            const imageUrl = presentonImageUrl(content);
            const points = presentonSlidePoints(content);
            const speakerNote = presentonFieldText(content.__speaker_note__ || slide.speaker_note);

            return (
              <div key={slide.id || index} className="aspect-video overflow-hidden rounded-[24px] border-2 border-gray-950 bg-white shadow-[0_6px_0_0_#CFCFCF]">
                <div className="grid h-full grid-cols-[1fr_0.9fr]">
                  <div className="flex flex-col justify-between p-6 md:p-8">
                    <div>
                      <div className="mb-4 flex items-center justify-between gap-4">
                        <p className="text-[10px] font-black uppercase tracking-[2px] text-primary/45">
                          slide {index + 1} · {slide.layout || "presenton"}
                        </p>
                        <span className="rounded-full bg-primary/5 px-3 py-1 text-[9px] font-black uppercase tracking-[1px] text-primary">
                          generated
                        </span>
                      </div>
                      <h4 className="text-[30px] md:text-[42px] font-display lowercase leading-[0.9] text-gray-950">{title}</h4>
                    </div>
                    <div className="mt-5 space-y-2">
                      {points.length > 0 ? points.map((point, pointIndex) => (
                        <div key={pointIndex} className="flex gap-3">
                          <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-black text-white">{pointIndex + 1}</span>
                          <p className="text-[13px] md:text-[15px] font-bold leading-snug text-gray-700 line-clamp-2">{point}</p>
                        </div>
                      )) : (
                        <p className="text-[14px] font-bold text-gray-500">No readable slide body was returned for this layout.</p>
                      )}
                    </div>
                    {speakerNote && (
                      <p className="mt-4 line-clamp-2 text-[11px] font-semibold leading-relaxed text-gray-400">{speakerNote}</p>
                    )}
                  </div>
                  <div className="relative m-4 overflow-hidden rounded-[22px] border-2 border-border-color bg-[#F8F9FC]">
                    {imageUrl ? (
                      <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full flex-col justify-between p-5">
                        <div className="h-24 rounded-3xl bg-primary/10" />
                        <div className="space-y-3">
                          <div className="h-4 rounded-full bg-primary/20" />
                          <div className="h-4 w-2/3 rounded-full bg-gray-200" />
                          <div className="h-4 w-4/5 rounded-full bg-gray-200" />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="h-16 rounded-2xl bg-primary" />
                          <div className="h-16 rounded-2xl bg-sky-200" />
                          <div className="h-16 rounded-2xl bg-emerald-200" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="rounded-[24px] border-2 border-border-color bg-white p-6">
              <p className="text-[13px] font-bold text-gray-500">Presenton generated a PPTX, but did not return slide preview data. Export PPTX is still available.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderQuickResult = () => {
    const data = result?.data || result || {};
    const analytics = linkAnalytics || data.analytics || {};
    const totalInteractions = analytics.totalClicks ?? analytics.totalScans ?? 0;
    const uniqueVisitors = analytics.uniqueVisitors ?? 0;
    const topDevice = analytics.devices?.[0]?.label || "Not enough data";

    if (tool.id === "url-shortener") {
      return (
        <div className="overflow-hidden rounded-[36px] border-2 border-border-color bg-white shadow-[0_8px_0_0_#CFCFCF]">
          <div className="grid gap-0 lg:grid-cols-[1fr_260px]">
            <div className="p-6 md:p-8">
              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl border-2 border-gray-950 bg-primary text-white shadow-[0_5px_0_0_#CFCFCF]">
                  <LinkIcon className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[2px] text-primary/40">short link ready</p>
                  <h2 className="text-[34px] md:text-[44px] font-display lowercase text-gray-950 leading-none">copy, share, done.</h2>
                </div>
              </div>

              <div className="rounded-[30px] border-2 border-border-color bg-[#F8F9FC] p-4 shadow-inner">
                <p className="mb-3 text-[10px] font-black uppercase tracking-[1.5px] text-gray-400">your shortened URL</p>
                <div className="space-y-3">
                  <input readOnly value={data.shortUrl || ""} className="h-16 w-full rounded-full border-2 border-border-color bg-white px-4 text-[13px] font-black text-primary shadow-[0_4px_0_0_#CFCFCF] sm:px-5 sm:text-[15px]" />
                  <Button type="button" onClick={() => copyToClipboard(data.shortUrl || "")} className="h-12 w-full rounded-full text-[12px] sm:w-auto sm:px-8">Copy URL</Button>
                </div>
              </div>

              <div className="mt-5 rounded-[24px] bg-gray-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[1.5px] text-gray-400">destination</p>
                <p className="mt-1 break-all text-[13px] font-bold leading-relaxed text-gray-600">{data.originalUrl}</p>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {[
                  { label: "clicks", value: totalInteractions, icon: BarChart3 },
                  { label: "unique visitors", value: uniqueVisitors ?? "-", icon: User },
                  { label: "top device", value: topDevice, icon: Smartphone },
                ].map((metric) => {
                  const Icon = metric.icon;
                  return (
                    <div key={metric.label} className="rounded-[22px] border border-primary/10 bg-white p-4">
                      <Icon className="mb-3 h-4 w-4 text-primary" />
                      <p className="text-[10px] font-black uppercase tracking-[1.5px] text-gray-400">{metric.label}</p>
                      <p className="mt-1 text-[20px] font-black text-gray-950">{metric.value}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t-2 border-border-color bg-primary/[0.04] p-6 lg:border-l-2 lg:border-t-0">
              <p className="text-[10px] font-black uppercase tracking-[2px] text-primary/40">share checklist</p>
              <div className="mt-5 space-y-3">
                {["Copy the short link", "Paste into campaign or message", "Clicks redirect automatically"].map((item, index) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-[12px] font-black text-white">{index + 1}</div>
                    <p className="text-[12px] font-black text-gray-700">{item}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-[22px] bg-white p-4">
                <p className="text-[10px] font-black uppercase tracking-[1.5px] text-primary/40">analytics</p>
                <p className="mt-2 text-[12px] font-bold leading-relaxed text-gray-500">
                  Clicks are counted when someone opens the short link. Detailed event analytics require the Supabase analytics table.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (tool.id === "qr-code") {
      return (
        <div className="rounded-[36px] border-2 border-border-color bg-white p-6 md:p-8 shadow-[0_8px_0_0_#CFCFCF]">
          <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[2px] text-primary/40">qr code ready</p>
              <h2 className="mt-2 text-[38px] md:text-[52px] font-display lowercase text-gray-950 leading-none">scan and send.</h2>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl border-2 border-gray-950 bg-primary text-white shadow-[0_5px_0_0_#CFCFCF]">
              <QrCode className="h-7 w-7" />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
            <div className="rounded-[34px] border-2 border-gray-950 bg-white p-5 shadow-[0_8px_0_0_#CFCFCF]">
              <div className="rounded-[26px] bg-gray-50 p-5 shadow-inner">
                {data.qrCodeUrl && <img src={data.qrCodeUrl} alt="Generated QR code" className="w-full rounded-[20px] bg-white p-3" />}
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-[30px] bg-[#F8F9FC] p-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[1.5px] text-gray-400">encoded destination</p>
                <p className="mt-2 break-all text-[14px] font-bold leading-relaxed text-gray-700">{data.originalUrl}</p>
                {data.trackingUrl && (
                  <div className="mt-5 rounded-[22px] border border-primary/10 bg-white p-4">
                    <p className="text-[10px] font-black uppercase tracking-[1.5px] text-gray-400">tracked scan link</p>
                    <p className="mt-2 break-all text-[13px] font-black text-primary">{data.trackingUrl}</p>
                  </div>
                )}
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <a href={data.qrCodeUrl} download="iloveurl-qr-code.png" className="block">
                  <Button type="button" className="h-14 w-full rounded-full">Download PNG</Button>
                </a>
                <Button type="button" variant="outline" onClick={() => copyToClipboard(data.qrCodeUrl || "")} className="h-14 rounded-full bg-white">Copy Data URL</Button>
              </div>
              <div className="mt-5 rounded-[22px] border border-primary/10 bg-white p-4">
                <p className="text-[12px] font-bold leading-relaxed text-gray-500">Use this asset on posters, packaging, presentations, events, and mobile handoffs. Scans are tracked through the encoded short link.</p>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "scans", value: totalInteractions, icon: BarChart3 },
                  { label: "unique visitors", value: uniqueVisitors ?? "-", icon: User },
                  { label: "top device", value: topDevice, icon: Smartphone },
                ].map((metric) => {
                  const Icon = metric.icon;
                  return (
                    <div key={metric.label} className="rounded-[20px] bg-white p-4">
                      <Icon className="mb-3 h-4 w-4 text-primary" />
                      <p className="text-[9px] font-black uppercase tracking-[1.5px] text-gray-400">{metric.label}</p>
                      <p className="mt-1 text-[18px] font-black text-gray-950">{metric.value}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (tool.id === "link-preview") {
      const previewTitle = data.previewTitle || data.title || "Untitled preview";
      const previewDescription = data.previewDescription || data.description || "No description found.";
      const previewUrl = data.originalUrl || data.url || url;
      let hostname = data.siteName || "website";
      try {
        hostname = new URL(previewUrl).hostname.replace(/^www\./, "");
      } catch {
        hostname = data.siteName || "website";
      }
      const siteName = data.siteName || hostname;
      const hasImage = Boolean(data.previewImage);
      const platformCards = [
        {
          label: "message app",
          title: "compact card with thumbnail",
          className: "bg-[#F8F9FC]",
        },
        {
          label: "search result",
          title: "title, url, description",
          className: "bg-white",
        },
        {
          label: "micro post",
          title: "small share attachment",
          className: "bg-[#F8F9FC]",
        },
      ];

      return (
        <div className="overflow-hidden rounded-[36px] border-2 border-border-color bg-white shadow-[0_8px_0_0_#CFCFCF]">
          <div className="mb-7 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="p-6 pb-0 md:p-8 md:pb-0">
              <p className="text-[10px] font-black uppercase tracking-[2px] text-primary/40">social preview ready</p>
              <h2 className="mt-2 text-[38px] md:text-[52px] font-display lowercase text-gray-950 leading-none">how it shares.</h2>
            </div>
            <div className="px-6 md:px-8">
              <Button type="button" variant="outline" onClick={() => copyToClipboard(previewUrl)} className="rounded-full bg-white">Copy URL</Button>
            </div>
          </div>

          <div className="grid gap-0 xl:grid-cols-[1.08fr_0.92fr]">
            <div className="p-6 pt-0 md:p-8 md:pt-0">
              <div className="overflow-hidden rounded-[30px] border-2 border-gray-950 bg-white shadow-[0_7px_0_0_#CFCFCF]">
                <div className="flex items-center justify-between border-b-2 border-border-color bg-[#F8F9FC] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[1.5px] text-primary/40">large social feed</p>
                  <div className="flex items-center gap-2">
                    {data.favicon && <img src={data.favicon} alt="" className="h-6 w-6 rounded-lg border border-gray-100 bg-white" />}
                    <span className="text-[10px] font-black uppercase tracking-[1px] text-gray-400">{siteName}</span>
                  </div>
                </div>
                {hasImage ? (
                  <img src={data.previewImage} alt="" className="aspect-[1.91/1] w-full object-cover" />
                ) : (
                  <div className="flex aspect-[1.91/1] w-full items-center justify-center bg-primary/[0.04]">
                    <Globe className="h-12 w-12 text-primary/30" />
                  </div>
                )}
                <div className="bg-[#F8F9FC] p-5">
                  <p className="text-[10px] font-black uppercase tracking-[1.5px] text-gray-400">{hostname}</p>
                  <h3 className="mt-2 line-clamp-2 text-[25px] font-display lowercase leading-none text-gray-950">{previewTitle}</h3>
                  <p className="mt-3 line-clamp-3 text-[14px] font-semibold leading-relaxed text-gray-600">{previewDescription}</p>
                </div>
              </div>

              <div className="mt-5 rounded-[24px] bg-gray-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[1.5px] text-gray-400">source url</p>
                <p className="mt-1 break-all text-[13px] font-bold leading-relaxed text-gray-600">{previewUrl}</p>
              </div>
            </div>

            <div className="border-t-2 border-border-color bg-primary/[0.035] p-6 md:p-8 xl:border-l-2 xl:border-t-0">
              <p className="mb-5 text-[10px] font-black uppercase tracking-[2px] text-primary/40">platform checks</p>
              <div className="grid gap-4">
                {platformCards.map((card, index) => (
                  <div key={card.label} className={`rounded-[26px] border-2 border-border-color p-4 shadow-[0_5px_0_0_#CFCFCF] ${card.className}`}>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[1.4px] text-primary/40">{card.label}</p>
                        <p className="mt-0.5 text-[12px] font-black text-gray-500">{card.title}</p>
                      </div>
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-[12px] font-black text-white">{index + 1}</span>
                    </div>

                    {index === 0 && (
                      <div className="overflow-hidden rounded-[18px] border border-gray-200 bg-white">
                        <div className="flex gap-3 p-3">
                          {hasImage ? (
                            <img src={data.previewImage} alt="" className="h-20 w-24 shrink-0 rounded-xl object-cover" />
                          ) : (
                            <div className="flex h-20 w-24 shrink-0 items-center justify-center rounded-xl bg-primary/[0.06]">
                              <Globe className="h-6 w-6 text-primary/30" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-[1px] text-gray-400">{hostname}</p>
                            <h4 className="mt-1 line-clamp-2 text-[14px] font-black leading-tight text-gray-900">{previewTitle}</h4>
                            <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-relaxed text-gray-500">{previewDescription}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {index === 1 && (
                      <div className="rounded-[18px] bg-white p-4">
                        <p className="break-all text-[12px] font-semibold text-emerald-700">{hostname}</p>
                        <h4 className="mt-1 line-clamp-2 text-[18px] font-bold leading-tight text-primary">{previewTitle}</h4>
                        <p className="mt-2 line-clamp-3 text-[13px] font-semibold leading-relaxed text-gray-600">{previewDescription}</p>
                      </div>
                    )}

                    {index === 2 && (
                      <div className="flex items-center gap-3 rounded-[18px] bg-white p-3">
                        {data.favicon ? (
                          <img src={data.favicon} alt="" className="h-11 w-11 rounded-2xl border border-gray-100 bg-white" />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white">
                            <Globe className="h-5 w-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="line-clamp-1 text-[14px] font-black text-gray-900">{previewTitle}</h4>
                          <p className="mt-1 line-clamp-1 text-[11px] font-bold text-gray-400">{hostname}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Title", value: previewTitle ? "Detected" : "Missing" },
                  { label: "Description", value: data.previewDescription || data.description ? "Detected" : "Missing" },
                  { label: "Image", value: hasImage ? "Detected" : "Missing" },
                  { label: "Favicon", value: data.favicon ? "Detected" : "Missing" },
                ].map((item) => (
                  <div key={item.label} className="rounded-[18px] bg-white p-3">
                    <p className="text-[10px] font-black uppercase tracking-[1.5px] text-gray-400">{item.label}</p>
                    <p className={`mt-1 text-[13px] font-black ${item.value === "Detected" ? "text-emerald-600" : "text-amber-600"}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (tool.id === "meta-tags") {
      const tags = data.metaTags || [];
      return (
        <div className="rounded-[36px] border-2 border-border-color bg-white p-6 shadow-[0_8px_0_0_#CFCFCF]">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[2px] text-primary/40">metadata extracted</p>
              <h2 className="mt-2 text-[36px] font-display lowercase leading-none text-gray-950">copy-ready tags.</h2>
            </div>
            {data.favicon && <img src={data.favicon} alt="" className="h-12 w-12 rounded-2xl border border-gray-100" />}
          </div>
          <div className="grid gap-3">
            {tags.map((tag: any, index: number) => {
              const key = tag.name || tag.property;
              const markup = tag.name
                ? `<meta name="${tag.name}" content="${tag.content}">`
                : `<meta property="${tag.property}" content="${tag.content}">`;
              return (
                <div key={`${key}-${index}`} className="rounded-[20px] border border-gray-100 bg-gray-50 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-[11px] font-black uppercase tracking-[1px] text-primary">{key}</p>
                    <button type="button" onClick={() => copyToClipboard(markup)} className="text-[10px] font-black uppercase tracking-[1px] text-gray-400 hover:text-primary">copy</button>
                  </div>
                  <p className="break-words text-[13px] font-semibold leading-relaxed text-gray-600">{tag.content}</p>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return null;
  };

  if (!tool) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] pt-32 pb-20 px-5 flex flex-col items-center justify-center">
        <h1 className="text-4xl font-display text-primary mb-4">Tool Not Found</h1>
        <p className="text-gray-500 mb-8">The tool you're looking for doesn't exist or is still in development.</p>
        <Link to="/">
          <Button>Back to Home</Button>
        </Link>
      </div>
    );
  }

  const currentPlan = normalizePlanKey(creditSummary?.plan_key);
  const recommendedPlan = billingPrompt.reason === "plan_required"
    ? "starter"
    : currentPlan === "free"
      ? "starter"
      : nextPlanKey(currentPlan);
  const currentPlanLabel = PLAN_LABELS[currentPlan];
  const recommendedPlanLabel = PLAN_LABELS[recommendedPlan];
  const shouldRecommendTopUp = billingPrompt.reason === "insufficient_credits" && currentPlan === "pro-plus";
  const primaryBillingHref = shouldRecommendTopUp ? "/dashboard/billing" : `/payment?plan=${recommendedPlan}&billing=monthly`;
  const primaryBillingLabel = shouldRecommendTopUp ? "Buy Extra Credits" : `Upgrade to ${recommendedPlanLabel}`;
  const secondaryBillingHref = shouldRecommendTopUp ? "/pricing" : "/dashboard/billing";
  const secondaryBillingLabel = shouldRecommendTopUp ? "Compare Plans" : "Add Credits";
  const billingTitle = billingPrompt.reason === "plan_required"
    ? "upgrade your plan."
    : currentPlan === "free"
      ? "unlock more credits."
      : currentPlan === "pro-plus"
        ? "add extra credits."
        : "move up a plan.";
  const billingEyebrow = billingPrompt.reason === "plan_required" ? "paid feature" : "credit limit";
  const billingDescription = billingPrompt.reason === "plan_required"
    ? `${billingPrompt.toolName || "This feature"} is available on Starter, Pro, and Pro+ plans. Upgrade your plan to unlock export and premium workflow features.`
    : currentPlan === "free"
      ? `${billingPrompt.toolName || "This tool"} needs ${billingPrompt.creditsRequired || "more"} credits, and your Free balance has ${billingPrompt.creditsRemaining ?? 0}. Upgrading gives you a larger monthly credit allowance and paid workflow access.`
      : currentPlan === "pro-plus"
        ? `${billingPrompt.toolName || "This tool"} needs ${billingPrompt.creditsRequired || "more"} credits, and your current balance has ${billingPrompt.creditsRemaining ?? 0}. Since you are already on Pro+, the best next step is adding extra credits.`
        : `${billingPrompt.toolName || "This tool"} needs ${billingPrompt.creditsRequired || "more"} credits, and your current balance has ${billingPrompt.creditsRemaining ?? 0}. Upgrading to ${recommendedPlanLabel} gives you a higher monthly allowance.`;
  const billingBenefits = billingPrompt.reason === "plan_required"
    ? ["Unlock PDF export", "Keep polished outputs in history", "Use paid workflow features"]
    : currentPlan === "free"
      ? ["More monthly credits", "Access paid URL workflows", "Export completed reports"]
      : currentPlan === "pro-plus"
        ? ["Add credits without changing plans", "Continue high-volume workflows", "Use credits after monthly allowance"]
        : [`Upgrade from ${currentPlanLabel} to ${recommendedPlanLabel}`, "Higher monthly credit allowance", "More room for premium workflows"];

  const renderMobileReadOnlyPreview = () => (
    <div className="-mx-1 bg-transparent px-0 py-1 md:hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        .mobile-readonly-preview, .mobile-readonly-preview * {
          max-width: 100% !important;
          color: #111827 !important;
          font-family: Arial, Helvetica, sans-serif !important;
          line-height: 1.7 !important;
          overflow-wrap: anywhere !important;
          word-break: normal !important;
        }
        .mobile-readonly-preview h1 {
          margin: 0 0 18px !important;
          font-size: 24px !important;
          font-weight: 800 !important;
          line-height: 1.15 !important;
          text-align: left !important;
        }
        .mobile-readonly-preview h2 {
          margin: 26px 0 12px !important;
          font-size: 20px !important;
          font-weight: 800 !important;
          line-height: 1.25 !important;
          text-align: left !important;
        }
        .mobile-readonly-preview h3 {
          margin: 20px 0 10px !important;
          font-size: 16px !important;
          font-weight: 800 !important;
          text-align: left !important;
        }
        .mobile-readonly-preview p {
          margin: 0 0 14px !important;
          font-size: 14px !important;
          font-weight: 400 !important;
          text-align: justify !important;
        }
        .mobile-readonly-preview ul,
        .mobile-readonly-preview ol {
          margin: 0 0 16px !important;
          padding-left: 22px !important;
          text-align: left !important;
        }
        .mobile-readonly-preview li {
          display: list-item !important;
          margin-bottom: 8px !important;
          font-size: 14px !important;
          font-weight: 400 !important;
          text-align: justify !important;
        }
        .mobile-readonly-preview strong,
        .mobile-readonly-preview b {
          font-weight: 700 !important;
        }
        .mobile-readonly-preview table {
          display: block !important;
          width: 100% !important;
          overflow-x: auto !important;
          border-collapse: collapse !important;
          margin: 16px 0 !important;
        }
        .mobile-readonly-preview th,
        .mobile-readonly-preview td {
          border: 1px solid #E5E7EB !important;
          padding: 8px !important;
          font-size: 12px !important;
          text-align: left !important;
        }
      ` }} />
      <div
        className="mobile-readonly-preview text-left"
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(formattedHtml || marked.parse(result?.summary || "No readable preview is available for this result yet.") as string),
        }}
      />
    </div>
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F8F9FC] px-4 pb-20 pt-24 sm:px-5 md:px-10">
      <Dialog
        open={billingPrompt.open}
        onOpenChange={(open) => setBillingPrompt((previous) => ({ ...previous, open }))}
      >
        <DialogContent className="max-w-[520px] overflow-hidden rounded-[34px] border-2 border-gray-950 bg-white p-0 shadow-[0_12px_0_0_#CFCFCF]">
          <div className="border-b-2 border-border-color bg-primary/[0.04] px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-gray-950 bg-primary text-white shadow-[0_5px_0_0_#CFCFCF]">
                {billingPrompt.reason === "plan_required" ? <Crown className="h-6 w-6" /> : <ZapIcon className="h-6 w-6" />}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[2px] text-primary/50">{billingEyebrow}</p>
                <DialogTitle className="mt-1 font-display text-[32px] lowercase leading-none text-gray-950">
                  {billingTitle}
                </DialogTitle>
              </div>
            </div>
          </div>

          <div className="px-6 py-6">
            <DialogHeader className="text-left">
              <DialogDescription className="text-[15px] font-semibold leading-relaxed text-gray-600">
                {billingDescription}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5 grid gap-3">
              {billingBenefits.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border-2 border-border-color bg-[#F8F9FC] p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
                    <Check className="h-4 w-4" />
                  </div>
                  <p className="text-[13px] font-black text-gray-700">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="border-t-2 border-border-color bg-[#F8F9FC] px-6 py-5 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-full bg-white px-5 text-[12px] font-black uppercase tracking-[1px]"
              onClick={() => setBillingPrompt((previous) => ({ ...previous, open: false }))}
            >
              Not now
            </Button>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link to={secondaryBillingHref}>
                <Button type="button" variant="outline" className="h-12 w-full rounded-full bg-white px-5 text-[12px] font-black uppercase tracking-[1px] sm:w-auto">
                  {secondaryBillingLabel}
                </Button>
              </Link>
              <Link to={primaryBillingHref}>
                <Button type="button" className="h-12 w-full rounded-full px-5 text-[12px] font-black uppercase tracking-[1px] sm:w-auto">
                  {primaryBillingLabel}
                </Button>
              </Link>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.4))] pointer-events-none -z-10"></div>

      <div className="max-w-[1440px] mx-auto relative z-10">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-[12px] font-black uppercase tracking-[2px] text-primary transition-all hover:opacity-70 md:mb-10">
          <ArrowLeft className="w-4 h-4" />
          EXIT STUDIO
        </Link>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-10">
          {/* Input Panel */}
          <div className="space-y-5 lg:sticky lg:top-24 lg:col-span-4 lg:space-y-8">
            <div className="space-y-3 md:space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-[36px] lowercase leading-[0.9] text-primary sm:text-[42px] md:text-[56px]">{tool.name}</h1>
                {isUnreleasedTool && (
                  <span className="rounded-full bg-gray-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-[1px] text-gray-400">
                    coming soon
                  </span>
                )}
              </div>
              <p className="max-w-sm text-[15px] font-medium leading-relaxed text-gray-500 md:text-[16px]">{tool.description}</p>
            </div>

            <Card className="rounded-[28px] border-2 border-border-color bg-white p-5 shadow-[0_6px_0_0_#CFCFCF] md:rounded-[32px] md:p-8 md:shadow-[0_8px_0_0_#CFCFCF]">
              <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
                <div className="space-y-5 md:space-y-6">
                  <div className="space-y-3">
                    <label className="text-[11px] font-extrabold text-nav-text uppercase tracking-[2px] ml-2">
                      {tool.id === "cross-article" ? "article links" : "target link"}
                    </label>
                    {tool.id === "cross-article" ? (
                      <div className="space-y-3">
                        {comparisonUrls.map((item, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 border-border-color bg-gray-50 text-[12px] font-black text-primary shadow-[0_3px_0_0_#CFCFCF] sm:h-12 sm:w-12">
                              {index + 1}
                            </div>
                            <input
                              type="url"
                              value={item}
                              onChange={(e) => {
                                const nextUrls = [...comparisonUrls];
                                nextUrls[index] = e.target.value;
                                setComparisonUrls(nextUrls);
                              }}
                              placeholder={index < 2 ? `Required source ${index + 1}` : `Optional source ${index + 1}`}
                              className="h-12 min-w-0 flex-1 rounded-2xl border-2 border-border-color bg-white px-3 text-[13px] font-bold shadow-[0_3px_0_0_#CFCFCF] transition-all focus:border-primary focus:outline-none sm:px-4"
                              required={index < 2}
                            />
                            {comparisonUrls.length > 2 && (
                              <button
                                type="button"
                                onClick={() => setComparisonUrls(comparisonUrls.filter((_, itemIndex) => itemIndex !== index))}
                                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                                aria-label={`Remove source ${index + 1}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        {comparisonUrls.length < 4 && (
                          <button
                            type="button"
                            onClick={() => setComparisonUrls([...comparisonUrls, ""])}
                            className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/20 bg-primary/[0.03] text-[11px] font-black uppercase tracking-[1px] text-primary transition hover:border-primary/40 hover:bg-primary/[0.06]"
                          >
                            <Plus className="h-4 w-4" />
                            Add another source
                          </button>
                        )}
                      </div>
                    ) : (
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder={tool.placeholder}
                        className="h-14 w-full rounded-full border-2 border-border-color bg-white px-5 text-[15px] font-bold shadow-[0_4px_0_0_#CFCFCF] transition-all focus:border-primary focus:outline-none sm:px-6"
                        required
                      />
                    )}
                    {tool.id === "cross-article" && (
                      <p className="ml-2 text-[11px] font-bold leading-relaxed text-gray-400">Minimum 2 sources, maximum 4. Use articles covering the same topic for the best comparison.</p>
                    )}
                    {tool.id === "podcast-script" && (
                      <div className="ml-2 rounded-[18px] border border-primary/10 bg-primary/[0.04] p-3">
                        <p className="text-[10px] font-black uppercase tracking-[1.5px] text-primary/50">supported video links</p>
                        <p className="mt-1 text-[12px] font-bold leading-relaxed text-gray-500">
                          Use a public YouTube, Facebook, Instagram, or TikTok URL. Other websites are blocked for this tool because transcript extraction depends on SocialKit support.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="rounded-[24px] border border-primary/10 bg-gray-50/80 p-4 space-y-3">
                    <div className="flex gap-3">
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[2px] text-primary/40">what it does</p>
                        <p className="mt-1 text-[13px] font-bold leading-relaxed text-gray-600">{tool.purpose}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                        <Check className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[2px] text-primary/40">what you get</p>
                        <p className="mt-1 text-[13px] font-bold leading-relaxed text-gray-600">{tool.output}</p>
                      </div>
                    </div>
                  </div>

                  {tool.id === "qr-code" && (
                    <div className="space-y-4 rounded-[26px] border-2 border-border-color bg-white p-4 shadow-[0_4px_0_0_#CFCFCF]">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Palette className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[11px] font-extrabold uppercase tracking-[2px] text-nav-text">qr style</p>
                          <p className="mt-1 text-[12px] font-bold leading-relaxed text-gray-500">Customize color, background, and print size before generating.</p>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="rounded-[20px] bg-gray-50 p-3">
                          <span className="text-[10px] font-black uppercase tracking-[1.5px] text-gray-400">Foreground</span>
                          <div className="mt-2 flex items-center gap-3">
                            <input
                              type="color"
                              value={qrOptions.foreground}
                              onChange={(e) => setQrOptions((prev) => ({ ...prev, foreground: e.target.value }))}
                              className="h-10 w-12 rounded-xl border-0 bg-transparent p-0"
                            />
                            <span className="text-[12px] font-black text-gray-700">{qrOptions.foreground}</span>
                          </div>
                        </label>

                        <label className="rounded-[20px] bg-gray-50 p-3">
                          <span className="text-[10px] font-black uppercase tracking-[1.5px] text-gray-400">Background</span>
                          <div className="mt-2 flex items-center gap-3">
                            <input
                              type="color"
                              value={qrOptions.background}
                              onChange={(e) => setQrOptions((prev) => ({ ...prev, background: e.target.value }))}
                              className="h-10 w-12 rounded-xl border-0 bg-transparent p-0"
                            />
                            <span className="text-[12px] font-black text-gray-700">{qrOptions.background}</span>
                          </div>
                        </label>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="rounded-[20px] bg-gray-50 p-3">
                          <span className="text-[10px] font-black uppercase tracking-[1.5px] text-gray-400">Size</span>
                          <select
                            value={qrOptions.size}
                            onChange={(e) => setQrOptions((prev) => ({ ...prev, size: Number(e.target.value) }))}
                            className="mt-2 h-11 w-full rounded-full border-2 border-border-color bg-white px-4 text-[12px] font-black text-gray-700 outline-none"
                          >
                            <option value={360}>Small PNG</option>
                            <option value={500}>Standard PNG</option>
                            <option value={800}>Large print PNG</option>
                          </select>
                        </label>

                        <label className="rounded-[20px] bg-gray-50 p-3">
                          <span className="text-[10px] font-black uppercase tracking-[1.5px] text-gray-400">Margin</span>
                          <input
                            type="range"
                            min={0}
                            max={6}
                            value={qrOptions.margin}
                            onChange={(e) => setQrOptions((prev) => ({ ...prev, margin: Number(e.target.value) }))}
                            className="mt-4 w-full accent-primary"
                          />
                          <span className="mt-1 block text-[11px] font-black text-gray-500">{qrOptions.margin} modules</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {(tool.id === "resume" || tool.id === "cover-letter" || tool.id === "interview-prep") && (
                    <div className="space-y-4 rounded-[26px] border-2 border-border-color bg-white p-4 shadow-[0_4px_0_0_#CFCFCF]">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-extrabold text-nav-text uppercase tracking-[2px]">resume profile</p>
                          <p className="mt-1 text-[12px] font-bold leading-relaxed text-gray-500">Upload PDF/DOCX, paste resume text, or reuse your saved file.</p>
                        </div>
                        {(savedResumeProfile || savedResumeFileMeta) && (
                          <button
                            type="button"
                            onClick={async () => {
                              if (savedResumeProfile) setUserContext(savedResumeProfile);
                              const savedFile = await loadSavedResumeFileFromDevice(resumeFileStorageKey).catch(() => null);
                              if (savedFile) {
                                setResumeFile(savedFile.file);
                                setSavedResumeFileMeta(savedFile.meta);
                              }
                            }}
                            className="shrink-0 rounded-full bg-primary/5 px-3 py-2 text-[10px] font-black uppercase tracking-[1px] text-primary hover:bg-primary/10"
                          >
                            Use Saved
                          </button>
                        )}
                      </div>

                      <label className="flex cursor-pointer flex-col items-center justify-center rounded-[22px] border-2 border-dashed border-primary/20 bg-primary/[0.03] p-5 text-center transition hover:border-primary/40 hover:bg-primary/[0.05]">
                        <FileIcon className="mb-2 h-7 w-7 text-primary" />
                        <span className="text-[12px] font-black uppercase tracking-[1px] text-primary">
                          {resumeFile ? resumeFile.name : "Upload PDF or DOCX"}
                        </span>
                        <span className="mt-1 text-[11px] font-bold text-gray-400">PDF, DOCX, TXT, or MD up to 8MB</span>
                        <input
                          type="file"
                          accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
                          className="hidden"
                          onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
                        />
                      </label>

                      {savedResumeFileMeta && !resumeFile && (
                        <p className="rounded-[16px] bg-gray-50 p-3 text-[11px] font-bold leading-relaxed text-gray-500">
                          Saved file: <span className="text-primary">{savedResumeFileMeta.name}</span>. Click Use Saved to attach it.
                        </p>
                      )}

                      {resumeFile && (
                        <button
                          type="button"
                          onClick={() => setResumeFile(null)}
                          className="text-[10px] font-black uppercase tracking-[1px] text-gray-400 hover:text-primary"
                        >
                          Remove uploaded file
                        </button>
                      )}

                      <textarea
                        value={userContext}
                        onChange={(e) => setUserContext(e.target.value)}
                        placeholder="Or paste your current resume text here..."
                        className="w-full h-44 p-6 text-[15px] border-2 border-border-color rounded-[24px] focus:outline-none focus:border-primary resize-none bg-white transition-all shadow-[0_4px_0_0_#CFCFCF] font-bold"
                      />

                      <label className="flex items-start gap-3 rounded-[18px] bg-gray-50 p-3">
                        <input
                          type="checkbox"
                          checked={saveResumeProfile}
                          onChange={(e) => setSaveResumeProfile(e.target.checked)}
                          className="mt-1 h-4 w-4 accent-primary"
                        />
                        <span className="text-[12px] font-bold leading-relaxed text-gray-600">
                          Save pasted text and uploaded file on this device for future job matches.
                        </span>
                      </label>
                    </div>
                  )}

                  {tool.id === "presentation" && (
                    <div className="space-y-3 px-2">
                      <label className="text-[11px] font-extrabold text-nav-text uppercase tracking-[2px]">presentation theme</label>
                      <div className="grid gap-2">
                        {presentationThemes.map((theme) => {
                          const active = selectedPresentationTheme === theme.id;
                          return (
                            <button
                              key={theme.id}
                              type="button"
                              aria-pressed={active}
                              onClick={() => setSelectedPresentationTheme(theme.id)}
                              className={`rounded-[20px] border-2 p-3 text-left transition-all ${
                                active
                                  ? "border-primary bg-primary/[0.04] shadow-[0_4px_0_0_var(--brand-primary-shadow)]"
                                  : "border-border-color bg-white hover:border-primary/30 hover:bg-primary/[0.02]"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className={`text-[13px] font-black uppercase tracking-[1px] ${active ? "text-primary" : "text-gray-900"}`}>{theme.label}</p>
                                  <p className="mt-1 text-[11px] font-bold leading-relaxed text-gray-500">{theme.description}</p>
                                </div>
                                <div className="grid h-12 w-16 shrink-0 grid-cols-3 gap-1 rounded-xl border border-gray-100 bg-white p-1 shadow-inner">
                                  {theme.palette.map((color) => (
                                    <span key={color} className="rounded-lg" style={{ backgroundColor: color }} />
                                  ))}
                                </div>
                              </div>
                              <div className="mt-3 overflow-hidden rounded-xl border border-gray-100 bg-white p-2">
                                <div className="mb-2 h-2 w-10 rounded-full" style={{ backgroundColor: theme.palette[0] }} />
                                <div className="space-y-1.5">
                                  <div className="h-1.5 rounded-full bg-gray-200" />
                                  <div className="h-1.5 w-3/4 rounded-full bg-gray-100" />
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    disabled={isProcessing || isUnreleasedTool}
                    className="w-full h-16 rounded-full text-[18px] font-display lowercase shadow-[0_6px_0_0_var(--brand-primary-shadow)] hover:translate-y-[2px] hover:shadow-[0_4px_0_0_var(--brand-primary-shadow)] active:translate-y-[6px] active:shadow-none transition-all"
                  >
                    {isProcessing ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : isUnreleasedTool ? "coming soon" : "process source"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Output Workbench */}
          <div className={`min-w-0 lg:col-span-8 ${result && !isProcessing && ["url-shortener", "qr-code", "link-preview"].includes(tool.id) ? "lg:pt-[148px]" : ""}`}>
            {isLoadingSavedResult ? (
              <div className="h-full min-h-[420px] overflow-hidden rounded-[30px] border-2 border-primary/10 bg-white shadow-[0_20px_60px_-30px_rgba(0,0,0,0.18)] md:min-h-[560px] md:rounded-[40px] md:shadow-[0_32px_90px_-30px_rgba(0,0,0,0.18)]">
                <div className="flex min-h-[420px] flex-col justify-center p-6 md:min-h-[560px] md:p-12">
                  <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-3xl border-2 border-gray-950 bg-white text-primary shadow-[0_6px_0_0_#CFCFCF]">
                    <Loader2 className="h-7 w-7 animate-spin" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[2px] text-primary/40">saved result</p>
                  <h3 className="mt-3 max-w-xl text-[34px] md:text-[52px] font-display lowercase text-gray-950 leading-[0.92]">
                    opening your saved output.
                  </h3>
                  <p className="mt-5 max-w-lg text-[15px] font-semibold leading-relaxed text-gray-500">
                    Pulling the completed result from your history. No credits are being used and the source is not being processed again.
                  </p>
                  <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    {["history", "saved task", "no reprocess"].map((item) => (
                      <div key={item} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                        <div className="mb-2 h-2 w-10 rounded-full bg-primary/20" />
                        <p className="text-[12px] font-black uppercase tracking-[1px] text-primary">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : !result && !isProcessing ? (
              <div className="hidden h-full min-h-[560px] overflow-hidden rounded-[40px] border-2 border-primary/10 bg-white shadow-[0_32px_90px_-30px_rgba(0,0,0,0.18)] md:block">
                <div className="grid min-h-[420px] md:min-h-[560px] lg:grid-cols-[1fr_260px]">
                  <div className="flex flex-col justify-center p-6 md:p-12">
                    <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                      <Globe className="h-8 w-8" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[2px] text-primary/40">ready when you are</p>
                    <h3 className="mt-3 max-w-xl text-[34px] md:text-[52px] font-display lowercase text-gray-950 leading-[0.92]">
                      paste a URL and xenia will build the output here.
                    </h3>
                    <p className="mt-5 max-w-lg text-[15px] font-semibold leading-relaxed text-gray-500">
                      Start with a public page. Once processing begins, this space turns into a live progress view, then your finished report appears automatically.
                    </p>

                    <div className="mt-8 grid gap-3 sm:grid-cols-3">
                      {[
                        { label: "input", value: "source URL" },
                        { label: "process", value: "standard flow" },
                        { label: "output", value: tool.output.split(",")[0] },
                      ].map((item) => (
                        <div key={item.label} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                          <p className="text-[10px] font-black uppercase tracking-[2px] text-gray-400">{item.label}</p>
                          <p className="mt-1 text-[13px] font-black text-primary">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-100 bg-gray-50 p-6 lg:border-l lg:border-t-0">
                    <p className="mb-5 text-[10px] font-black uppercase tracking-[2px] text-primary/40">result preview</p>
                    <div className="space-y-4">
                      <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
                        <div className="mb-4 h-3 w-24 rounded-full bg-primary/15" />
                        <div className="space-y-2">
                          <div className="h-2.5 rounded-full bg-gray-100" />
                          <div className="h-2.5 w-4/5 rounded-full bg-gray-100" />
                          <div className="h-2.5 w-2/3 rounded-full bg-gray-100" />
                        </div>
                      </div>
                      <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="h-14 rounded-2xl bg-primary/10" />
                          <div className="h-14 rounded-2xl bg-emerald-100" />
                          <div className="h-14 rounded-2xl bg-amber-100" />
                        </div>
                      </div>
                      <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
                        <div className="mb-3 flex items-center gap-2">
                          <div className="h-8 w-8 rounded-xl bg-primary/10" />
                          <div className="h-3 w-28 rounded-full bg-gray-100" />
                        </div>
                        <div className="space-y-2">
                          <div className="h-2.5 rounded-full bg-gray-100" />
                          <div className="h-2.5 w-3/5 rounded-full bg-gray-100" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : isProcessing ? (
              <div className="relative h-full min-h-[420px] overflow-hidden rounded-[30px] border-2 border-primary/10 bg-white shadow-[0_20px_60px_-30px_rgba(0,0,0,0.25)] md:min-h-[560px] md:rounded-[40px] md:shadow-[0_32px_90px_-30px_rgba(0,0,0,0.25)]">
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gray-100">
                  <div
                    className="h-full bg-primary transition-all duration-1000 ease-in-out"
                    style={{ width: `${((loadingStep + 1) / loadingMessages.length) * 100}%` }}
                  />
                </div>

                <div className="min-h-[420px] md:min-h-[560px]">
                  <div className="flex min-h-[420px] flex-col justify-center p-6 md:min-h-[560px] md:p-12">
                    <div className="mb-8 flex items-center gap-4">
                      <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-primary text-white shadow-[0_8px_0_0_var(--brand-primary-shadow)]">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[2px] text-primary/40">processing</p>
                        <h3 className="mt-1 text-[30px] md:text-[42px] font-display lowercase text-primary leading-[0.9]">
                          {tool.name}
                        </h3>
                      </div>
                    </div>

                    <div className="mb-8 max-w-xl">
                      <p className="text-[12px] font-black uppercase tracking-[2px] text-gray-400">current step</p>
                      <h4 className="mt-2 text-[24px] md:text-[34px] font-display lowercase text-gray-950 leading-tight">
                        {loadingMessages[loadingStep]}
                      </h4>
                      <p className="mt-3 text-[15px] font-semibold leading-relaxed text-gray-500">
                        {loadingDetails[loadingStep]}
                      </p>
                    </div>

                    <div className="grid gap-3">
                      {loadingMessages.map((message, i) => {
                        const done = i < loadingStep;
                        const active = i === loadingStep;
                        return (
                          <div key={message} className={`flex items-center gap-3 rounded-2xl border p-3 transition-all ${
                            active ? "border-primary/20 bg-primary/[0.04]" : done ? "border-emerald-100 bg-emerald-50/70" : "border-gray-100 bg-gray-50/80"
                          }`}>
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                              active ? "bg-primary text-white" : done ? "bg-emerald-500 text-white" : "bg-white text-gray-300"
                            }`}>
                              {done ? <Check className="h-4 w-4" /> : active ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="h-2 w-2 rounded-full bg-current" />}
                            </div>
                            <div className="min-w-0">
                              <p className={`text-[13px] font-black ${active ? "text-primary" : done ? "text-emerald-700" : "text-gray-400"}`}>{message}</p>
                              {active && <p className="mt-0.5 text-[11px] font-semibold text-gray-500">{loadingDetails[i]}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
                {["url-shortener", "qr-code", "link-preview"].includes(tool.id) ? (
                  renderQuickResult()
                ) : (
                <Card className="min-h-[520px] overflow-hidden rounded-[30px] border-2 border-border-color bg-white p-5 shadow-[0_24px_80px_-30px_rgba(0,0,0,0.18)] md:min-h-[900px] md:rounded-[40px] md:p-10 md:shadow-[0_48px_128px_-20px_rgba(0,0,0,0.15)]">

                  {/* Result Header */}
                  <div className="mb-8 flex flex-col justify-between gap-5 border-b-2 border-gray-50 pb-6 md:flex-row md:items-end md:gap-6">
                    <h3 className="font-display text-[28px] lowercase leading-[0.9] tracking-tight text-gray-900 md:text-[42px] md:leading-[0.85]">
                      {result.title}
                    </h3>
                    <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:shrink-0 sm:flex-wrap sm:items-center sm:gap-3">
                      <Button
                        variant="ghost"
                        className="h-10 rounded-xl font-black gap-2 text-gray-400 hover:text-primary transition-all bg-gray-50 px-3 text-[11px]"
                        onClick={() => copyToClipboard(activePreviewMode === "json" ? jsonPreview : markdownPreview)}
                      >
                        <Copy className="w-4 h-4" /> COPY {activePreviewMode === "json" ? "JSON" : supportsPreviewFormats ? "MD" : "RAW"}
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            disabled={isExporting}
                            className="h-10 px-4 rounded-xl font-black gap-2 shadow-[0_4px_0_0_var(--brand-primary-shadow)] bg-primary text-white flex items-center justify-center hover:translate-y-[1px] hover:shadow-[0_3px_0_0_var(--brand-primary-shadow)] active:translate-y-[4px] active:shadow-none transition-all text-[11px] uppercase tracking-[1px] cursor-pointer outline-none border-0 disabled:opacity-70"
                          >
                            {isExporting ? <><Loader2 className="w-4 h-4 animate-spin" /> GENERATING...</> : <><Download className="w-4 h-4" /> EXPORT <ChevronDown className="w-3 h-3 opacity-50" /></>}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl border-2 z-[110] bg-white shadow-2xl">
                          <DropdownMenuItem className="h-12 rounded-lg gap-3 cursor-pointer focus:bg-primary/5 group" onClick={(e) => { e.preventDefault(); downloadPDF(); }}>
                            <div className="h-8 w-8 flex items-center justify-center bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
                              <FileText className="w-4 h-4 text-red-500" />
                            </div>
                            <span className="font-bold text-[11px] uppercase tracking-[1px]">Export PDF</span>
                          </DropdownMenuItem>
                          {tool.id === "presentation" && result.data?.presenton?.downloadUrl && (
                            <DropdownMenuItem className="h-12 rounded-lg gap-3 cursor-pointer focus:bg-primary/5 group" onClick={(e) => { e.preventDefault(); downloadPresentonPptx(); }}>
                              <div className="h-8 w-8 flex items-center justify-center bg-primary/5 rounded-lg group-hover:bg-primary/10 transition-colors">
                                <LayoutTemplate className="w-4 h-4 text-primary" />
                              </div>
                              <span className="font-bold text-[11px] uppercase tracking-[1px]">Export PPTX</span>
                            </DropdownMenuItem>
                          )}
                          {supportsPreviewFormats && (
                            <>
                              <DropdownMenuItem className="h-12 rounded-lg gap-3 cursor-pointer focus:bg-primary/5 group" onClick={(e) => { e.preventDefault(); downloadMarkdown(); }}>
                                <div className="h-8 w-8 flex items-center justify-center bg-primary/5 rounded-lg group-hover:bg-primary/10 transition-colors">
                                  <Code2 className="w-4 h-4 text-primary" />
                                </div>
                                <span className="font-bold text-[11px] uppercase tracking-[1px]">Export Markdown</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="h-12 rounded-lg gap-3 cursor-pointer focus:bg-primary/5 group" onClick={(e) => { e.preventDefault(); downloadJson(); }}>
                                <div className="h-8 w-8 flex items-center justify-center bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                                  <Braces className="w-4 h-4 text-emerald-600" />
                                </div>
                                <span className="font-bold text-[11px] uppercase tracking-[1px]">Export JSON</span>
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Graphical Identity Context */}
                  {(tool.id === "brand-analyzer" || tool.id === "seo-analyzer") && (
                    <div className="mb-10 space-y-12">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                        <div className="space-y-4">
                          <h2 className="text-[10px] font-black uppercase tracking-[2px] text-primary/30">{tool.id === "seo-analyzer" ? "SEO Source" : "Brand Identity"}</h2>
                          <div className="flex items-center gap-4">
                            {result.data?.logoUrl ? (
                              <div className="h-14 w-14 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-2">
                                <img src={result.data.logoUrl} className="max-h-full max-w-full object-contain" alt="Logo" />
                              </div>
                            ) : (
                              <div className="h-14 w-14 flex items-center justify-center bg-gray-50 rounded-2xl border border-dashed border-gray-200"><User className="text-gray-300 w-5 h-5" /></div>
                            )}
                            <div className="min-w-0">
                               <p className="text-[20px] font-display text-primary lowercase truncate leading-tight">{tool.id === "seo-analyzer" ? result.data?.seoContext?.pageTitle : result.data?.brandName}</p>
                               <p className="text-[10px] font-black text-gray-300 uppercase tracking-[1px] mt-1">{tool.id === "seo-analyzer" ? "Analyzed Site" : "Primary Asset"}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {tool.id === "seo-analyzer" ? (
                            <>
                              <h2 className="text-[10px] font-black uppercase tracking-[2px] text-primary/30">Crawl Scope</h2>
                              <div className="space-y-2">
                                <p className="text-[13px] font-bold text-gray-700">Mode: {result.data?.usage?.mode || "standard"}</p>
                                <p className="text-[13px] font-bold text-gray-700">Pages: {result.data?.usage?.pagesScraped || result.data?.seoContext?.crawledPageCount || 1}</p>
                                <p className="text-[13px] font-bold text-gray-700">Operation: {result.data?.usage?.backendFirecrawlOperation || "scrape"}</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <h2 className="text-[10px] font-black uppercase tracking-[2px] text-primary/30">Color Palette</h2>
                              <div className="flex flex-wrap gap-3">
                                {result.data?.colors?.slice(0, 8).map((c: string, i: number) => (
                                  <div key={i} className="flex flex-col items-center gap-1.5 group">
                                    <div className="w-10 h-10 rounded-xl border border-gray-100 shadow-sm cursor-copy hover:scale-110 transition-all" style={{ backgroundColor: c }} onClick={() => copyToClipboard(c)} />
                                    <span className="text-[9px] font-bold text-gray-400 uppercase">{c}</span>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>

                        <div className="space-y-4">
                          {tool.id === "seo-analyzer" ? (
                            <>
                              <h2 className="text-[10px] font-black uppercase tracking-[2px] text-primary/30">Performance Data</h2>
                              <div className="space-y-2">
                                {(result.data?.seoContext?.performanceSignals?.pageSpeed || []).slice(0, 2).map((item: any) => (
                                  <div key={item.strategy} className="flex items-center justify-between gap-3">
                                    <span className="text-[13px] font-bold text-gray-700 capitalize">{item.strategy}</span>
                                    <span className="text-[11px] font-black text-gray-400 uppercase">{item.available ? "available" : "missing"}</span>
                                  </div>
                                ))}
                                {result.data?.seoContext?.performanceSignals?.crux && (
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="text-[13px] font-bold text-gray-700">CrUX</span>
                                    <span className="text-[11px] font-black text-gray-400 uppercase">{result.data.seoContext.performanceSignals.crux.available ? "real-user data" : "missing"}</span>
                                  </div>
                                )}
                              </div>
                            </>
                          ) : (
                            <>
                              <h2 className="text-[10px] font-black uppercase tracking-[2px] text-primary/30">Typography</h2>
                              <div className="space-y-2">
                                {uniqueFonts.slice(0, 3).map((family: any, idx: number) => (
                                  <div key={idx} className="flex items-center gap-3">
                                    <div className="h-8 w-8 flex items-center justify-center bg-gray-50 rounded-lg text-primary font-black text-[14px]">Aa</div>
                                    <div className="min-w-0">
                                      <p className="text-[13px] font-bold text-gray-700 truncate">{family}</p>
                                      <p className="text-[9px] font-black text-gray-300 uppercase tracking-[1px]">Brand Font</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {tool.id === "brand-analyzer" && (
                      <div className="space-y-4">
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                          {(result.screenshots?.length > 0 ? result.screenshots : [result.screenshot || result.data?.screenshot || result.data?.logoUrl]).filter(Boolean).map((img: string, idx: number) => (
                             <div key={idx} className="relative h-32 aspect-video rounded-2xl overflow-hidden cursor-zoom-in border border-gray-100 shadow-sm hover:border-primary/20 transition-all shrink-0" onClick={() => setPreviewImage(img)}>
                                <img src={img} className="w-full h-full object-cover object-top" alt="Shot" />
                                <div className="absolute inset-0 bg-black/10 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]"><div className="bg-white/90 p-2 rounded-full shadow-xl"><Eye className="text-primary w-5 h-5" /></div></div>
                             </div>
                          ))}
                        </div>
                      </div>
                      )}
                    </div>
                  )}

                  {supportsPreviewFormats && (
                    <div className="mb-8 flex flex-wrap items-center justify-end gap-2">
                      {[
                        { id: "document", label: "Read Only", icon: LayoutTemplate },
                        { id: "markdown", label: "Markdown", icon: Code2 },
                        { id: "json", label: "JSON", icon: Braces },
                      ].map((item) => {
                        const Icon = item.icon;
                        const active = activePreviewMode === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setPreviewMode(item.id as "document" | "markdown" | "json")}
                            className={`flex h-11 items-center gap-2 rounded-2xl px-4 text-[11px] font-black uppercase tracking-[1px] transition-all ${
                              active
                                ? "bg-primary text-white shadow-[0_4px_0_0_var(--brand-primary-shadow)]"
                                : "bg-gray-50 text-gray-400 hover:bg-primary/[0.04] hover:text-primary"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Physical Preview Rendering */}
                  {renderPresentonPreview()}

                  {activePreviewMode === "document" && !result.data?.reportBlocks && (
                    renderMobileReadOnlyPreview()
                  )}

                  {activePreviewMode === "document" && result.data?.reportBlocks && (
                    <>
                      {renderMobileReadOnlyPreview()}
                      <div className="hidden md:block">
                        <ReportBlockRenderer blocks={result.data.reportBlocks} />
                      </div>
                    </>
                  )}

                  {isQuickResult ? (
                    renderQuickResult()
                  ) : activePreviewMode === "document" && result.data?.reportBlocks ? null
                  : activePreviewMode === "markdown" ? (
                    <div className="rounded-[24px] border border-gray-200 bg-[#101828] p-4 shadow-inner">
                      <style dangerouslySetInnerHTML={{ __html: `
                        .xenia-code-scroll::-webkit-scrollbar { width: 10px; height: 10px; }
                        .xenia-code-scroll::-webkit-scrollbar-track { background: #101828; }
                        .xenia-code-scroll::-webkit-scrollbar-thumb { background: #344054; border-radius: 999px; border: 2px solid #101828; }
                        .xenia-code-scroll::-webkit-scrollbar-corner { background: #101828; }
                        .xenia-code-scroll { scrollbar-color: #344054 #101828; scrollbar-width: thin; }
                      ` }} />
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-[10px] font-black uppercase tracking-[2px] text-white/40">markdown preview</p>
                        <Button type="button" variant="outline" onClick={downloadMarkdown} className="h-9 rounded-full border-white/10 bg-white/10 px-4 text-[10px] text-white hover:bg-white/15">
                          Download .md
                        </Button>
                      </div>
                      <pre className="xenia-code-scroll max-h-[900px] overflow-auto whitespace-pre-wrap rounded-[18px] bg-black/25 p-5 text-left text-[13px] font-semibold leading-relaxed text-white/85">
                        {markdownPreview}
                      </pre>
                    </div>
                  ) : activePreviewMode === "json" ? (
                    <div className="rounded-[24px] border border-gray-200 bg-[#0B1220] p-4 shadow-inner">
                      <style dangerouslySetInnerHTML={{ __html: `
                        .xenia-code-scroll::-webkit-scrollbar { width: 10px; height: 10px; }
                        .xenia-code-scroll::-webkit-scrollbar-track { background: #0B1220; }
                        .xenia-code-scroll::-webkit-scrollbar-thumb { background: #344054; border-radius: 999px; border: 2px solid #0B1220; }
                        .xenia-code-scroll::-webkit-scrollbar-corner { background: #0B1220; }
                        .xenia-code-scroll { scrollbar-color: #344054 #0B1220; scrollbar-width: thin; }
                      ` }} />
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-[10px] font-black uppercase tracking-[2px] text-white/40">json preview</p>
                        <Button type="button" variant="outline" onClick={downloadJson} className="h-9 rounded-full border-white/10 bg-white/10 px-4 text-[10px] text-white hover:bg-white/15">
                          Download .json
                        </Button>
                      </div>
                      <div className="xenia-code-scroll max-h-[900px] overflow-auto rounded-[18px] bg-black/25 p-5 text-left">
                        <code className="block min-w-max font-mono text-[12px] font-semibold leading-relaxed text-emerald-100">
                          {jsonPreviewLines.map((line, index) => (
                            <div key={index} className="grid grid-cols-[44px_1fr] gap-4">
                              <span className="select-none text-right text-white/25">{index + 1}</span>
                              <span className="whitespace-pre">{line || " "}</span>
                            </div>
                          ))}
                        </code>
                      </div>
                    </div>
                  ) : tool.id === "presentation" && result.data?.reportBlocks ? null : (
                  <div className="relative hidden flex-col items-center gap-6 overflow-hidden rounded-[24px] border border-gray-200 bg-[#EBEDF0] p-3 shadow-inner md:flex md:p-6">
                    <style dangerouslySetInnerHTML={{ __html: `
                      .raw-doc-studio, .raw-doc-studio * {
                        font-family: Arial, Helvetica, sans-serif !important;
                        color: #000000 !important;
                        line-height: 1.6 !important;
                        text-align: justify !important;
                        -webkit-font-smoothing: antialiased;
                      }
                      .raw-doc-studio p { font-size: 15px !important; margin-bottom: 16px !important; }
                      .raw-doc-studio h1 { font-size: 24px !important; font-weight: 800 !important; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 24px; text-transform: uppercase; text-align: left !important; }
                      .raw-doc-studio h2 { font-size: 18px !important; font-weight: 700 !important; margin-top: 24px; margin-bottom: 12px; border-bottom: 1px solid #EEE; text-align: left !important; }
                      .raw-doc-studio h3 { font-size: 15px !important; font-weight: 800 !important; margin-top: 18px; margin-bottom: 8px; text-align: left !important; }
                      .raw-doc-studio ul, .raw-doc-studio ol { margin-bottom: 16px; padding-left: 28px; text-align: left !important; }
                      .raw-doc-studio ul { list-style-type: disc !important; }
                      .raw-doc-studio ol { list-style-type: decimal !important; }
                      .raw-doc-studio li { display: list-item !important; margin-bottom: 8px; font-size: 15px !important; text-align: left !important; padding-left: 4px; }
                      .raw-doc-studio li::marker { color: #000000 !important; font-size: 1em !important; }
                      .raw-doc-studio table { width: 100%; border-collapse: collapse; margin: 20px 0; border: 1.5px solid #000; text-align: left !important; }
                      .raw-doc-studio th, .raw-doc-studio td { border: 1px solid #000; padding: 10px; font-size: 13px !important; }
                      .raw-doc-studio th { background: #F3F4F6; font-weight: 800; }
                    ` }} />

                    <div className="xenia-sheet bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] relative w-full max-w-[794px] min-h-[1123px] p-[0.75in] border border-gray-200 transition-all">
                      <div className="raw-doc-studio text-left" dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(formattedHtml)
                      }} />
                    </div>
                  </div>
                  )}
                </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gallery Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-6 md:p-20 backdrop-blur-3xl" onClick={() => setPreviewImage(null)}>
          <img src={previewImage} className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl" />
          <button className="absolute top-10 right-10 text-white/40 hover:text-white transition-colors"><X size={32} /></button>
        </div>
      )}
    </div>
  );
}

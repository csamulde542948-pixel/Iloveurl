import * as React from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "./dashboard-layout";
import { useAuth } from "../../components/auth-provider";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { FileText, Upload, Download, Trash2, Loader2, RefreshCw, Briefcase, PenLine } from "lucide-react";
import { toast } from "sonner";

type ResumeProfile = {
  user_id: string;
  resume_text: string;
  source: string;
  file_name?: string | null;
  file_bucket?: string | null;
  file_path?: string | null;
  file_mime?: string | null;
  file_size?: number | null;
  updated_at?: string | null;
};

function formatBytes(value?: number | null) {
  if (!value) return "Not available";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function DashboardResume() {
  const { user, session } = useAuth();
  const [profile, setProfile] = React.useState<ResumeProfile | null>(null);
  const [fileUrl, setFileUrl] = React.useState<string | null>(null);
  const [resumeText, setResumeText] = React.useState("");
  const [resumeFile, setResumeFile] = React.useState<File | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const isPdfProfile = Boolean(fileUrl && (profile?.file_mime === "application/pdf" || profile?.file_name?.toLowerCase().endsWith(".pdf")));

  const fetchProfile = React.useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const api = import.meta.env.VITE_API_URL || "http://localhost:8080";
      const response = await fetch(`${api}/api/resume-profile/${user.id}`, {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      });
      if (!response.ok) throw new Error("Failed to fetch resume profile");
      const payload = await response.json();
      setProfile(payload.profile || null);
      setFileUrl(payload.fileUrl || null);
      setResumeText(payload.profile?.resume_text || "");
    } catch (error: any) {
      toast.error(error.message || "Could not load resume profile");
    } finally {
      setLoading(false);
    }
  }, [user?.id, session?.access_token]);

  React.useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    if (!user?.id) return;
    if (!resumeText.trim() && !resumeFile) {
      toast.error("Paste or upload a resume first.");
      return;
    }

    setSaving(true);
    try {
      const api = import.meta.env.VITE_API_URL || "http://localhost:8080";
      const formData = new FormData();
      if (resumeText.trim()) formData.append("resumeText", resumeText.trim());
      if (resumeFile) formData.append("resumeFile", resumeFile);

      const response = await fetch(`${api}/api/resume-profile/${user.id}`, {
        method: "POST",
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
        body: formData,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Failed to save resume profile");

      setProfile(payload.profile || null);
      setFileUrl(payload.fileUrl || null);
      setResumeFile(null);
      toast.success("Resume profile saved");
    } catch (error: any) {
      toast.error(error.message || "Could not save resume profile");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user?.id) return;
    setDeleting(true);
    try {
      const api = import.meta.env.VITE_API_URL || "http://localhost:8080";
      const response = await fetch(`${api}/api/resume-profile/${user.id}`, {
        method: "DELETE",
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      });
      if (!response.ok) throw new Error("Failed to delete resume profile");
      setProfile(null);
      setFileUrl(null);
      setResumeText("");
      setResumeFile(null);
      toast.success("Resume profile cleared");
    } catch (error: any) {
      toast.error(error.message || "Could not delete resume profile");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-[28px] md:text-[32px] font-display text-primary leading-tight">
              Resume <span className="font-bold">Profile</span>
            </h1>
            <p className="mt-1 text-[15px] font-medium text-gray-light">
              Save one resume profile for Resume Match and Cover Letter workflows.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={fetchProfile} className="rounded-full">
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <Card className="overflow-hidden rounded-[32px] border-2 border-border-color/50 shadow-sm">
            <CardHeader className="border-b border-border-color/50 p-8">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-primary/10 p-2.5 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-[18px] font-bold uppercase tracking-wide">Saved Resume</CardTitle>
                  <CardDescription className="text-[13px]">Upload a file or edit the extracted resume text.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              {loading ? (
                <div className="flex min-h-72 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-[26px] border-2 border-dashed border-primary/20 bg-primary/[0.03] p-8 text-center transition hover:border-primary/40 hover:bg-primary/[0.05]">
                    <Upload className="mb-3 h-8 w-8 text-primary" />
                    <span className="text-[13px] font-black uppercase tracking-[1px] text-primary">
                      {resumeFile ? resumeFile.name : "Upload new resume file"}
                    </span>
                    <span className="mt-1 text-[12px] font-bold text-gray-400">PDF, DOCX, TXT, or MD up to 8MB</span>
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
                      className="hidden"
                      onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
                    />
                  </label>

                  <div className="overflow-hidden rounded-[24px] border-2 border-border-color bg-white shadow-[0_4px_0_0_#CFCFCF]">
                    <div className="flex items-center justify-between gap-3 border-b border-border-color/60 bg-gray-50 px-5 py-4">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[2px] text-primary/50">
                          {isPdfProfile ? "pdf preview" : "resume preview"}
                        </p>
                        <p className="mt-1 text-[12px] font-bold text-gray-400">
                          {isPdfProfile ? "Read-only preview of your stored PDF resume." : "Read-only extracted text from your saved resume."}
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[1px] text-gray-400">
                        no editing
                      </span>
                    </div>
                    {isPdfProfile ? (
                      <iframe
                        title="Saved resume PDF preview"
                        src={`${fileUrl}#toolbar=1&navpanes=0`}
                        className="h-[640px] w-full bg-white"
                      />
                    ) : (
                      <pre className="max-h-[520px] min-h-[360px] overflow-auto whitespace-pre-wrap bg-white p-6 text-left text-[13px] font-semibold leading-relaxed text-gray-700">
                        {resumeText || "No saved resume preview yet. Upload a resume file above and click Save Resume."}
                      </pre>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={() => setResumeFile(null)} className="rounded-full" disabled={!resumeFile}>
                      Clear Upload
                    </Button>
                    <Button type="button" onClick={handleSave} disabled={saving} className="h-12 rounded-full px-8 shadow-[0_4px_0_0_#CFCFCF]">
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                      Save Resume
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-[32px] border-2 border-border-color/50 shadow-sm">
              <CardHeader className="p-6">
                <CardTitle className="text-[15px] font-bold uppercase tracking-wide">Profile Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6 pt-0">
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[2px] text-gray-400">Status</p>
                  <p className="mt-1 text-[15px] font-black text-primary">{profile ? "Saved" : "Not saved yet"}</p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[2px] text-gray-400">File</p>
                  <p className="mt-1 break-words text-[13px] font-bold text-gray-700">{profile?.file_name || "No file stored"}</p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[2px] text-gray-400">Size</p>
                  <p className="mt-1 text-[13px] font-bold text-gray-700">{formatBytes(profile?.file_size)}</p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[2px] text-gray-400">Updated</p>
                  <p className="mt-1 text-[13px] font-bold text-gray-700">
                    {profile?.updated_at ? new Date(profile.updated_at).toLocaleString() : "Not available"}
                  </p>
                </div>
                <div className="grid gap-3">
                  {fileUrl && (
                    <a href={fileUrl} target="_blank" rel="noreferrer">
                      <Button type="button" variant="outline" className="h-12 w-full rounded-full">
                        <Download className="mr-2 h-4 w-4" /> Download Stored File
                      </Button>
                    </a>
                  )}
                  <Button type="button" variant="outline" onClick={handleDelete} disabled={!profile || deleting} className="h-12 rounded-full border-red-100 text-red-500 hover:bg-red-50">
                    {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                    Clear Saved Resume
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[32px] border-2 border-primary/10 bg-primary/5 shadow-sm">
              <CardContent className="space-y-3 p-6">
                <p className="text-[11px] font-black uppercase tracking-[2px] text-primary/50">Use with tools</p>
                <Link to="/tool/resume" className="block">
                  <Button className="h-12 w-full rounded-full">
                    <Briefcase className="mr-2 h-4 w-4" /> Resume Match
                  </Button>
                </Link>
                <Link to="/tool/cover-letter" className="block">
                  <Button variant="outline" className="h-12 w-full rounded-full bg-white">
                    <PenLine className="mr-2 h-4 w-4" /> Cover Letter
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

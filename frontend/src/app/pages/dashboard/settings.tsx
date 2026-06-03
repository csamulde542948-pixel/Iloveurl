import * as React from "react";
import { DashboardLayout } from "./dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { useAuth } from "../../components/auth-provider";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { 
  User, 
  Mail, 
  Shield, 
  Bell, 
  Smartphone,
  Save
} from "lucide-react";
import { toast } from "sonner";

export function DashboardSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(false);

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Settings saved successfully");
    }, 1000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-4xl">
        <div>
          <h1 className="text-[28px] md:text-[32px] font-display text-primary leading-tight">Account <span className="font-bold">Settings</span></h1>
          <p className="text-[15px] text-gray-light mt-1 font-medium">Manage your profile, security, and notification preferences.</p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Profile Section */}
          <Card className="border-2 border-border-color/50 rounded-[32px] overflow-hidden shadow-sm">
            <CardHeader className="p-8 border-b border-border-color/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-500">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-[18px] font-bold uppercase tracking-wide">Personal Profile</CardTitle>
                  <CardDescription className="text-[13px]">Your public identity and contact information.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[11px] font-black uppercase tracking-wider text-nav-text/60">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input disabled value={user?.email || ""} className="pl-11 h-12 rounded-2xl bg-gray-50 border-border-color" />
                  </div>
                  <p className="text-[10px] text-gray-light italic">Email cannot be changed on free tier.</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-black uppercase tracking-wider text-nav-text/60">Full Name</Label>
                  <Input placeholder="John Doe" className="h-12 rounded-2xl border-border-color focus:border-primary transition-all" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Section */}
          <Card className="border-2 border-border-color/50 rounded-[32px] overflow-hidden shadow-sm">
            <CardHeader className="p-8 border-b border-border-color/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-500">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-[18px] font-bold uppercase tracking-wide">Security</CardTitle>
                  <CardDescription className="text-[13px]">Secure your account with multi-factor authentication.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 border border-border-color/50">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-xl bg-white border border-border-color shadow-sm text-gray-400">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-gray-text">Two-Factor Authentication</p>
                    <p className="text-[12px] text-gray-light">Add an extra layer of security to your account.</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="rounded-full px-5 border-primary/20 text-primary hover:bg-primary/5 uppercase font-bold text-[11px] tracking-wider">Enable</Button>
              </div>
            </CardContent>
          </Card>

          {/* Notification Section */}
          <Card className="border-2 border-border-color/50 rounded-[32px] overflow-hidden shadow-sm">
            <CardHeader className="p-8 border-b border-border-color/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-orange-50 text-orange-500">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-[18px] font-bold uppercase tracking-wide">Notifications</CardTitle>
                  <CardDescription className="text-[13px]">Control how and when you hear from us.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
               <div className="space-y-4">
                 {[
                   { label: "Transformation Completion", desc: "Get notified when your document is ready." },
                   { label: "Security Alerts", desc: "Get notified of unusual login activity." },
                   { label: "Product Updates", desc: "New tools, features and platform news." }
                 ].map((item, i) => (
                   <div key={i} className="flex items-center justify-between">
                     <div>
                       <p className="text-[14px] font-bold text-gray-text">{item.label}</p>
                       <p className="text-[12px] text-gray-light">{item.desc}</p>
                     </div>
                     <div className="w-10 h-6 rounded-full bg-primary/20 relative p-1 cursor-pointer">
                        <div className="w-4 h-4 rounded-full bg-primary absolute right-1 shadow-sm" />
                     </div>
                   </div>
                 ))}
               </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4 pb-12">
            <Button variant="ghost" className="rounded-full px-8 font-bold uppercase text-[12px] tracking-wider">Cancel</Button>
            <Button 
              disabled={loading}
              onClick={handleSave}
              className="rounded-full shadow-[0_4px_0_0_#CFCFCF] px-8 h-12 uppercase font-bold tracking-wider"
            >
              {loading ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

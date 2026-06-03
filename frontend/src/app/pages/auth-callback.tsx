import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { AUTH_CALLBACK_PATH, getPostAuthRedirectPath } from "../../lib/authRedirects";
import { toast } from "sonner";

export function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    const finishSignIn = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (!active) return;

        window.history.replaceState({}, document.title, AUTH_CALLBACK_PATH);

        if (data.session) {
          toast.success("Signed in successfully.");
          navigate(getPostAuthRedirectPath(), { replace: true });
          return;
        }

        toast.error("Sign in session was not found. Please try again.");
        navigate("/signin", { replace: true });
      } catch (error: any) {
        if (!active) return;
        toast.error(error.message || "Unable to complete sign in.");
        navigate("/signin", { replace: true });
      }
    };

    finishSignIn();

    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl border-2 border-gray-950 bg-primary text-white shadow-[0_6px_0_0_#CFCFCF]">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
        <div>
          <p className="text-[11px] font-black uppercase tracking-[2px] text-primary/60">authenticating</p>
          <h1 className="font-display text-[34px] lowercase leading-none text-gray-950">setting up your session.</h1>
        </div>
      </div>
    </div>
  );
}

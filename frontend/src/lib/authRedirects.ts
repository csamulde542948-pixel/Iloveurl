export const AUTH_CALLBACK_PATH = "/auth/callback";

export function getAuthCallbackUrl() {
  const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
  const isLocalApp = localHosts.has(window.location.hostname);
  const configuredOrigin = import.meta.env.VITE_AUTH_REDIRECT_ORIGIN;
  const origin = isLocalApp ? window.location.origin : configuredOrigin || window.location.origin;
  const callbackUrl = `${origin.replace(/\/$/, "")}${AUTH_CALLBACK_PATH}`;

  if (import.meta.env.DEV) {
    console.info("[auth] OAuth redirect URL:", callbackUrl);
  }

  return callbackUrl;
}

export function getPostAuthRedirectPath() {
  return "/dashboard";
}

import { EventType, PublicClientApplication } from "@azure/msal-browser";

const appOrigin = window.location.origin;

export const SSO_PENDING_KEY = "cdi_sso_pending";

export const isSsoConfigured = Boolean(import.meta.env.VITE_CLIENT_ID);

export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_CLIENT_ID || "",
    authority: import.meta.env.VITE_AUTHORITY || "https://login.microsoftonline.com/common",
    redirectUri: import.meta.env.VITE_REDIRECT_URI || appOrigin,
    postLogoutRedirectUri: import.meta.env.VITE_POST_LOGOUT_REDIRECT_URI || appOrigin,
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: "localStorage",
  },
};

export const loginRequest = {
  scopes: ["openid", "profile", "email", "User.Read"],
};

export const tokenRequest = {
  scopes: ["openid", "profile", "email", "User.Read"],
};

export const msalInstance = new PublicClientApplication(msalConfig);

msalInstance.addEventCallback((event) => {
  if (event.eventType === EventType.LOGIN_SUCCESS && event.payload?.account) {
    msalInstance.setActiveAccount(event.payload.account);
  }
});

export const markSsoPending = () => {
  try {
    sessionStorage.setItem(SSO_PENDING_KEY, "1");
  } catch {
    return false;
  }
  return true;
};

export const hasSsoPending = () => {
  try {
    return sessionStorage.getItem(SSO_PENDING_KEY) === "1";
  } catch {
    return false;
  }
};

export const clearSsoPending = () => {
  try {
    sessionStorage.removeItem(SSO_PENDING_KEY);
  } catch {
    return false;
  }
  return true;
};

export const buildSsoSession = (result) => {
  const account = result?.account;
  const claims = account?.idTokenClaims || {};
  const email = claims.email || claims.preferred_username || account?.username || "";
  const name = account?.name || claims.name || email;
  const roles = Array.isArray(claims.roles) ? claims.roles : [];

  return {
    token: result?.idToken || result?.accessToken,
    method: "sso",
    remember: true,
    user: {
      id: account?.homeAccountId || email,
      name,
      firstName: name.split(" ")[0],
      email,
      username: email.split("@")[0].toLowerCase(),
      role: roles[0] || "Microsoft account",
    },
  };
};

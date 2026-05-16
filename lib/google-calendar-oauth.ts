import { google } from "googleapis";

export const CALENDAR_READONLY_SCOPE =
  "https://www.googleapis.com/auth/calendar.readonly";

export function getOAuthClient(redirectUri: string) {
  const clientId =
    process.env.GOOGLE_CALENDAR_CLIENT_ID?.trim() ??
    process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret =
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET?.trim() ??
    process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing GOOGLE_CALENDAR_CLIENT_ID/SECRET (or GOOGLE_CLIENT_ID/SECRET)",
    );
  }
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getCalendarAuthUrl(params: {
  redirectUri: string;
  state: string;
}): string {
  const oauth2 = getOAuthClient(params.redirectUri);
  return oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [CALENDAR_READONLY_SCOPE],
    state: params.state,
    include_granted_scopes: true,
  });
}

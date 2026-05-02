"use client";

import { VAULT_SKIP_DROP_LANDING_COOKIE } from "@/lib/vault-nav";

/** Call before client navigations to `/` when Today is meant (nav, wizard exit). */
export function markPreferTodayOverDropLanding(): void {
  try {
    const maxAge = 60 * 60 * 12;
    document.cookie = `${VAULT_SKIP_DROP_LANDING_COOKIE}=1; path=/; max-age=${maxAge}; SameSite=Lax`;
  } catch {
    /* private mode / disabled cookies */
  }
}

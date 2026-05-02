# Apple Shortcut: Deposit to The Vault

A 30-second setup for the Action Button on iPhone.

## Once

1. Open **Shortcuts** app → **+** → name it `Deposit to Vault`.
2. Add these actions in order:
   1. **Dictate Text** — language: English (US). Stop on tap.
   2. **Get Contents of URL**
      - URL: `https://YOUR-DOMAIN.app/api/capture`
      - Method: `POST`
      - Headers:
         - `Authorization` → `Bearer YOUR_CAPTURE_TOKEN`
         - `Content-Type` → `application/json`
      - Request Body → JSON:
         - `text` → (Magic Variable: Dictated Text)
         - `source` → `shortcut`
         - `userId` → `YOUR_USER_ID`
   3. **Show Notification** — text: `Deposited.`
3. Save.
4. **Settings → Action Button → Shortcut → Deposit to Vault.**

## Daily

Press the Action Button. Talk. Done. Item lands in **The Drop**.

## Variables to fill in

- `YOUR-DOMAIN.app` — Vercel domain.
- `YOUR_CAPTURE_TOKEN` — value of `CAPTURE_TOKEN` in `.env.local` and in Vercel project env.
- `YOUR_USER_ID` — your `auth.uid` after signing in once. (Run a one-liner against Supabase to grab it, or copy from Settings → Connect.)

## Siri variant

Same Shortcut works with “Hey Siri, deposit to vault” — Siri runs the Shortcut.

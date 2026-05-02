import { google } from "googleapis";
import { config } from "dotenv";
config({ path: ".env.local" });

const SHEET_ID = process.env.SHEET_ID!;
const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS!,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});
const sheets = google.sheets({ version: "v4", auth });

async function tab(name: string, range: string) {
  const r = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `'${name}'!${range}`,
  });
  return r.data.values ?? [];
}

(async () => {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  console.log("== TABS ==");
  for (const s of meta.data.sheets ?? []) console.log(" -", s.properties?.title);

  const admin = await tab("ADMIN", "A1:Z40");
  console.log("\n== ADMIN (first 30 rows, all columns) ==");
  admin.slice(0, 30).forEach((row, i) => {
    console.log(String(i).padStart(2, "0"), JSON.stringify(row));
  });

  const menu = await tab("MENU", "A1:Z40");
  console.log("\n== MENU (first 30 rows, all columns) ==");
  menu.slice(0, 30).forEach((row, i) => {
    console.log(String(i).padStart(2, "0"), JSON.stringify(row));
  });
})();

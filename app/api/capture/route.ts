import { NextRequest } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/server";

const Body = z.object({
  text: z.string().min(1).max(2000),
  source: z.enum(["siri", "shortcut", "pwa", "mailslot"]).default("shortcut"),
  userId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token || token !== process.env.CAPTURE_TOKEN) {
    return new Response("Unauthorized", { status: 401 });
  }

  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch (e) {
    return new Response("Bad request", { status: 400 });
  }

  const sb = supabaseAdmin();

  const { data: membership } = await sb
    .from("vault_members")
    .select("vault_id")
    .eq("user_id", parsed.userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return new Response("No vault for user", { status: 404 });
  }

  const { data: item, error } = await sb
    .from("items")
    .insert({
      vault_id: membership.vault_id,
      user_id: parsed.userId,
      box: "DROP",
      title: parsed.text.trim(),
      urgent: false,
      must: false,
      pinned: false,
    })
    .select()
    .single();

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  await sb.from("captures").insert({
    vault_id: membership.vault_id,
    user_id: parsed.userId,
    raw: parsed.text,
    source: parsed.source,
    item_id: item.id,
  });

  return Response.json({ ok: true, itemId: item.id });
}

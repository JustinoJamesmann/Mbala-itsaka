import { NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { requireAdmin } from "../../../../lib/auth";

export async function GET() {
  await requireAdmin();
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ logs: data });
}

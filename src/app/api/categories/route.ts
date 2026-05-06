import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../lib/supabase/admin";
import { requireAdmin, requireServerUser } from "../../../lib/auth";

export async function GET() {
  await requireServerUser();
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("categories").select("name").order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ categories: data.map(row => row.name) });
}

export async function PUT(request: NextRequest) {
  const user = await requireAdmin();
  const { categories } = await request.json();
  const supabase = createAdminClient();
  await supabase.from("categories").delete().neq("name", "");
  if (Array.isArray(categories) && categories.length > 0) {
    const { error } = await supabase.from("categories").insert(categories.map((name: string) => ({ name, created_by: user.authId })));
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  await supabase.from("activity_logs").insert({ actor_id: user.authId, actor_username: user.username, action: "update_categories", entity_type: "category", details: { categories } });
  return NextResponse.json({ categories });
}

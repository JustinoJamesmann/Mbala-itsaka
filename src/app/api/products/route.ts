import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../lib/supabase/admin";
import { requireAdmin, requireServerUser } from "../../../lib/auth";
import { mapProduct, toProductRow } from "../../../lib/mappers";

export async function GET() {
  await requireServerUser();
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("products").select("*").order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data.map(mapProduct) });
}

export async function POST(request: NextRequest) {
  const user = await requireAdmin();
  const product = await request.json();
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("products").insert(toProductRow(product, user.authId)).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await supabase.from("activity_logs").insert({ actor_id: user.authId, actor_username: user.username, action: "create_product", entity_type: "product", entity_id: data.id, details: data });
  return NextResponse.json({ product: mapProduct(data) });
}

export async function PUT(request: NextRequest) {
  const user = await requireAdmin();
  const product = await request.json();
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("products").update(toProductRow(product, user.authId)).eq("id", product.id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await supabase.from("activity_logs").insert({ actor_id: user.authId, actor_username: user.username, action: "update_product", entity_type: "product", entity_id: data.id, details: data });
  return NextResponse.json({ product: mapProduct(data) });
}

export async function DELETE(request: NextRequest) {
  const user = await requireAdmin();
  const { id } = await request.json();
  const supabase = createAdminClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await supabase.from("activity_logs").insert({ actor_id: user.authId, actor_username: user.username, action: "delete_product", entity_type: "product", entity_id: id });
  return NextResponse.json({ ok: true });
}

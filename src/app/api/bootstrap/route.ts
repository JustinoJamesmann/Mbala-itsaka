import { NextResponse } from "next/server";
import { getServerUser } from "../../../lib/auth";
import { mapOrder, mapProduct } from "../../../lib/mappers";
import { createAdminClient } from "../../../lib/supabase/admin";

export async function GET() {
  const user = await getServerUser();

  if (!user) {
    return NextResponse.json({ user: null, products: [], orders: [] });
  }

  const supabase = createAdminClient();
  const [productsResult, ordersResult] = await Promise.all([
    supabase.from("products").select("*").order("name"),
    supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }),
  ]);

  if (productsResult.error) {
    return NextResponse.json({ error: productsResult.error.message }, { status: 500 });
  }

  if (ordersResult.error) {
    return NextResponse.json({ error: ordersResult.error.message }, { status: 500 });
  }

  return NextResponse.json({
    user,
    products: (productsResult.data || []).map(mapProduct),
    orders: (ordersResult.data || []).map(mapOrder),
  });
}

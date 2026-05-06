import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../lib/supabase/admin";
import { requireAdmin, requireServerUser } from "../../../lib/auth";
import { mapOrder } from "../../../lib/mappers";
import { Order } from "../../types";

export async function GET() {
  await requireServerUser();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data.map(mapOrder) });
}

export async function POST(request: NextRequest) {
  const user = await requireServerUser();
  const order = await request.json() as Omit<Order, "id">;
  const supabase = createAdminClient();
  const orderId = `ORD-${Date.now()}`;

  for (const item of order.items) {
    const { data: product, error } = await supabase.from("products").select("quantity").eq("id", item.productId).single();
    if (error || !product || product.quantity < item.quantity) {
      return NextResponse.json({ error: `Not enough stock for ${item.productName}` }, { status: 400 });
    }
  }

  const { data: createdOrder, error: orderError } = await supabase.from("orders").insert({
    id: orderId,
    customer: order.customer,
    phone: order.phone || null,
    address: order.address || null,
    subtotal: order.subtotal,
    delivery_cost: order.deliveryCost || 0,
    total: order.total,
    status: order.status,
    order_date: order.date,
    created_by: user.authId,
    updated_by: user.authId,
  }).select("*").single();

  if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 });

  const { error: itemsError } = await supabase.from("order_items").insert(order.items.map(item => ({
    order_id: orderId,
    product_id: item.productId,
    product_name: item.productName,
    quantity: item.quantity,
    price: item.price,
    total: item.total,
  })));

  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });

  for (const item of order.items) {
    const { data: product } = await supabase.from("products").select("quantity").eq("id", item.productId).single();
    await supabase.from("products").update({ quantity: Math.max(0, Number(product?.quantity || 0) - item.quantity), updated_by: user.authId }).eq("id", item.productId);
  }

  await supabase.from("activity_logs").insert({ actor_id: user.authId, actor_username: user.username, action: "create_order", entity_type: "order", entity_id: orderId, details: { order: createdOrder, items: order.items } });
  return NextResponse.json({ order: { ...order, id: orderId } });
}

export async function PUT(request: NextRequest) {
  const user = await requireServerUser();
  const { id, status } = await request.json();
  const allowed = user.role === "admin" || ["pending", "confirmed"].includes(status);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("orders").update({ status, updated_by: user.authId }).eq("id", id).select("*, order_items(*)").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await supabase.from("activity_logs").insert({ actor_id: user.authId, actor_username: user.username, action: "update_order_status", entity_type: "order", entity_id: id, details: { status } });
  return NextResponse.json({ order: mapOrder(data) });
}

export async function DELETE(request: NextRequest) {
  const user = await requireAdmin();
  const { id } = await request.json();
  const supabase = createAdminClient();
  const { data: order } = await supabase.from("orders").select("*, order_items(*)").eq("id", id).single();

  if (order?.order_items) {
    for (const item of order.order_items) {
      const { data: product } = await supabase.from("products").select("quantity").eq("id", item.product_id).single();
      await supabase.from("products").update({ quantity: Number(product?.quantity || 0) + Number(item.quantity || 0), updated_by: user.authId }).eq("id", item.product_id);
    }
  }

  const { error } = await supabase.from("orders").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await supabase.from("activity_logs").insert({ actor_id: user.authId, actor_username: user.username, action: "delete_order", entity_type: "order", entity_id: id, details: order || {} });
  return NextResponse.json({ ok: true });
}

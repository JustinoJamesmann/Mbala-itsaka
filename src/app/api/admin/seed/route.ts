import { NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { defaultCategories, defaultProducts } from "../../../store";

const defaultAccounts = [
  { email: "bienvenuesweethome@gmail.com", username: "BienvenueSweetHome", password: "Bi!En123", role: "admin" as const },
  { email: "bshworker6@gmail.com", username: "BSHWorker", password: "BSH!@worker123", role: "worker" as const },
];

export async function POST() {
  const supabase = createAdminClient();

  for (const account of defaultAccounts) {
    const { data: created, error } = await supabase.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,
      user_metadata: { username: account.username, role: account.role },
    });

    if (error && !error.message.toLowerCase().includes("already")) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const userId = created.user?.id;
    if (userId) {
      await supabase.from("profiles").upsert({ id: userId, username: account.username, role: account.role });
    }
  }

  for (const name of defaultCategories) {
    await supabase.from("categories").upsert({ name }, { onConflict: "name" });
  }

  for (const product of defaultProducts) {
    await supabase.from("products").upsert({
      name: product.name,
      sku: product.sku,
      category: product.category,
      buying_price: product.buyingPrice || 0,
      selling_price: product.price,
      quantity: product.quantity,
      image: product.image || null,
    }, { onConflict: "sku" });
  }

  await supabase.from("activity_logs").insert({
    action: "seed_database",
    entity_type: "system",
    details: { users: defaultAccounts.map(a => a.username), products: defaultProducts.length, categories: defaultCategories.length },
  });

  return NextResponse.json({ ok: true });
}

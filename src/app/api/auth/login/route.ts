import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { normalizeLoginEmail } from "../../../../lib/auth";

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizeLoginEmail(username),
    password,
  });

  if (error || !data.user) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, role")
    .eq("id", data.user.id)
    .single();

  if (!profile) {
    await supabase.auth.signOut();
    return NextResponse.json({ error: "User profile not found" }, { status: 403 });
  }

  return NextResponse.json({ user: profile });
}

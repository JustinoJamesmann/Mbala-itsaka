import { NextResponse } from "next/server";
import { getServerUser } from "../../../../lib/auth";

export async function GET() {
  const user = await getServerUser();
  return NextResponse.json({ user });
}

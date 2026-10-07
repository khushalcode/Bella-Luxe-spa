import { NextResponse } from "next/server";

export async function GET() {
  const sb = await getSupabase()
  return NextResponse.json({ message: "Hello, world!" });
}

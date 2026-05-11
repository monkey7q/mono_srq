import { NextResponse } from "next/server";
import { listPresets } from "@repo/shared";

export async function GET() {
  return NextResponse.json({
    ok: true,
    presets: listPresets(),
  });
}

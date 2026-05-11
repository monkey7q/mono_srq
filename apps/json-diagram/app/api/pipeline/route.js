import { NextResponse } from "next/server";
import { validatePromptInput } from "@repo/shared";
import { runPipeline } from "@/src";

export async function POST(request) {
  try {
    const payload = await request.json();
    const preview = validatePromptInput(payload);
    const result = await runPipeline(payload);

    return NextResponse.json(
      {
        ...result,
        preview,
      },
      { status: result.ok ? 200 : 422 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
      },
      { status: 400 }
    );
  }
}

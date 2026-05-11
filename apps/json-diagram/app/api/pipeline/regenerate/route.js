import { NextResponse } from "next/server";
import { regenerateFromDiagramJson } from "@/src/regenerate";

export async function POST(request) {
  try {
    const payload = await request.json();
    const result = regenerateFromDiagramJson(payload.diagramJson);

    return NextResponse.json({
      ok: true,
      diagram: result.diagram,
      generationPrompt: result.generationPrompt,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        stage: "diagram",
        errors: [error.message],
      },
      { status: 422 }
    );
  }
}

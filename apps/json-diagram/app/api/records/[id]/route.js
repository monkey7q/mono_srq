import { NextResponse } from "next/server";
import { getRecordById, updateRecord } from "@/src/records";

export async function GET(_request, context) {
  try {
    const { id } = context.params;
    const record = await getRecordById(id);

    if (!record) {
      return NextResponse.json(
        {
          ok: false,
          error: "Record not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      record,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request, context) {
  try {
    const { id } = context.params;
    const payload = await request.json();
    const record = await updateRecord(id, payload);

    return NextResponse.json({
      ok: true,
      record,
    });
  } catch (error) {
    const status =
      error && typeof error.message === "string" && error.message.includes("No record")
        ? 404
        : 400;

    return NextResponse.json(
      {
        ok: false,
        error: error.message,
      },
      { status }
    );
  }
}

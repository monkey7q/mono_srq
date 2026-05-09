import { NextResponse } from "next/server";
import { createRecord, listRecords } from "@/src/records";

export async function GET() {
  try {
    const records = await listRecords();
    return NextResponse.json({
      ok: true,
      records,
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

export async function POST(request) {
  try {
    const payload = await request.json();
    const record = await createRecord(payload);

    return NextResponse.json(
      {
        ok: true,
        record,
      },
      { status: 201 }
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

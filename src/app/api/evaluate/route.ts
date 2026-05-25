import { NextResponse } from "next/server";
import { evaluateUnderstanding } from "@/lib/ai/evaluateUnderstanding";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await evaluateUnderstanding(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Evaluation failed", details: String(error) },
      { status: 500 }
    );
  }
}
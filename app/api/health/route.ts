import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Basic health check
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        ocr: "tesseract.js",
        ai: process.env.OPENAI_API_KEY ? "openai" : "fallback",
      },
    }

    return NextResponse.json(health)
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Service check failed",
      },
      { status: 500 },
    )
  }
}

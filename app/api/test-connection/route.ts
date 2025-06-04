import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createServerClient()

    // Test the connection with a simple query
    const { data, error } = await supabase.from("people").select("id, name").limit(1)

    if (error) {
      console.error("Database connection error:", error)
      return NextResponse.json(
        {
          success: false,
          message: "Failed to connect to database",
          error: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Successfully connected to Supabase database",
      data: data,
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

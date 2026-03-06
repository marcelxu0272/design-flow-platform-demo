// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const status = req.nextUrl.searchParams.get("status")

  let query = supabase
    .from("projects")
    .select("*, flow_model:flow_models(id, name)")
    .order("updated_at", { ascending: false })

  if (status) query = query.eq("status", status as "active" | "completed" | "paused")

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const body = await req.json()
  const { data, error } = await supabase.from("projects").insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}

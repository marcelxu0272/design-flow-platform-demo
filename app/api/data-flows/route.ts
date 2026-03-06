// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const fieldId = req.nextUrl.searchParams.get("fieldId")

  let query = supabase
    .from("data_flows")
    .select("*, field:data_fields(id, field_code, field_name), source:data_sources(id, name)")
    .order("direction")

  if (fieldId) query = query.eq("field_id", fieldId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const body = await req.json()
  const { data, error } = await supabase.from("data_flows").insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}

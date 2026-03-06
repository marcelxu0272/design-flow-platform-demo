// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = req.nextUrl
  const status = searchParams.get("status")
  const discipline = searchParams.get("discipline")
  const search = searchParams.get("search")
  const includeDeleted = searchParams.get("includeDeleted") === "true"

  let query = supabase.from("data_fields").select("*").order("field_code")

  if (!includeDeleted) query = query.is("deleted_at", null)
  if (status) query = query.eq("status", status as "draft" | "published" | "deprecated")
  if (discipline) query = query.eq("engineering_discipline", discipline as "process" | "piping" | "instrumentation" | "equipment" | "electrical" | "civil" | "general")
  if (search) query = query.or(`field_code.ilike.%${search}%,field_name.ilike.%${search}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const body = await req.json()

  const { data, error } = await supabase.from("data_fields").insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}

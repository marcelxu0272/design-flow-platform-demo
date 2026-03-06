// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const [projectRes, fieldsRes] = await Promise.all([
    supabase.from("projects").select("*, flow_model:flow_models(id, name)").eq("id", id).single(),
    supabase
      .from("project_fields")
      .select("*, field:data_fields(*)")
      .eq("project_id", id)
      .order("role")
      .order("sort_order"),
  ])

  if (projectRes.error) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ ...projectRes.data, fields: fieldsRes.data ?? [] })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params
  const body = await req.json()
  const { data, error } = await supabase
    .from("projects")
    .update(body)
    .eq("id", id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params
  const { error } = await supabase.from("projects").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}

// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id: projectId } = await params
  const { fieldIds, role } = await req.json()

  const rows = (fieldIds as string[]).map((fieldId: string, i: number) => ({
    project_id: projectId,
    field_id: fieldId,
    role,
    sort_order: i,
  }))

  const { data, error } = await supabase
    .from("project_fields")
    .upsert(rows, { onConflict: "project_id,field_id,role" })
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id: projectId } = await params
  const fieldId = req.nextUrl.searchParams.get("fieldId")

  if (!fieldId) return NextResponse.json({ error: "fieldId required" }, { status: 400 })

  const { error } = await supabase
    .from("project_fields")
    .delete()
    .eq("project_id", projectId)
    .eq("field_id", fieldId)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}

// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params
  const { data, error } = await supabase
    .from("flow_model_versions")
    .select("id, flow_model_id, version_num, created_by, change_note, created_at")
    .eq("flow_model_id", id)
    .order("version_num", { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

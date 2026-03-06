// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params
  const { status } = await req.json()

  const validTransitions: Record<string, string[]> = {
    draft: ["published"],
    published: ["deprecated"],
    deprecated: [],
  }

  const { data: field } = await supabase
    .from("data_fields")
    .select("status")
    .eq("id", id)
    .single()

  if (!field) return NextResponse.json({ error: "Field not found" }, { status: 404 })

  const allowed = validTransitions[field.status] ?? []
  if (!allowed.includes(status)) {
    return NextResponse.json(
      { error: `Cannot transition from ${field.status} to ${status}` },
      { status: 422 }
    )
  }

  const { data, error } = await supabase
    .from("data_fields")
    .update({ status })
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

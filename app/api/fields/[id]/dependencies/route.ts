// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params
  const { data, error } = await supabase
    .from("field_dependencies")
    .select("*, from_field:data_fields!from_field_id(*), to_field:data_fields!to_field_id(*)")
    .or(`from_field_id.eq.${id},to_field_id.eq.${id}`)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params
  const { toFieldId, depType, expression } = await req.json()

  // Call RPC to check for cycle
  const { error: cycleError } = await supabase.rpc("check_field_dependency_cycle", {
    p_from_field_id: id,
    p_to_field_id: toFieldId,
  })

  if (cycleError) {
    return NextResponse.json(
      { error: "循环依赖：添加此依赖会产生循环，操作已拒绝" },
      { status: 409 }
    )
  }

  const { data, error } = await supabase
    .from("field_dependencies")
    .insert({
      from_field_id: id,
      to_field_id: toFieldId,
      dep_type: depType,
      expression: expression ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { id: depId } = await req.json()
  const { error } = await supabase.from("field_dependencies").delete().eq("id", depId)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}

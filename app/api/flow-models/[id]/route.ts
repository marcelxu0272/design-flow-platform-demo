// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { deserializeGraph } from "@/lib/utils/flow-serializer"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const [modelRes, nodesRes, edgesRes] = await Promise.all([
    supabase.from("flow_models").select("*").eq("id", id).single(),
    supabase.from("flow_nodes").select("*").eq("flow_model_id", id),
    supabase.from("flow_edges").select("*").eq("flow_model_id", id),
  ])

  if (modelRes.error) return NextResponse.json({ error: "Model not found" }, { status: 404 })

  // Fetch bindings with field data
  const nodeIds = (nodesRes.data ?? []).map((n) => n.id)
  const bindingsRes =
    nodeIds.length > 0
      ? await supabase
          .from("node_field_bindings")
          .select("*, field:data_fields(*)")
          .in("node_id", nodeIds)
      : { data: [] }

  const graph = deserializeGraph(
    nodesRes.data ?? [],
    edgesRes.data ?? [],
    (bindingsRes.data ?? []) as Parameters<typeof deserializeGraph>[2],
    modelRes.data.viewport
  )

  return NextResponse.json({ model: modelRes.data, ...graph })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params
  const { nodes, edges, viewport, changeNote } = await req.json()

  const { error } = await supabase.rpc("upsert_flow_graph", {
    p_model_id: id,
    p_nodes: nodes,
    p_edges: edges,
    p_viewport: viewport,
    p_change_note: changeNote ?? null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params
  const { error } = await supabase.from("flow_models").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}

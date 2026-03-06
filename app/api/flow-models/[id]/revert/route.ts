// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params
  const { versionNum } = await req.json()

  // Fetch snapshot
  const { data: version, error: vErr } = await supabase
    .from("flow_model_versions")
    .select("snapshot")
    .eq("flow_model_id", id)
    .eq("version_num", versionNum)
    .single()

  if (vErr || !version) return NextResponse.json({ error: "Version not found" }, { status: 404 })

  const snapshot = version.snapshot as { nodes: unknown[]; edges: unknown[]; viewport: unknown }

  // Revert by calling upsert RPC with snapshot data
  const { error } = await supabase.rpc("upsert_flow_graph", {
    p_model_id: id,
    p_nodes: snapshot.nodes ?? [],
    p_edges: snapshot.edges ?? [],
    p_viewport: snapshot.viewport ?? { x: 0, y: 0, zoom: 1 },
    p_change_note: `Reverted to version ${versionNum}`,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Check for deprecated field warnings after revert
  const nodesRes = await supabase.from("flow_nodes").select("id").eq("flow_model_id", id)
  const nodeIds = (nodesRes.data ?? []).map((n) => n.id)

  let deprecatedWarnings: unknown[] = []
  if (nodeIds.length > 0) {
    const { data: bindings } = await supabase
      .from("node_field_bindings")
      .select("*, field:data_fields(id, field_code, field_name, deleted_at, status)")
      .in("node_id", nodeIds)

    deprecatedWarnings = (bindings ?? []).filter(
      (b) => b.field?.deleted_at != null || b.field?.status === "deprecated"
    )
  }

  return NextResponse.json({
    success: true,
    deprecatedWarnings,
  })
}

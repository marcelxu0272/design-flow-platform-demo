// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params
  const { changeNote } = await req.json()

  const { data: doc, error: docErr } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .single()

  if (docErr || !doc) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const nextVersion = (doc.current_version ?? 0) + 1

  // Create version snapshot
  const { error: verErr } = await supabase.from("document_versions").insert({
    document_id: id,
    version_num: nextVersion,
    content: doc.title,
    change_note: changeNote,
  })

  if (verErr) return NextResponse.json({ error: verErr.message }, { status: 400 })

  // Update document status and version
  const { data, error } = await supabase
    .from("documents")
    .update({ status: "published", current_version: nextVersion })
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Write audit log
  await supabase.from("document_audit_logs").insert({
    document_id: id,
    action: "publish",
    operator: "system",
    diff: { version: nextVersion, note: changeNote },
  })

  return NextResponse.json(data)
}

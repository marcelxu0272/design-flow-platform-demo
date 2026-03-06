import dagre from "dagre"
import type { AppNode, AppEdge } from "@/lib/types/flow.types"

const NODE_WIDTH = 220
const NODE_HEIGHT = 80

export type LayoutDirection = "TB" | "LR"

export function applyDagreLayout(
  nodes: AppNode[],
  edges: AppEdge[],
  direction: LayoutDirection = "LR"
): AppNode[] {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: direction, nodesep: 60, ranksep: 100 })

  for (const node of nodes) {
    g.setNode(node.id, {
      width: node.width ?? NODE_WIDTH,
      height: node.height ?? NODE_HEIGHT,
    })
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target)
  }

  dagre.layout(g)

  return nodes.map((node) => {
    const pos = g.node(node.id)
    return {
      ...node,
      position: {
        x: pos.x - (node.width ?? NODE_WIDTH) / 2,
        y: pos.y - (node.height ?? NODE_HEIGHT) / 2,
      },
    }
  })
}

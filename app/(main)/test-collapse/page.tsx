"use client"

import { useState, useCallback, useMemo } from "react"
import { ReactFlow } from "@xyflow/react"
import type { Node, Edge } from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { Header } from "@/components/layout/Header"
import { PageHeader } from "@/components/shared/PageHeader"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const GROUP1_IDS = ["1", "2", "3"]
const GROUP2_IDS = ["4", "5", "6", "7"]
const GROUP1_PARENT = "g1"
const GROUP2_PARENT = "g2"

const NODE_GAP = 24
const NODE_WIDTH = 140
const NODE_HEIGHT = 36
const GAP_BETWEEN_GROUPS = 40

const W1_EXPANDED = 3 * NODE_WIDTH + 2 * NODE_GAP + 24
const W2_EXPANDED = 4 * NODE_WIDTH + 3 * NODE_GAP + 24
const H_EXPANDED = 56 + NODE_HEIGHT
const W_COLLAPSED = 180
const H_COLLAPSED = 48

const groupBoxStyle = {
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  padding: 12,
}

const baseNodes: Node[] = [
  {
    id: GROUP1_PARENT,
    data: { label: "部分一 (3个节点, 点击折叠/展开)" },
    position: { x: 30, y: 40 },
    type: "input",
    style: { ...groupBoxStyle, width: W1_EXPANDED, height: H_EXPANDED },
  },
  {
    id: "1",
    data: { label: "1" },
    position: { x: 12, y: 48 },
    parentId: GROUP1_PARENT,
    extent: "parent",
    style: { width: NODE_WIDTH, height: NODE_HEIGHT },
  },
  {
    id: "2",
    data: { label: "2" },
    position: { x: 12 + NODE_WIDTH + NODE_GAP, y: 48 },
    parentId: GROUP1_PARENT,
    extent: "parent",
    style: { width: NODE_WIDTH, height: NODE_HEIGHT },
  },
  {
    id: "3",
    data: { label: "3" },
    position: { x: 12 + 2 * (NODE_WIDTH + NODE_GAP), y: 48 },
    parentId: GROUP1_PARENT,
    extent: "parent",
    style: { width: NODE_WIDTH, height: NODE_HEIGHT },
  },
  {
    id: GROUP2_PARENT,
    data: { label: "部分二 (4个节点, 点击折叠/展开)" },
    position: { x: 0, y: 40 },
    style: { ...groupBoxStyle, width: W2_EXPANDED, height: H_EXPANDED },
  },
  {
    id: "4",
    data: { label: "4" },
    position: { x: 12, y: 48 },
    parentId: GROUP2_PARENT,
    extent: "parent",
    style: { width: NODE_WIDTH, height: NODE_HEIGHT },
  },
  {
    id: "5",
    data: { label: "5" },
    position: { x: 12 + NODE_WIDTH + NODE_GAP, y: 48 },
    parentId: GROUP2_PARENT,
    extent: "parent",
    style: { width: NODE_WIDTH, height: NODE_HEIGHT },
  },
  {
    id: "6",
    data: { label: "6" },
    position: { x: 12 + 2 * (NODE_WIDTH + NODE_GAP), y: 48 },
    parentId: GROUP2_PARENT,
    extent: "parent",
    style: { width: NODE_WIDTH, height: NODE_HEIGHT },
  },
  {
    id: "7",
    data: { label: "7" },
    position: { x: 12 + 3 * (NODE_WIDTH + NODE_GAP), y: 48 },
    parentId: GROUP2_PARENT,
    extent: "parent",
    style: { width: NODE_WIDTH, height: NODE_HEIGHT },
  },
  { id: "8", data: { label: "8" }, position: { x: 0, y: 65 }, style: { width: NODE_WIDTH, height: NODE_HEIGHT } },
  { id: "9", data: { label: "9" }, position: { x: NODE_WIDTH + NODE_GAP, y: 65 }, style: { width: NODE_WIDTH, height: NODE_HEIGHT } },
  { id: "10", data: { label: "10" }, position: { x: 2 * (NODE_WIDTH + NODE_GAP), y: 65 }, type: "output", style: { width: NODE_WIDTH, height: NODE_HEIGHT } },
]

const initialEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2" },
  { id: "e2-3", source: "2", target: "3" },
  { id: "e3-4", source: "3", target: "4" },
  { id: "e4-5", source: "4", target: "5" },
  { id: "e5-6", source: "5", target: "6" },
  { id: "e6-7", source: "6", target: "7" },
  { id: "e7-8", source: "7", target: "8" },
  { id: "e8-9", source: "8", target: "9" },
  { id: "e9-10", source: "9", target: "10" },
]

function shouldHideEdgeForGroup(edge: Edge, groupIds: string[]): boolean {
  return groupIds.includes(edge.source) || groupIds.includes(edge.target)
}

// ---------- 第二种：脑图树状收缩 ----------
const TREE_NODE_W = 120
const TREE_NODE_H = 32
const TREE_DX = 180
const TREE_DY = 60

const treeNodes: Node[] = [
  { id: "root", data: { label: "根 (点击折叠/展开全部)" }, position: { x: 40, y: 100 }, type: "input", style: { width: TREE_NODE_W, height: TREE_NODE_H } },
  { id: "A", data: { label: "A" }, position: { x: 40 + TREE_DX, y: 40 }, style: { width: TREE_NODE_W, height: TREE_NODE_H } },
  { id: "B", data: { label: "B" }, position: { x: 40 + TREE_DX, y: 100 }, style: { width: TREE_NODE_W, height: TREE_NODE_H } },
  { id: "C", data: { label: "C" }, position: { x: 40 + TREE_DX, y: 160 }, style: { width: TREE_NODE_W, height: TREE_NODE_H } },
  { id: "A1", data: { label: "A1" }, position: { x: 40 + 2 * TREE_DX, y: 20 }, style: { width: TREE_NODE_W, height: TREE_NODE_H } },
  { id: "A2", data: { label: "A2" }, position: { x: 40 + 2 * TREE_DX, y: 60 }, style: { width: TREE_NODE_W, height: TREE_NODE_H } },
  { id: "B1", data: { label: "B1" }, position: { x: 40 + 2 * TREE_DX, y: 100 }, style: { width: TREE_NODE_W, height: TREE_NODE_H } },
  { id: "C1", data: { label: "C1" }, position: { x: 40 + 2 * TREE_DX, y: 140 }, style: { width: TREE_NODE_W, height: TREE_NODE_H } },
  { id: "C2", data: { label: "C2" }, position: { x: 40 + 2 * TREE_DX, y: 180 }, style: { width: TREE_NODE_W, height: TREE_NODE_H } },
]

const treeEdges: Edge[] = [
  { id: "te-root-A", source: "root", target: "A" },
  { id: "te-root-B", source: "root", target: "B" },
  { id: "te-root-C", source: "root", target: "C" },
  { id: "te-A-A1", source: "A", target: "A1" },
  { id: "te-A-A2", source: "A", target: "A2" },
  { id: "te-B-B1", source: "B", target: "B1" },
  { id: "te-C-C1", source: "C", target: "C1" },
  { id: "te-C-C2", source: "C", target: "C2" },
]

const TREE_PARENT_CHILDREN: Record<string, string[]> = {
  root: ["A", "B", "C"],
  A: ["A1", "A2"],
  B: ["B1"],
  C: ["C1", "C2"],
}

function buildDescendantsMap(): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>()
  function collect(id: string): Set<string> {
    if (map.has(id)) return map.get(id)!
    const children = TREE_PARENT_CHILDREN[id] ?? []
    const set = new Set<string>()
    for (const c of children) {
      set.add(c)
      for (const d of collect(c)) set.add(d)
    }
    map.set(id, set)
    return set
  }
  for (const id of Object.keys(TREE_PARENT_CHILDREN)) collect(id)
  return map
}

const TREE_DESCENDANTS = buildDescendantsMap()

export default function TestCollapsePage() {
  const [edges] = useState<Edge[]>(initialEdges)
  const [group1Collapsed, setGroup1Collapsed] = useState(false)
  const [group2Collapsed, setGroup2Collapsed] = useState(false)
  const [collapsedTreeIds, setCollapsedTreeIds] = useState<Set<string>>(new Set())

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (node.id === GROUP1_PARENT) {
        setGroup1Collapsed((c) => !c)
      } else if (node.id === GROUP2_PARENT) {
        setGroup2Collapsed((c) => !c)
      }
    },
    []
  )

  const w1 = group1Collapsed ? W_COLLAPSED : W1_EXPANDED
  const h1 = group1Collapsed ? H_COLLAPSED : H_EXPANDED
  const w2 = group2Collapsed ? W_COLLAPSED : W2_EXPANDED
  const h2 = group2Collapsed ? H_COLLAPSED : H_EXPANDED
  const g1X = 30
  const g2X = g1X + w1 + GAP_BETWEEN_GROUPS
  const n8X = g2X + w2 + GAP_BETWEEN_GROUPS

  const nodesWithVisibility = useMemo(() => {
    return baseNodes.map((n) => {
      if (n.id === GROUP1_PARENT) {
        return { ...n, position: { x: g1X, y: 40 }, style: { ...groupBoxStyle, width: w1, height: h1 } }
      }
      if (n.id === GROUP2_PARENT) {
        return { ...n, position: { x: g2X, y: 40 }, style: { ...groupBoxStyle, width: w2, height: h2 } }
      }
      if (n.id === "8") return { ...n, position: { x: n8X, y: 65 } }
      if (n.id === "9") return { ...n, position: { x: n8X + NODE_WIDTH + NODE_GAP, y: 65 } }
      if (n.id === "10") return { ...n, position: { x: n8X + 2 * (NODE_WIDTH + NODE_GAP), y: 65 } }
      if (GROUP1_IDS.includes(n.id)) return { ...n, hidden: group1Collapsed }
      if (GROUP2_IDS.includes(n.id)) return { ...n, hidden: group2Collapsed }
      return n
    })
  }, [group1Collapsed, group2Collapsed])

  const edgesWithVisibility = useMemo(() => {
    const list: Edge[] = edges.map((e) => {
      const hideBy1 = shouldHideEdgeForGroup(e, GROUP1_IDS) && group1Collapsed
      const hideBy2 = shouldHideEdgeForGroup(e, GROUP2_IDS) && group2Collapsed
      return { ...e, hidden: hideBy1 || hideBy2 }
    })
    if (group1Collapsed) {
      list.push({
        id: "bridge-g1-next",
        source: GROUP1_PARENT,
        target: group2Collapsed ? GROUP2_PARENT : "4",
      })
    }
    if (group2Collapsed) {
      list.push({
        id: "bridge-prev-g2",
        source: group1Collapsed ? GROUP1_PARENT : "3",
        target: GROUP2_PARENT,
      })
      list.push({
        id: "bridge-g2-8",
        source: GROUP2_PARENT,
        target: "8",
      })
    }
    return list
  }, [edges, group1Collapsed, group2Collapsed])

  const onTreeNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setCollapsedTreeIds((prev) => {
      const next = new Set(prev)
      if (next.has(node.id)) next.delete(node.id)
      else next.add(node.id)
      return next
    })
  }, [])

  const hiddenTreeIds = useMemo(() => {
    const set = new Set<string>()
    collapsedTreeIds.forEach((id) => {
      const desc = TREE_DESCENDANTS.get(id)
      if (desc) desc.forEach((d) => set.add(d))
    })
    return set
  }, [collapsedTreeIds])

  const treeNodesWithVisibility = treeNodes.map((n) => ({
    ...n,
    hidden: hiddenTreeIds.has(n.id),
  }))
  const treeEdgesWithVisibility = treeEdges.map((e) => ({
    ...e,
    hidden: hiddenTreeIds.has(e.source) || hiddenTreeIds.has(e.target),
  }))

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header />
      <PageHeader
        title="测试折叠"
        description="第一种：分组框内折叠；第二种：脑图树状结构，点击节点可收缩/展开其全部子节点"
      />
      <div className="flex-1 min-h-0 flex flex-col px-6 pb-6">
        <Tabs defaultValue="mode1" className="flex flex-1 flex-col min-h-0">
          <TabsList className="mb-3 w-fit">
            <TabsTrigger value="mode1">第一种：分组框折叠</TabsTrigger>
            <TabsTrigger value="mode2">第二种：脑图树状收缩</TabsTrigger>
          </TabsList>
          <TabsContent value="mode1" className="flex-1 min-h-0 mt-0 data-[state=inactive]:hidden">
            <div className="h-full min-h-[400px] rounded-md border bg-background">
              <ReactFlow
                nodes={nodesWithVisibility}
                edges={edgesWithVisibility}
                onNodeClick={onNodeClick}
                fitView
                fitViewOptions={{ padding: 0.2 }}
              />
            </div>
          </TabsContent>
          <TabsContent value="mode2" className="flex-1 min-h-0 mt-0 data-[state=inactive]:hidden">
            <div className="h-full min-h-[400px] rounded-md border bg-background">
              <ReactFlow
                nodes={treeNodesWithVisibility}
                edges={treeEdgesWithVisibility}
                onNodeClick={onTreeNodeClick}
                fitView
                fitViewOptions={{ padding: 0.2 }}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

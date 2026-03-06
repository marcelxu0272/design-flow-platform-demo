"use client"

import { useCallback, useMemo } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  BackgroundVariant,
  MarkerType,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { useFlowStore } from "@/lib/stores/useFlowStore"
import { NodePropertiesPanel } from "./NodePropertiesPanel"
import ProcessNode from "./nodes/ProcessNode"
import DataSourceNode from "./nodes/DataSourceNode"
import OutputNode from "./nodes/OutputNode"
import DataFlowEdge from "./edges/DataFlowEdge"
import { useFlowKeyboardShortcuts } from "@/lib/hooks/useFlowKeyboardShortcuts"

const nodeTypes = {
  process: ProcessNode,
  data_source: DataSourceNode,
  output: OutputNode,
}

const edgeTypes = {
  data_flow: DataFlowEdge,
}

const defaultEdgeOptions = {
  type: "data_flow",
  markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8" },
}

function FlowEditorInner() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setSelectedNodeId,
    isReadOnly,
  } = useFlowStore()

  useFlowKeyboardShortcuts()

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: { id: string }) => {
      setSelectedNodeId(node.id)
    },
    [setSelectedNodeId]
  )

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null)
  }, [setSelectedNodeId])

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          nodesDraggable={!isReadOnly}
          nodesConnectable={!isReadOnly}
          elementsSelectable={true}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          className="bg-gray-50"
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
          <Controls showInteractive={false} />
          <MiniMap
            nodeStrokeWidth={2}
            zoomable
            pannable
            className="!bottom-4 !right-4"
          />
        </ReactFlow>
      </div>
      <NodePropertiesPanel />
    </div>
  )
}

export function FlowEditor() {
  return (
    <ReactFlowProvider>
      <FlowEditorInner />
    </ReactFlowProvider>
  )
}

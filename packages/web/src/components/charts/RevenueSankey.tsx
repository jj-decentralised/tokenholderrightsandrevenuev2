"use client";

import { useMemo, useState, useCallback } from "react";
import type { SankeyData } from "@/lib/analytics/revenue-flow";

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 380;
const NODE_WIDTH = 16;
const NODE_PADDING = 24;
const MARGIN = { top: 20, right: 160, bottom: 20, left: 20 };

interface ProcessedNode {
  id: string;
  label: string;
  value: number;
  color: string;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  depth: number;
}

interface ProcessedLink {
  source: ProcessedNode;
  target: ProcessedNode;
  value: number;
  percentage?: number;
  width: number;
  sy0: number;
  sy1: number;
  ty0: number;
  ty1: number;
}

function formatUSDCompact(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function layoutSankey(data: SankeyData): { nodes: ProcessedNode[]; links: ProcessedLink[] } {
  // Assign depth based on links
  const nodeMap = new Map<string, ProcessedNode>();
  const incomingLinks = new Map<string, string[]>();
  const outgoingLinks = new Map<string, string[]>();

  data.nodes.forEach((n) => {
    nodeMap.set(n.id, {
      ...n,
      color: n.color || "#32b88d",
      x0: 0, x1: 0, y0: 0, y1: 0,
      depth: 0,
    });
    incomingLinks.set(n.id, []);
    outgoingLinks.set(n.id, []);
  });

  data.links.forEach((l) => {
    outgoingLinks.get(l.source)?.push(l.target);
    incomingLinks.get(l.target)?.push(l.source);
  });

  // BFS to assign depth
  const roots = data.nodes.filter((n) => (incomingLinks.get(n.id)?.length || 0) === 0);
  const queue = roots.map((r) => ({ id: r.id, depth: 0 }));
  const visited = new Set<string>();

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const node = nodeMap.get(id)!;
    node.depth = depth;
    outgoingLinks.get(id)?.forEach((targetId) => {
      if (!visited.has(targetId)) {
        queue.push({ id: targetId, depth: depth + 1 });
      }
    });
  }

  // Group by depth
  const maxDepth = Math.max(...Array.from(nodeMap.values()).map((n) => n.depth));
  const depthGroups: ProcessedNode[][] = Array.from({ length: maxDepth + 1 }, () => []);
  nodeMap.forEach((n) => depthGroups[n.depth].push(n));

  // Layout x positions
  const innerWidth = CANVAS_WIDTH - MARGIN.left - MARGIN.right;
  const innerHeight = CANVAS_HEIGHT - MARGIN.top - MARGIN.bottom;

  depthGroups.forEach((group, depth) => {
    const x = MARGIN.left + (maxDepth > 0 ? (depth / maxDepth) * (innerWidth - NODE_WIDTH) : 0);
    group.forEach((node) => {
      node.x0 = x;
      node.x1 = x + NODE_WIDTH;
    });
  });

  // Layout y positions
  const maxNodeValue = Math.max(...data.nodes.map((n) => n.value));

  depthGroups.forEach((group) => {
    const totalValue = group.reduce((sum, n) => sum + n.value, 0);
    const scale = totalValue > 0 ? (innerHeight - (group.length - 1) * NODE_PADDING) / totalValue : 1;
    let y = MARGIN.top;
    group.forEach((node) => {
      const height = Math.max(4, node.value * scale);
      node.y0 = y;
      node.y1 = y + height;
      y += height + NODE_PADDING;
    });

    // Center vertically
    const totalHeight = y - NODE_PADDING - MARGIN.top;
    const offset = (innerHeight - totalHeight) / 2;
    if (offset > 0) {
      group.forEach((node) => {
        node.y0 += offset;
        node.y1 += offset;
      });
    }
  });

  // Process links with vertical offsets
  const sourceOffsets = new Map<string, number>();
  const targetOffsets = new Map<string, number>();
  nodeMap.forEach((n) => {
    sourceOffsets.set(n.id, n.y0);
    targetOffsets.set(n.id, n.y0);
  });

  const processedLinks: ProcessedLink[] = data.links.map((l) => {
    const source = nodeMap.get(l.source)!;
    const target = nodeMap.get(l.target)!;
    const sourceHeight = source.y1 - source.y0;
    const targetHeight = target.y1 - target.y0;
    const sourceTotal = data.links
      .filter((ll) => ll.source === l.source)
      .reduce((sum, ll) => sum + ll.value, 0);
    const targetTotal = data.links
      .filter((ll) => ll.target === l.target)
      .reduce((sum, ll) => sum + ll.value, 0);

    const sRatio = sourceTotal > 0 ? l.value / sourceTotal : 0;
    const tRatio = targetTotal > 0 ? l.value / targetTotal : 0;
    const width = Math.max(2, sRatio * sourceHeight);

    const sy0 = sourceOffsets.get(l.source)!;
    const ty0 = targetOffsets.get(l.target)!;

    sourceOffsets.set(l.source, sy0 + width);
    targetOffsets.set(l.target, ty0 + tRatio * targetHeight);

    return {
      source,
      target,
      value: l.value,
      percentage: l.percentage,
      width,
      sy0,
      sy1: sy0 + width,
      ty0,
      ty1: ty0 + tRatio * targetHeight,
    };
  });

  return { nodes: Array.from(nodeMap.values()), links: processedLinks };
}

function linkPath(link: ProcessedLink): string {
  const sx = link.source.x1;
  const tx = link.target.x0;
  const midX = (sx + tx) / 2;
  const sy = (link.sy0 + link.sy1) / 2;
  const ty = (link.ty0 + link.ty1) / 2;

  return `M${sx},${sy} C${midX},${sy} ${midX},${ty} ${tx},${ty}`;
}

interface RevenueSankeyProps {
  data: SankeyData;
  className?: string;
}

export function RevenueSankey({ data, className }: RevenueSankeyProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredLink, setHoveredLink] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);

  const { nodes, links } = useMemo(() => layoutSankey(data), [data]);

  const isConnected = useCallback(
    (nodeId: string): boolean => {
      if (!hoveredNode) return true;
      if (nodeId === hoveredNode) return true;
      return links.some(
        (l) =>
          (l.source.id === hoveredNode && l.target.id === nodeId) ||
          (l.target.id === hoveredNode && l.source.id === nodeId)
      );
    },
    [hoveredNode, links]
  );

  const isLinkConnected = useCallback(
    (link: ProcessedLink): boolean => {
      if (!hoveredNode) return true;
      return link.source.id === hoveredNode || link.target.id === hoveredNode;
    },
    [hoveredNode]
  );

  return (
    <div className={className} style={{ position: "relative" }}>
      <svg
        viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
        className="w-full h-auto"
        style={{ maxHeight: 380 }}
      >
        {/* Links */}
        {links.map((link, i) => (
          <path
            key={i}
            d={linkPath(link)}
            fill="none"
            stroke={link.source.color}
            strokeWidth={Math.max(2, link.width)}
            strokeOpacity={
              hoveredLink === i ? 0.6 : hoveredNode ? (isLinkConnected(link) ? 0.35 : 0.08) : 0.25
            }
            style={{ transition: "stroke-opacity 0.2s" }}
            onMouseEnter={(e) => {
              setHoveredLink(i);
              setTooltip({
                x: e.clientX,
                y: e.clientY,
                content: `${link.source.label} → ${link.target.label}: ${formatUSDCompact(link.value)}${link.percentage ? ` (${link.percentage.toFixed(1)}%)` : ""}`,
              });
            }}
            onMouseLeave={() => {
              setHoveredLink(null);
              setTooltip(null);
            }}
          />
        ))}

        {/* Nodes */}
        {nodes.map((node) => (
          <g key={node.id}>
            <rect
              x={node.x0}
              y={node.y0}
              width={node.x1 - node.x0}
              height={Math.max(4, node.y1 - node.y0)}
              rx={3}
              fill={node.color}
              opacity={hoveredNode ? (isConnected(node.id) ? 1 : 0.2) : 0.9}
              style={{ transition: "opacity 0.2s", cursor: "pointer" }}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
            />
            <text
              x={node.x1 + 8}
              y={(node.y0 + node.y1) / 2 - 7}
              fontSize={12}
              fontWeight={500}
              fill="#133c3b"
              opacity={hoveredNode ? (isConnected(node.id) ? 1 : 0.25) : 1}
              style={{ transition: "opacity 0.2s" }}
            >
              {node.label}
            </text>
            <text
              x={node.x1 + 8}
              y={(node.y0 + node.y1) / 2 + 7}
              fontSize={11}
              fill="#626c71"
              opacity={hoveredNode ? (isConnected(node.id) ? 1 : 0.25) : 1}
              style={{ transition: "opacity 0.2s", fontVariantNumeric: "tabular-nums" }}
            >
              {formatUSDCompact(node.value)}
            </text>
          </g>
        ))}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 px-3 py-2 text-xs bg-white border border-[#e5e5e3] rounded-lg shadow-lg text-[#133c3b] pointer-events-none"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y - 24,
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
}

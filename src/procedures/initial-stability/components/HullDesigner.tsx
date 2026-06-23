import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Minus,
  Plus,
  RotateCcw,
  Undo2,
  Redo2,
  Magnet,
  Trash2,
  Save,
  X,
  Link2,
  Unlink2,
  Ruler,
  Anchor,
  Ship,
  type LucideIcon,
} from 'lucide-react'
import { useCustomHullStore } from '../customHullStore'
import {
  cloneCustomHullDesign,
  createDefaultCustomHullDesign,
  CUSTOM_HULL_MIN_NODES,
  CUSTOM_HULL_SNAP_M,
  enforceStarboardNode,
  sampleCustomHullOutline,
  hasCustomKeelAppendage,
  sampleStarboardHalf,
  snapCoord,
  deriveHullParams,
  validateCustomHullDesign,
  applyLinkedHandlePatch,
  breakNodeHandles,
  clearNodeHandles,
  defaultHandlesForNode,
  isNodeHandlesLinked,
  linkNodeHandles,
  nodeHasBezierHandles,
  type CubicBezierNode,
  type CustomHullDesign,
} from '../sim/custom-hull'
import type { Vec2 } from '../sim/types'
import { useStability } from '../store'
import { HelpPopover } from './HelpPopover'
import {
  computeEditorDimensionSpecs,
  DESIGN_DIM_MUTED_OPACITY,
  DimensionLabels,
  DimensionLines,
} from './dimension-overlay'

const SVG_W = 640
const SVG_H = 520
const PAD = 56
const ZOOM_MIN = 0.2
const ZOOM_MAX = 24
const HANDLE_R = 1.5
const HANDLE_R_HOVER = 1.85
const HANDLE_R_SELECTED = 2
const HANDLE_HIT_R = 3.25
const HANDLE_HIT_R_SELECTED = 4
const INSERT_HIT_STROKE = 18
const ANCHOR_R = 2.5
const ANCHOR_R_HOVER = 2.9
const ANCHOR_R_SELECTED = 3.25
const ANCHOR_HIT_R = 5
const ANCHOR_RING_PAD = 1.5
const VERTEX_TOOL_R = 5
const VERTEX_TOOL_HIT_R = 7
const VERTEX_TOOL_ICON = 4.9
const VERTEX_TOOL_STEP = 12
const INLINE_TOOL_GAP = 5

function inlineToolOrigin(pointR: number): { x: number; y: number } {
  return { x: pointR + VERTEX_TOOL_R + INLINE_TOOL_GAP, y: 0 }
}

function handleVisualR(selected: boolean, hovered: boolean): number {
  if (selected) return HANDLE_R_SELECTED
  if (hovered) return HANDLE_R_HOVER
  return HANDLE_R
}

const NON_SCALING = { vectorEffect: 'non-scaling-stroke' as const }

type DesignerToolBtnProps = {
  x: number
  y: number
  label: string
  active?: boolean
  disabled?: boolean
  tone?: 'default' | 'danger'
  onClick: () => void
  icon: LucideIcon
}

function DesignerToolBtn({
  x,
  y,
  label,
  active,
  disabled,
  tone = 'default',
  onClick,
  icon: Icon,
}: DesignerToolBtnProps) {
  const half = VERTEX_TOOL_ICON / 2
  return (
    <g
      className={`is-designer__vertex-tool${active ? ' is-designer__vertex-tool--active' : ''}${
        disabled ? ' is-designer__vertex-tool--disabled' : ''
      }${tone === 'danger' ? ' is-designer__vertex-tool--danger' : ''}`}
      transform={`translate(${x}, ${y})`}
      onPointerDown={(e) => {
        e.stopPropagation()
        if (!disabled) onClick()
      }}
      pointerEvents={disabled ? 'none' : 'all'}
    >
      <title>{label}</title>
      <circle r={VERTEX_TOOL_HIT_R} className="is-designer__vertex-tool-hit" fill="transparent" />
      <circle r={VERTEX_TOOL_R} className="is-designer__vertex-tool-bg" pointerEvents="none" {...NON_SCALING} />
      <g transform={`translate(${-half}, ${-half})`} pointerEvents="none">
        <Icon size={VERTEX_TOOL_ICON} strokeWidth={2} />
      </g>
    </g>
  )
}

function InlineToolRow({
  origin,
  zoom,
  children,
}: {
  origin: { sx: number; sy: number }
  zoom: number
  children: ReactNode
}) {
  return (
    <g
      className="is-designer__vertex-popover"
      transform={`translate(${origin.sx}, ${origin.sy}) scale(${1 / zoom})`}
      pointerEvents="none"
    >
      <g pointerEvents="all">{children}</g>
    </g>
  )
}

type ViewTransform = {
  scale: number
  cx: number
  cy: number
  flip: (x: number, z: number) => { sx: number; sy: number }
}

type DragTarget =
  | { kind: 'anchor'; index: number }
  | { kind: 'anchors'; indices: number[] }
  | { kind: 'handleIn'; index: number }
  | { kind: 'handleOut'; index: number }
  | { kind: 'waterline' }
  | null

type InsertHover = {
  segmentIndex: number
  t: number
  world: Vec2
  /** Root SVG viewBox coords — rendered outside the pan/zoom group. */
  rootSx: number
  rootSy: number
}

type HoverHandle = { index: number; kind: 'handleIn' | 'handleOut' }

type DesignerSnapshot = {
  nodes: CubicBezierNode[]
  designWaterlineZ: number
  name: string
}

function cloneNodes(nodes: CubicBezierNode[]): CubicBezierNode[] {
  return nodes.map((n) => ({
    anchor: { ...n.anchor },
    handleIn: { ...n.handleIn },
    handleOut: { ...n.handleOut },
    handlesLinked: n.handlesLinked ?? true,
    region: n.region ?? 'hull',
  }))
}

function isKeelNode(node: CubicBezierNode): boolean {
  return (node.region ?? 'hull') === 'keel'
}

/** Fixed design canvas in meters — camera does not refit while editing. */
const DESIGN_X_HALF = 3.2
const DESIGN_Z_MIN = -2.2
const DESIGN_Z_MAX = 3.2

function buildFixedDesignerView(): ViewTransform {
  const w = DESIGN_X_HALF * 2 + 0.4
  const h = DESIGN_Z_MAX - DESIGN_Z_MIN
  const cx = 0
  const cy = (DESIGN_Z_MIN + DESIGN_Z_MAX) / 2
  const scale = Math.min((SVG_W - PAD * 2) / w, (SVG_H - PAD * 2) / Math.max(h, 0.5))
  const flip = (x: number, z: number) => ({
    sx: SVG_W / 2 + (x - cx) * scale,
    sy: SVG_H / 2 - (z - cy) * scale,
  })
  return { scale, cx, cy, flip }
}

const FIXED_DESIGNER_VIEW = buildFixedDesignerView()

/** Visible viewBox region when SVG uses preserveAspectRatio slice (matches HullDiagram). */
function visibleViewBoxRect(viewportAspect: number): {
  sxMin: number
  sxMax: number
  syMin: number
  syMax: number
} {
  const viewBoxAspect = SVG_W / SVG_H
  if (viewportAspect > viewBoxAspect) {
    const w = SVG_H * viewportAspect
    return { sxMin: (SVG_W - w) / 2, sxMax: (SVG_W + w) / 2, syMin: 0, syMax: SVG_H }
  }
  const h = SVG_W / viewportAspect
  return { sxMin: 0, sxMax: SVG_W, syMin: (SVG_H - h) / 2, syMax: (SVG_H + h) / 2 }
}

function gridBoundsForViewport(
  view: ViewTransform,
  zoom: number,
  pan: { x: number; y: number },
  svgClientW: number,
  svgClientH: number,
): { xMin: number; xMax: number; zMin: number; zMax: number } {
  const viewportAspect =
    svgClientW > 0 && svgClientH > 0 ? svgClientW / svgClientH : SVG_W / SVG_H
  const { sxMin, sxMax, syMin, syMax } = visibleViewBoxRect(viewportAspect)
  const sampleSx = [sxMin, (sxMin + sxMax) / 2, sxMax]
  const sampleSy = [syMin, (syMin + syMax) / 2, syMax]
  let xMin = Infinity
  let xMax = -Infinity
  let zMin = Infinity
  let zMax = -Infinity
  for (const sx of sampleSx) {
    for (const sy of sampleSy) {
      const p = screenToWorld(sx, sy, view, zoom, pan)
      xMin = Math.min(xMin, p.x)
      xMax = Math.max(xMax, p.x)
      zMin = Math.min(zMin, p.z)
      zMax = Math.max(zMax, p.z)
    }
  }
  const margin = Math.max(2.5, Math.max(xMax - xMin, zMax - zMin) * 0.35)
  return {
    xMin: xMin - margin,
    xMax: xMax + margin,
    zMin: zMin - margin,
    zMax: zMax + margin,
  }
}

function panZoomTransform(zoom: number, pan: { x: number; y: number }) {
  return `translate(${SVG_W / 2 + pan.x}, ${SVG_H / 2 + pan.y}) scale(${zoom}) translate(${-SVG_W / 2}, ${-SVG_H / 2})`
}

function zoomAtPoint(
  zoom: number,
  pan: { x: number; y: number },
  focalSx: number,
  focalSy: number,
  factor: number,
): { zoom: number; pan: { x: number; y: number } } {
  const cx = SVG_W / 2
  const cy = SVG_H / 2
  const newZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom * factor))
  const contentX = (focalSx - cx - pan.x) / zoom + cx
  const contentY = (focalSy - cy - pan.y) / zoom + cy
  return {
    zoom: newZoom,
    pan: {
      x: focalSx - (contentX - cx) * newZoom - cx,
      y: focalSy - (contentY - cy) * newZoom - cy,
    },
  }
}

function screenToWorld(
  sx: number,
  sy: number,
  view: ViewTransform,
  zoom: number,
  pan: { x: number; y: number },
): Vec2 {
  const cx = SVG_W / 2
  const cy = SVG_H / 2
  const contentSx = (sx - cx - pan.x) / zoom + cx
  const contentSy = (sy - cy - pan.y) / zoom + cy
  return {
    x: (contentSx - SVG_W / 2) / view.scale + view.cx,
    z: -(contentSy - SVG_H / 2) / view.scale + view.cy,
  }
}

function clientToViewBox(svg: SVGSVGElement, clientX: number, clientY: number): { sx: number; sy: number } {
  const pt = svg.createSVGPoint()
  pt.x = clientX
  pt.y = clientY
  const ctm = svg.getScreenCTM()
  if (!ctm) {
    const rect = svg.getBoundingClientRect()
    return {
      sx: ((clientX - rect.left) / rect.width) * SVG_W,
      sy: ((clientY - rect.top) / rect.height) * SVG_H,
    }
  }
  const p = pt.matrixTransform(ctm.inverse())
  return { sx: p.x, sy: p.y }
}

function pointerRootSvg(e: React.PointerEvent, svg: SVGSVGElement): { sx: number; sy: number } {
  return clientToViewBox(svg, e.clientX, e.clientY)
}

function isSelectModifier(e: { metaKey: boolean; ctrlKey: boolean }) {
  return e.metaKey || e.ctrlKey
}

function anchorRootScreen(
  flip: ViewTransform['flip'],
  zoom: number,
  pan: { x: number; y: number },
  anchor: Vec2,
): { sx: number; sy: number } {
  const { sx: contentSx, sy: contentSy } = flip(anchor.x, anchor.z)
  const cx = SVG_W / 2
  const cy = SVG_H / 2
  return {
    sx: (contentSx - cx) * zoom + cx + pan.x,
    sy: (contentSy - cy) * zoom + cy + pan.y,
  }
}

function anchorIndicesInMarquee(
  nodes: CubicBezierNode[],
  view: ViewTransform,
  zoom: number,
  pan: { x: number; y: number },
  rect: { sxMin: number; sxMax: number; syMin: number; syMax: number },
): number[] {
  const hits: number[] = []
  nodes.forEach((n, i) => {
    const { sx, sy } = anchorRootScreen(view.flip, zoom, pan, n.anchor)
    if (sx >= rect.sxMin && sx <= rect.sxMax && sy >= rect.syMin && sy <= rect.syMax) {
      hits.push(i)
    }
  })
  return hits.sort((a, b) => a - b)
}

function isContiguousSelection(indices: number[]): boolean {
  if (indices.length < 2) return false
  const sorted = [...indices].sort((a, b) => a - b)
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] !== sorted[i - 1] + 1) return false
  }
  return true
}

function canMarkSelectionAsKeel(indices: number[], nodeCount: number): boolean {
  if (indices.length < 2 || !isContiguousSelection(indices)) return false
  return indices.includes(0) && Math.max(...indices) < nodeCount - 1
}

function canMarkSelectionAsHull(indices: number[]): boolean {
  return indices.length >= 2 && isContiguousSelection(indices)
}

function absSegmentControls(nodes: CubicBezierNode[], i: number) {
  const a = nodes[i].anchor
  const b = nodes[i + 1].anchor
  return {
    p0: a,
    p1: { x: a.x + nodes[i].handleOut.x, z: a.z + nodes[i].handleOut.z },
    p2: { x: b.x + nodes[i + 1].handleIn.x, z: b.z + nodes[i + 1].handleIn.z },
    p3: b,
  }
}

function cubicAt(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2, t: number): Vec2 {
  const u = 1 - t
  const u2 = u * u
  const u3 = u2 * u
  const t2 = t * t
  const t3 = t2 * t
  return {
    x: u3 * p0.x + 3 * u2 * t * p1.x + 3 * u * t2 * p2.x + t3 * p3.x,
    z: u3 * p0.z + 3 * u2 * t * p1.z + 3 * u * t2 * p2.z + t3 * p3.z,
  }
}

function segmentPathScreen(nodes: CubicBezierNode[], i: number, view: ViewTransform): string {
  const a = nodes[i].anchor
  const b = nodes[i + 1].anchor
  const c1 = view.flip(a.x + nodes[i].handleOut.x, a.z + nodes[i].handleOut.z)
  const c2 = view.flip(b.x + nodes[i + 1].handleIn.x, b.z + nodes[i + 1].handleIn.z)
  const end = view.flip(b.x, b.z)
  const start = view.flip(a.x, a.z)
  return `M ${start.sx.toFixed(1)} ${start.sy.toFixed(1)} C ${c1.sx.toFixed(1)} ${c1.sy.toFixed(1)}, ${c2.sx.toFixed(1)} ${c2.sy.toFixed(1)}, ${end.sx.toFixed(1)} ${end.sy.toFixed(1)}`
}

function closestOnSegment(
  nodes: CubicBezierNode[],
  segmentIndex: number,
  world: Vec2,
): { t: number; world: Vec2; dist: number } {
  const { p0, p1, p2, p3 } = absSegmentControls(nodes, segmentIndex)
  let bestT = 0.5
  let bestDist = Infinity
  let bestWorld = cubicAt(p0, p1, p2, p3, 0.5)
  for (let s = 0; s <= 32; s++) {
    const t = s / 32
    const pt = cubicAt(p0, p1, p2, p3, t)
    const dist = Math.hypot(pt.x - world.x, pt.z - world.z)
    if (dist < bestDist) {
      bestDist = dist
      bestT = t
      bestWorld = pt
    }
  }
  return { t: bestT, world: bestWorld, dist: bestDist }
}

function toPath(pts: { sx: number; sy: number }[]): string {
  if (pts.length < 2) return ''
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.sx.toFixed(1)} ${p.sy.toFixed(1)}`).join(' ') + ' Z'
}

const GRID_STEPS_M = [0.05, 0.1, 0.2, 0.25, 0.5, 1, 2, 5, 10] as const
const GRID_MAX_LINES = 70

function majorGridStep(minor: number): number {
  if (minor <= 0.05) return 0.25
  if (minor <= 0.1) return 0.5
  if (minor <= 0.2) return 1
  if (minor <= 0.25) return 1
  if (minor <= 0.5) return 2
  if (minor <= 1) return 5
  return minor * 5
}

function pickGridSpacing(
  xMin: number,
  xMax: number,
  zMin: number,
  zMax: number,
): { minor: number; major: number } {
  const maxSpan = Math.max(xMax - xMin, zMax - zMin)
  for (const minor of GRID_STEPS_M) {
    if (maxSpan / minor <= GRID_MAX_LINES) {
      return { minor, major: majorGridStep(minor) }
    }
  }
  const minor = GRID_STEPS_M[GRID_STEPS_M.length - 1]
  return { minor, major: majorGridStep(minor) }
}

function buildGridPaths(
  view: ViewTransform,
  xMin: number,
  xMax: number,
  zMin: number,
  zMax: number,
  major: number,
  minor: number,
): { minorPath: string; majorPath: string } {
  let minorPath = ''
  let majorPath = ''
  const xStart = Math.floor(xMin / minor) * minor
  const xEnd = Math.ceil(xMax / minor) * minor
  const zStart = Math.floor(zMin / minor) * minor
  const zEnd = Math.ceil(zMax / minor) * minor

  for (let v = xStart; v <= xEnd + minor * 0.5; v += minor) {
    const isMajor = Math.abs(v / major - Math.round(v / major)) < 1e-6
    const a = view.flip(v, zMin)
    const b = view.flip(v, zMax)
    const seg = `M${a.sx.toFixed(1)},${a.sy.toFixed(1)}L${b.sx.toFixed(1)},${b.sy.toFixed(1)}`
    if (isMajor) majorPath += seg
    else minorPath += seg
  }
  for (let v = zStart; v <= zEnd + minor * 0.5; v += minor) {
    const isMajor = Math.abs(v / major - Math.round(v / major)) < 1e-6
    const a = view.flip(xMin, v)
    const b = view.flip(xMax, v)
    const seg = `M${a.sx.toFixed(1)},${a.sy.toFixed(1)}L${b.sx.toFixed(1)},${b.sy.toFixed(1)}`
    if (isMajor) majorPath += seg
    else minorPath += seg
  }
  return { minorPath, majorPath }
}

const DesignerGrid = memo(function DesignerGrid({
  view,
  xMin,
  xMax,
  zMin,
  zMax,
}: {
  view: ViewTransform
  xMin: number
  xMax: number
  zMin: number
  zMax: number
}) {
  const { minorPath, majorPath } = useMemo(() => {
    const { minor, major } = pickGridSpacing(xMin, xMax, zMin, zMax)
    return buildGridPaths(view, xMin, xMax, zMin, zMax, major, minor)
  }, [view, xMin, xMax, zMin, zMax])

  return (
    <g className="is-diagram__grid" pointerEvents="none">
      {minorPath && (
        <path
          d={minorPath}
          fill="none"
          stroke="rgba(203, 213, 225, 0.126)"
          strokeWidth={0.5}
          {...NON_SCALING}
        />
      )}
      {majorPath && (
        <path
          d={majorPath}
          fill="none"
          stroke="rgba(203, 213, 225, 0.288)"
          strokeWidth={0.75}
          {...NON_SCALING}
        />
      )}
    </g>
  )
})

export function HullDesigner() {
  const designerEditId = useStability((s) => s.designerEditId)
  const closeDesigner = useStability((s) => s.closeDesigner)
  const setCustomHull = useStability((s) => s.setCustomHull)
  const config = useStability((s) => s.config)
  const setHullType = useStability((s) => s.setHullType)
  const getDesign = useCustomHullStore((s) => s.get)
  const saveDesign = useCustomHullStore((s) => s.save)
  const removeDesign = useCustomHullStore((s) => s.remove)

  const initial = useMemo(() => {
    if (designerEditId) {
      const existing = getDesign(designerEditId)
      if (existing) return cloneCustomHullDesign(existing)
    }
    return createDefaultCustomHullDesign()
  }, [designerEditId, getDesign])

  const [nodes, setNodes] = useState<CubicBezierNode[]>(() => cloneNodes(initial.nodes))
  const [designWaterlineZ, setDesignWaterlineZ] = useState(initial.designWaterlineZ)
  const [name, setName] = useState(initial.name)
  const [designId] = useState(initial.id)
  const [snapEnabled, setSnapEnabled] = useState(true)
  const [showDimensions, setShowDimensions] = useState(true)
  const [hoveredDimId, setHoveredDimId] = useState<string | null>(null)
  const [selected, setSelected] = useState<DragTarget>(null)
  const [selectedAnchors, setSelectedAnchors] = useState<number[]>([])
  const [marquee, setMarquee] = useState<{ sx0: number; sy0: number; sx1: number; sy1: number } | null>(null)
  const [hoverWaterline, setHoverWaterline] = useState(false)
  const [hoverAnchorIndex, setHoverAnchorIndex] = useState<number | null>(null)
  const [hoverHandle, setHoverHandle] = useState<HoverHandle | null>(null)
  const [insertHover, setInsertHover] = useState<InsertHover | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const [svgSize, setSvgSize] = useState({ w: SVG_W, h: SVG_H })

  const spaceDownRef = useRef(false)

  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const zoomPanRef = useRef({ zoom: 1, pan: { x: 0, y: 0 } })
  zoomPanRef.current = { zoom, pan }

  const historyRef = useRef<{ past: DesignerSnapshot[]; future: DesignerSnapshot[] }>({
    past: [],
    future: [],
  })

  const svgRef = useRef<SVGSVGElement>(null)
  const panGroupRef = useRef<SVGGElement>(null)
  const dragRef = useRef<{
    target: DragTarget
    startWorld: Vec2
    startClientX: number
    startClientY: number
    snapshot: DesignerSnapshot
    view: ViewTransform
  } | null>(null)
  const panRef = useRef<{
    clientX: number
    clientY: number
    panX: number
    panY: number
    livePan?: { x: number; y: number }
  } | null>(null)
  const marqueeRef = useRef<{ sx0: number; sy0: number; pointerId: number } | null>(null)

  const applyPanZoomTransform = useCallback(
    (nextPan: { x: number; y: number }, nextZoom = zoom) => {
      panGroupRef.current?.setAttribute('transform', panZoomTransform(nextZoom, nextPan))
    },
    [zoom],
  )

  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      if (width > 0 && height > 0) setSvgSize({ w: width, h: height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const shouldPan = (e: React.PointerEvent) =>
    e.button === 1 ||
    e.button === 2 ||
    (e.button === 0 && (spaceDownRef.current || e.altKey))

  const startPan = (e: React.PointerEvent) => {
    e.preventDefault()
    const svg = svgRef.current
    if (!svg) return
    panRef.current = { clientX: e.clientX, clientY: e.clientY, panX: pan.x, panY: pan.y }
    setInsertHover(null)
    setHoverHandle(null)
    setIsPanning(true)
    svg.setPointerCapture(e.pointerId)
  }

  const startMarquee = (e: React.PointerEvent) => {
    e.preventDefault()
    const svg = svgRef.current
    if (!svg) return
    const { sx, sy } = pointerRootSvg(e, svg)
    marqueeRef.current = { sx0: sx, sy0: sy, pointerId: e.pointerId }
    setMarquee({ sx0: sx, sy0: sy, sx1: sx, sy1: sy })
    setInsertHover(null)
    setHoverHandle(null)
    svg.setPointerCapture(e.pointerId)
  }

  const clearAnchorSelection = () => {
    setSelectedAnchors([])
    setSelected(null)
    setHoverAnchorIndex(null)
  }

  const handleAnchorPointerDown = (e: React.PointerEvent, index: number) => {
    if (shouldPan(e)) {
      startPan(e)
      return
    }
    e.stopPropagation()
    if (isSelectModifier(e)) {
      setSelectedAnchors((prev) => {
        const next = prev.includes(index)
          ? prev.filter((i) => i !== index)
          : [...prev, index].sort((a, b) => a - b)
        if (next.length >= 2) {
          setSelected(null)
        } else if (next.length === 1) {
          setSelected({ kind: 'anchor', index: next[0] })
        } else {
          setSelected(null)
        }
        return next
      })
      return
    }
    if (selectedAnchors.length >= 2 && selectedAnchors.includes(index)) {
      beginGroupDrag(e, selectedAnchors)
      return
    }
    setSelectedAnchors([index])
    beginDrag(e, { kind: 'anchor', index })
  }

  const pushHistory = useCallback(() => {
    historyRef.current.past.push({ nodes: cloneNodes(nodes), designWaterlineZ, name })
    historyRef.current.future = []
    if (historyRef.current.past.length > 40) historyRef.current.past.shift()
  }, [nodes, designWaterlineZ, name])

  const applySnapshot = (snap: DesignerSnapshot) => {
    setNodes(cloneNodes(snap.nodes))
    setDesignWaterlineZ(snap.designWaterlineZ)
    setName(snap.name)
    setDirty(true)
    setError(null)
  }

  const undo = () => {
    const { past, future } = historyRef.current
    if (past.length === 0) return
    future.push({ nodes: cloneNodes(nodes), designWaterlineZ, name })
    const prev = past.pop()!
    applySnapshot(prev)
  }

  const redo = () => {
    const { past, future } = historyRef.current
    if (future.length === 0) return
    past.push({ nodes: cloneNodes(nodes), designWaterlineZ, name })
    const next = future.pop()!
    applySnapshot(next)
  }

  const view = FIXED_DESIGNER_VIEW

  const gridBounds = useMemo(
    () => gridBoundsForViewport(view, zoom, pan, svgSize.w, svgSize.h),
    [view, zoom, pan.x, pan.y, svgSize.w, svgSize.h],
  )

  const designDraft = useMemo(
    () => ({
      id: '',
      name: '',
      nodes,
      designWaterlineZ,
      createdAt: 0,
      updatedAt: 0,
    }),
    [nodes, designWaterlineZ],
  )

  const portGhostPath = useMemo(() => {
    const starboard = sampleStarboardHalf({
      id: '',
      name: '',
      nodes,
      designWaterlineZ,
      createdAt: 0,
      updatedAt: 0,
    })
    const port = starboard
      .slice(1, -1)
      .map((p) => view.flip(-p.x, p.z))
      .reverse()
    if (port.length < 2) return ''
    return toPath([view.flip(starboard[0].x, starboard[0].z), ...port, view.flip(starboard[starboard.length - 1].x, starboard[starboard.length - 1].z)])
  }, [nodes, designWaterlineZ, view])

  const sampledHullPreview = useMemo(
    () => sampleCustomHullOutline(designDraft).map((p) => view.flip(p.x, p.z)),
    [designDraft, view],
  )

  const hasKeelRegion = hasCustomKeelAppendage(designDraft)

  const beginDrag = (e: React.PointerEvent, target: DragTarget) => {
    if (shouldPan(e)) {
      startPan(e)
      return
    }
    e.stopPropagation()
    const svg = svgRef.current
    if (!svg) return
    const { sx, sy } = pointerRootSvg(e, svg)
    pushHistory()
    dragRef.current = {
      target,
      startWorld: screenToWorld(sx, sy, view, zoom, pan),
      startClientX: e.clientX,
      startClientY: e.clientY,
      snapshot: { nodes: cloneNodes(nodes), designWaterlineZ, name },
      view: { ...view, flip: view.flip },
    }
    if (target?.kind === 'anchor' || target?.kind === 'handleIn' || target?.kind === 'handleOut') {
      setSelected(target)
    }
    setInsertHover(null)
    setHoverAnchorIndex(null)
    setHoverHandle(null)
    svg.setPointerCapture(e.pointerId)
  }

  const beginGroupDrag = (e: React.PointerEvent, indices: number[]) => {
    if (shouldPan(e)) {
      startPan(e)
      return
    }
    e.stopPropagation()
    const svg = svgRef.current
    if (!svg) return
    const { sx, sy } = pointerRootSvg(e, svg)
    pushHistory()
    dragRef.current = {
      target: { kind: 'anchors', indices: [...indices] },
      startWorld: screenToWorld(sx, sy, view, zoom, pan),
      startClientX: e.clientX,
      startClientY: e.clientY,
      snapshot: { nodes: cloneNodes(nodes), designWaterlineZ, name },
      view: { ...view, flip: view.flip },
    }
    setSelected(null)
    setInsertHover(null)
    setHoverAnchorIndex(null)
    setHoverHandle(null)
    svg.setPointerCapture(e.pointerId)
  }

  const insertNodeOnSegment = (segmentIndex: number, t: number) => {
    pushHistory()
    const { p0, p1, p2, p3 } = absSegmentControls(nodes, segmentIndex)
    const anchor = cubicAt(p0, p1, p2, p3, t)
    const prev = cubicAt(p0, p1, p2, p3, Math.max(0, t - 0.08))
    const next = cubicAt(p0, p1, p2, p3, Math.min(1, t + 0.08))
    const tx = next.x - prev.x
    const tz = next.z - prev.z
    const len = Math.hypot(tx, tz) || 1
    const handleScale = 0.18
    const newNode: CubicBezierNode = {
      anchor: {
        x: snapCoord(Math.max(0, anchor.x), snapEnabled),
        z: snapCoord(anchor.z, snapEnabled),
      },
      handleIn: { x: (-tx / len) * handleScale, z: (-tz / len) * handleScale },
      handleOut: { x: (tx / len) * handleScale, z: (tz / len) * handleScale },
      handlesLinked: true,
      region: nodes[segmentIndex + 1]?.region ?? nodes[segmentIndex]?.region ?? 'hull',
    }
    setNodes((prevNodes) => {
      const nextNodes = [...prevNodes]
      nextNodes.splice(segmentIndex + 1, 0, newNode)
      return nextNodes.map((n, i) => enforceStarboardNode(n, i, nextNodes.length))
    })
    setDirty(true)
    setError(null)
    setInsertHover(null)
  }

  const updateSegmentHover = (e: React.PointerEvent, segmentIndex: number) => {
    if (dragRef.current || panRef.current || marqueeRef.current) return
    const svg = svgRef.current
    if (!svg) return
    const { sx, sy } = pointerRootSvg(e, svg)
    const world = screenToWorld(sx, sy, view, zoom, pan)
    const { t, world: onCurve } = closestOnSegment(nodes, segmentIndex, world)
    setInsertHover({
      segmentIndex,
      t,
      world: onCurve,
      rootSx: sx,
      rootSy: sy,
    })
  }

  const insertOnSegmentClick = (e: React.PointerEvent, segmentIndex: number) => {
    if (shouldPan(e)) {
      startPan(e)
      return
    }
    if (e.button !== 0 || dragRef.current || panRef.current) return
    e.stopPropagation()
    const svg = svgRef.current
    if (!svg) return
    const { sx, sy } = pointerRootSvg(e, svg)
    const world = screenToWorld(sx, sy, view, zoom, pan)
    const { t } = closestOnSegment(nodes, segmentIndex, world)
    insertNodeOnSegment(segmentIndex, t)
  }

  const updateNodeAt = (index: number, patch: Partial<CubicBezierNode>) => {
    setNodes((prev) => {
      const next = [...prev]
      next[index] = enforceStarboardNode({ ...next[index], ...patch }, index, prev.length)
      return next
    })
    setDirty(true)
    setError(null)
  }

  const deleteSelectedNode = () => {
    if (selectedAnchors.length >= 2) {
      deleteSelectedAnchors()
      return
    }
    if (!selected || selected.kind !== 'anchor') return
    const idx = selected.index
    if (nodes.length <= CUSTOM_HULL_MIN_NODES) return
    if (idx === 0 || idx === nodes.length - 1) return
    pushHistory()
    setNodes((prev) => prev.filter((_, i) => i !== idx).map((n, i, arr) => enforceStarboardNode(n, i, arr.length)))
    clearAnchorSelection()
    setDirty(true)
  }

  const deleteSelectedAnchors = () => {
    if (selectedAnchors.length < 2) return
    const toDelete = selectedAnchors.filter((i) => i > 0 && i < nodes.length - 1)
    if (toDelete.length === 0) return
    if (nodes.length - toDelete.length < CUSTOM_HULL_MIN_NODES) return
    pushHistory()
    const deleteSet = new Set(toDelete)
    setNodes((prev) =>
      prev.filter((_, i) => !deleteSet.has(i)).map((n, i, arr) => enforceStarboardNode(n, i, arr.length)),
    )
    clearAnchorSelection()
    setDirty(true)
  }

  const deleteSelectedHandle = () => {
    if (!selected || (selected.kind !== 'handleIn' && selected.kind !== 'handleOut')) return
    const node = nodes[selected.index]
    const handle = selected.kind === 'handleIn' ? node.handleIn : node.handleOut
    if (Math.hypot(handle.x, handle.z) < 0.01) return
    pushHistory()
    updateNodeAt(selected.index, { [selected.kind]: { x: 0, z: 0 } })
    setSelected(null)
    setHoverHandle(null)
  }

  const selectedNodeIndex =
    selected?.kind === 'anchor' || selected?.kind === 'handleIn' || selected?.kind === 'handleOut'
      ? selected.index
      : null

  const selectedNode = selectedNodeIndex !== null ? nodes[selectedNodeIndex] : null

  const canDeleteVertex =
    selected?.kind === 'anchor' &&
    selected.index > 0 &&
    selected.index < nodes.length - 1 &&
    nodes.length > CUSTOM_HULL_MIN_NODES

  const canDeleteHandle =
    selected !== null &&
    (selected.kind === 'handleIn' || selected.kind === 'handleOut') &&
    selectedNode !== null &&
    Math.hypot(
      selected.kind === 'handleIn' ? selectedNode.handleIn.x : selectedNode.handleOut.x,
      selected.kind === 'handleIn' ? selectedNode.handleIn.z : selectedNode.handleOut.z,
    ) >= 0.01

  const canAddBezier =
    selectedNodeIndex !== null &&
    selectedNode !== null &&
    (selectedNodeIndex === 0
      ? Math.hypot(selectedNode.handleOut.x, selectedNode.handleOut.z) < 0.01
      : selectedNodeIndex === nodes.length - 1
        ? Math.hypot(selectedNode.handleIn.x, selectedNode.handleIn.z) < 0.01
        : !nodeHasBezierHandles(selectedNode) ||
          Math.hypot(selectedNode.handleIn.x, selectedNode.handleIn.z) < 0.01 ||
          Math.hypot(selectedNode.handleOut.x, selectedNode.handleOut.z) < 0.01)

  const canRemoveBezier = selectedNode !== null && nodeHasBezierHandles(selectedNode)

  const canLinkHandles =
    selectedNodeIndex !== null &&
    selectedNodeIndex > 0 &&
    selectedNodeIndex < nodes.length - 1 &&
    selectedNode !== null &&
    !isNodeHandlesLinked(selectedNode)

  const canBreakHandles =
    selectedNodeIndex !== null &&
    selectedNodeIndex > 0 &&
    selectedNodeIndex < nodes.length - 1 &&
    selectedNode !== null &&
    isNodeHandlesLinked(selectedNode)

  const addBezierToSelected = () => {
    if (selectedNodeIndex === null || !canAddBezier) return
    pushHistory()
    const patch = defaultHandlesForNode(nodes, selectedNodeIndex)
    updateNodeAt(selectedNodeIndex, { ...patch, handlesLinked: selectedNode?.handlesLinked ?? true })
  }

  const removeBezierFromSelected = () => {
    if (selectedNodeIndex === null || !canRemoveBezier || !selectedNode) return
    pushHistory()
    updateNodeAt(selectedNodeIndex, clearNodeHandles(selectedNode))
    setHoverHandle(null)
  }

  const linkSelectedHandles = () => {
    if (selectedNodeIndex === null || !canLinkHandles || !selectedNode) return
    pushHistory()
    updateNodeAt(selectedNodeIndex, linkNodeHandles(selectedNode))
  }

  const breakSelectedHandles = () => {
    if (selectedNodeIndex === null || !canBreakHandles || !selectedNode) return
    pushHistory()
    updateNodeAt(selectedNodeIndex, breakNodeHandles(selectedNode))
  }

  const markSelectionAsKeel = () => {
    if (!canMarkSelectionAsKeel(selectedAnchors, nodes.length)) {
      setError('Select at least two contiguous points from the bottom centerline upward.')
      return
    }
    const maxIdx = Math.max(...selectedAnchors)
    pushHistory()
    setNodes((prev) => prev.map((n, i) => ({ ...n, region: i <= maxIdx ? 'keel' : 'hull' })))
    setDirty(true)
    setError(null)
  }

  const markSelectionAsHull = () => {
    if (!canMarkSelectionAsHull(selectedAnchors)) {
      setError('Select at least two contiguous points along the hull.')
      return
    }
    const minIdx = Math.min(...selectedAnchors)
    pushHistory()
    setNodes((prev) =>
      prev.map((n, i) => ({
        ...n,
        region: i < minIdx ? (n.region ?? 'hull') : 'hull',
      })),
    )
    setDirty(true)
    setError(null)
  }

  const selectedAnchorScreen = useMemo(() => {
    if (selected?.kind !== 'anchor') return null
    const anchor = nodes[selected.index].anchor
    return view.flip(anchor.x, anchor.z)
  }, [selected, nodes, view])

  const selectedHandleScreen = useMemo(() => {
    if (!selected || (selected.kind !== 'handleIn' && selected.kind !== 'handleOut')) return null
    const node = nodes[selected.index]
    const handle = selected.kind === 'handleIn' ? node.handleIn : node.handleOut
    if (Math.hypot(handle.x, handle.z) < 0.01) return null
    return view.flip(node.anchor.x + handle.x, node.anchor.z + handle.z)
  }, [selected, nodes, view])

  const onPointerDown = (e: React.PointerEvent) => {
    if (shouldPan(e)) {
      startPan(e)
      return
    }
    if (e.button === 0) {
      if (isSelectModifier(e)) {
        startMarquee(e)
        return
      }
      clearAnchorSelection()
      startPan(e)
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const svg = svgRef.current
    if (!svg) return

    if (marqueeRef.current) {
      const { sx, sy } = clientToViewBox(svg, e.clientX, e.clientY)
      setMarquee((m) => (m ? { ...m, sx1: sx, sy1: sy } : null))
      return
    }

    if (panRef.current) {
      const prev = clientToViewBox(svg, panRef.current.clientX, panRef.current.clientY)
      const curr = clientToViewBox(svg, e.clientX, e.clientY)
      const livePan = {
        x: panRef.current.panX + (curr.sx - prev.sx),
        y: panRef.current.panY + (curr.sy - prev.sy),
      }
      panRef.current.livePan = livePan
      applyPanZoomTransform(livePan)
      return
    }

    const drag = dragRef.current
    if (!drag) return
    const { sx, sy } = clientToViewBox(svg, e.clientX, e.clientY)
    const world = screenToWorld(sx, sy, drag.view, zoom, pan)
    const dx = world.x - drag.startWorld.x
    const dz = world.z - drag.startWorld.z

    if (drag.target?.kind === 'waterline') {
      const z = snapCoord(world.z, snapEnabled)
      setDesignWaterlineZ(z)
      setDirty(true)
      return
    }

    if (drag.target?.kind === 'anchors') {
      const indices = drag.target.indices
      const snap = drag.snapshot.nodes
      const nodeCount = snap.length
      setNodes((prev) => {
        const next = prev.map((n) => ({
          ...n,
          anchor: { ...n.anchor },
          handleIn: { ...n.handleIn },
          handleOut: { ...n.handleOut },
        }))
        for (const idx of indices) {
          const base = snap[idx]
          if (!base) continue
          let x = base.anchor.x + dx
          let z = base.anchor.z + dz
          if (idx === 0 || idx === nodeCount - 1) x = 0
          else x = Math.max(0, x)
          x = snapCoord(x, snapEnabled)
          z = snapCoord(z, snapEnabled)
          next[idx] = enforceStarboardNode({ ...next[idx], anchor: { x, z } }, idx, next.length)
        }
        return next
      })
      setDirty(true)
      setError(null)
      return
    }

    const idx = drag.target!.index
    const base = drag.snapshot.nodes[idx]

    if (drag.target!.kind === 'anchor') {
      let x = base.anchor.x + dx
      let z = base.anchor.z + dz
      if (idx === 0 || idx === drag.snapshot.nodes.length - 1) x = 0
      else x = Math.max(0, x)
      x = snapCoord(x, snapEnabled)
      z = snapCoord(z, snapEnabled)
      updateNodeAt(idx, { anchor: { x, z } })
    } else if (drag.target!.kind === 'handleIn') {
      const hx = snapCoord(base.handleIn.x + dx, snapEnabled)
      const hz = snapCoord(base.handleIn.z + dz, snapEnabled)
      updateNodeAt(idx, applyLinkedHandlePatch(base, 'handleIn', { x: hx, z: hz }))
    } else if (drag.target!.kind === 'handleOut') {
      const hx = snapCoord(base.handleOut.x + dx, snapEnabled)
      const hz = snapCoord(base.handleOut.z + dz, snapEnabled)
      updateNodeAt(idx, applyLinkedHandlePatch(base, 'handleOut', { x: hx, z: hz }))
    }
  }

  const onPointerUp = (e: React.PointerEvent) => {
    if (marqueeRef.current) {
      const { sx0, sy0 } = marqueeRef.current
      const { sx: sx1, sy: sy1 } = clientToViewBox(svgRef.current!, e.clientX, e.clientY)
      const rect = {
        sxMin: Math.min(sx0, sx1),
        sxMax: Math.max(sx0, sx1),
        syMin: Math.min(sy0, sy1),
        syMax: Math.max(sy0, sy1),
      }
      const hits = anchorIndicesInMarquee(nodes, view, zoom, pan, rect)
      setSelectedAnchors(hits)
      if (hits.length >= 2) {
        setSelected(null)
      } else if (hits.length === 1) {
        setSelected({ kind: 'anchor', index: hits[0] })
      } else {
        setSelected(null)
      }
      marqueeRef.current = null
      setMarquee(null)
      svgRef.current?.releasePointerCapture(e.pointerId)
      return
    }

    if (panRef.current?.livePan) {
      setPan(panRef.current.livePan)
    }

    dragRef.current = null
    panRef.current = null
    setIsPanning(false)
    svgRef.current?.releasePointerCapture(e.pointerId)
  }

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const svg = svgRef.current
    if (!svg) return
    const { sx: mx, sy: my } = clientToViewBox(svg, e.clientX, e.clientY)
    const factor = e.deltaY > 0 ? 0.92 : 1.08
    const { zoom: z, pan: p } = zoomPanRef.current
    const next = zoomAtPoint(z, p, mx, my, factor)
    setZoom(next.zoom)
    setPan(next.pan)
  }

  const handleCancel = () => {
    if (dirty && !window.confirm('Discard unsaved hull changes?')) return
    closeDesigner()
  }

  const handleSave = () => {
    const design: CustomHullDesign = {
      id: designId,
      name: name.trim(),
      nodes: cloneNodes(nodes),
      designWaterlineZ,
      createdAt: initial.createdAt,
      updatedAt: Date.now(),
    }
    const validation = validateCustomHullDesign(design)
    if (!validation.ok) {
      setError(validation.error)
      return
    }
    saveDesign(design)
    setCustomHull(design.id)
    closeDesigner()
  }

  const handleDelete = () => {
    if (!designerEditId) return
    if (!window.confirm(`Delete "${name}" permanently?`)) return
    removeDesign(designerEditId)
    if (config.customHullId === designerEditId) {
      setHullType('classical-u')
    }
    closeDesigner()
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      if (e.code === 'Space') {
        e.preventDefault()
        spaceDownRef.current = e.type === 'keydown'
        return
      }
      if (e.key === 'Escape') {
        if (selectedAnchors.length > 0 || selected) {
          e.preventDefault()
          clearAnchorSelection()
          return
        }
        handleCancel()
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'Z' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        redo()
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        deleteSelectedNode()
      }
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKey)
    }
  })

  const wlHighlighted = hoverWaterline || selected?.kind === 'waterline'
  const wlLeft = view.flip(gridBounds.xMin, designWaterlineZ)
  const wlRight = view.flip(gridBounds.xMax, designWaterlineZ)
  const centerTop = view.flip(0, gridBounds.zMax)
  const centerBottom = view.flip(0, gridBounds.zMin)

  const hullOutline = useMemo(() => sampleCustomHullOutline(designDraft), [designDraft])

  const derivedParams = useMemo(
    () => deriveHullParams(hullOutline, designWaterlineZ),
    [hullOutline, designWaterlineZ],
  )

  const dimensionSpecs = useMemo(
    () =>
      computeEditorDimensionSpecs(
        hullOutline,
        designWaterlineZ,
        derivedParams.beam,
        derivedParams.draft,
        derivedParams.freeboard,
      ),
    [hullOutline, designWaterlineZ, derivedParams.beam, derivedParams.draft, derivedParams.freeboard],
  )

  const multiSelectActive = selectedAnchors.length >= 2
  const canKeelSelection = canMarkSelectionAsKeel(selectedAnchors, nodes.length)
  const canHullSelection = canMarkSelectionAsHull(selectedAnchors)
  const deletableMultiAnchors = selectedAnchors.filter((i) => i > 0 && i < nodes.length - 1)
  const canDeleteMultiAnchors =
    multiSelectActive &&
    deletableMultiAnchors.length > 0 &&
    nodes.length - deletableMultiAnchors.length >= CUSTOM_HULL_MIN_NODES

  return (
    <div
      className={`is-diagram is-designer${isPanning ? ' is-designer--panning' : ''}${marquee ? ' is-designer--marquee' : ''}`}
    >
      <svg
        ref={svgRef}
        className="is-diagram__svg is-designer__svg"
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        preserveAspectRatio="xMidYMid slice"
        style={{ cursor: isPanning ? 'grabbing' : marquee ? 'crosshair' : 'grab' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onWheel={onWheel}
        onContextMenu={(e) => e.preventDefault()}
      >
        <g ref={panGroupRef} transform={panZoomTransform(zoom, pan)}>
          <rect
            className="is-designer__pan-bg"
            x={-50000}
            y={-50000}
            width={100000}
            height={100000}
            fill="transparent"
            onPointerDown={(e) => {
              if (e.button !== 0) return
              e.stopPropagation()
              if (isSelectModifier(e)) {
                startMarquee(e)
                return
              }
              clearAnchorSelection()
              startPan(e)
            }}
          />

          <DesignerGrid
            view={view}
            xMin={gridBounds.xMin}
            xMax={gridBounds.xMax}
            zMin={gridBounds.zMin}
            zMax={gridBounds.zMax}
          />

          <line
            x1={centerTop.sx}
            y1={centerTop.sy}
            x2={centerBottom.sx}
            y2={centerBottom.sy}
            stroke="rgba(148, 163, 184, 0.35)"
            strokeWidth={1}
            strokeDasharray="4 4"
            pointerEvents="none"
            {...NON_SCALING}
          />

          {portGhostPath && (
            <path d={portGhostPath} fill="none" stroke="rgba(95, 212, 196, 0.25)" strokeWidth={1.5} pointerEvents="none" {...NON_SCALING} />
          )}

          {sampledHullPreview.length >= 3 && (
            <path
              d={toPath(sampledHullPreview)}
              fill="rgba(95, 212, 196, 0.08)"
              stroke="rgba(95, 212, 196, 0.35)"
              strokeWidth={1}
              pointerEvents="none"
              {...NON_SCALING}
            />
          )}

          {nodes.length > 1 &&
            Array.from({ length: nodes.length - 1 }, (_, i) => (
              <path
                key={`seg-${i}`}
                d={segmentPathScreen(nodes, i, view)}
                fill="none"
                stroke={isKeelNode(nodes[i]) ? '#e0954a' : '#5fd4c4'}
                strokeWidth={2}
                pointerEvents="none"
                {...NON_SCALING}
              />
            ))}

          {nodes.length > 1 &&
            Array.from({ length: nodes.length - 1 }, (_, i) => (
              <path
                key={`hit-${i}`}
                d={segmentPathScreen(nodes, i, view)}
                fill="none"
                stroke="transparent"
                strokeWidth={INSERT_HIT_STROKE}
                className="is-designer__segment-hit"
                {...NON_SCALING}
                onPointerMove={(e) => updateSegmentHover(e, i)}
                onPointerDown={(e) => insertOnSegmentClick(e, i)}
                onPointerLeave={() => setInsertHover(null)}
              />
            ))}

          <line
            x1={wlLeft.sx}
            y1={wlLeft.sy}
            x2={wlRight.sx}
            y2={wlRight.sy}
            stroke="#60a5fa"
            strokeDasharray="6 4"
            pointerEvents="none"
            className={`is-designer__wl-line${wlHighlighted ? ' is-designer__wl-line--highlight' : ''}`}
            {...NON_SCALING}
          />
          <line
            x1={wlLeft.sx}
            y1={wlLeft.sy}
            x2={wlRight.sx}
            y2={wlRight.sy}
            stroke="transparent"
            strokeWidth={14}
            className="is-designer__wl-hit"
            {...NON_SCALING}
            onPointerEnter={() => setHoverWaterline(true)}
            onPointerLeave={() => setHoverWaterline(false)}
            onPointerDown={(e) => beginDrag(e, { kind: 'waterline' })}
          />
          <text x={wlRight.sx - 4} y={wlLeft.sy - 6} fill="#60a5fa" fontSize={8} textAnchor="end" pointerEvents="none">
            Waterline
          </text>

          {nodes.map((n, i) => {
            const a = view.flip(n.anchor.x, n.anchor.z)
            const hIn = view.flip(n.anchor.x + n.handleIn.x, n.anchor.z + n.handleIn.z)
            const hOut = view.flip(n.anchor.x + n.handleOut.x, n.anchor.z + n.handleOut.z)
            const multiSel = multiSelectActive && selectedAnchors.includes(i)
            const anchorActive =
              hoverAnchorIndex === i ||
              multiSel ||
              (selected?.kind === 'anchor' && selected.index === i) ||
              (selected?.kind === 'handleIn' && selected.index === i) ||
              (selected?.kind === 'handleOut' && selected.index === i) ||
              (hoverHandle?.index === i)
            const selIn = selected?.kind === 'handleIn' && selected.index === i
            const selOut = selected?.kind === 'handleOut' && selected.index === i
            const hoverIn = hoverHandle?.index === i && hoverHandle.kind === 'handleIn'
            const hoverOut = hoverHandle?.index === i && hoverHandle.kind === 'handleOut'
            const handleOpacity = anchorActive ? 1 : 0.38
            const showInLine = Math.hypot(n.handleIn.x, n.handleIn.z) > 0.01
            const showOutLine = Math.hypot(n.handleOut.x, n.handleOut.z) > 0.01
            const handleColor = isKeelNode(n) ? 'rgba(240, 163, 94, 0.55)' : 'rgba(240, 163, 94, 0.55)'
            return (
              <g key={`handle-visual-${i}`} opacity={handleOpacity}>
                {showInLine && (
                  <line x1={a.sx} y1={a.sy} x2={hIn.sx} y2={hIn.sy} stroke={handleColor} strokeWidth={1} pointerEvents="none" {...NON_SCALING} />
                )}
                {showOutLine && (
                  <line x1={a.sx} y1={a.sy} x2={hOut.sx} y2={hOut.sy} stroke={handleColor} strokeWidth={1} pointerEvents="none" {...NON_SCALING} />
                )}
                {(showInLine || hoverIn) && (
                  <circle
                    cx={hIn.sx}
                    cy={hIn.sy}
                    r={handleVisualR(selIn, hoverIn)}
                    fill={selIn ? '#f0a35e' : 'rgba(240, 163, 94, 0.75)'}
                    stroke="#0a141f"
                    strokeWidth={1}
                    pointerEvents="none"
                  />
                )}
                {(showOutLine || hoverOut) && (
                  <circle
                    cx={hOut.sx}
                    cy={hOut.sy}
                    r={handleVisualR(selOut, hoverOut)}
                    fill={selOut ? '#f0a35e' : 'rgba(240, 163, 94, 0.75)'}
                    stroke="#0a141f"
                    strokeWidth={1}
                    pointerEvents="none"
                  />
                )}
              </g>
            )
          })}

          {nodes.map((n, i) => {
            const a = view.flip(n.anchor.x, n.anchor.z)
            const sel = selected?.kind === 'anchor' && selected.index === i && !multiSelectActive
            const multiSel = multiSelectActive && selectedAnchors.includes(i)
            const hovered = hoverAnchorIndex === i
            const keelPt = isKeelNode(n)
            const anchorR = sel || multiSel ? ANCHOR_R_SELECTED : hovered ? ANCHOR_R_HOVER : ANCHOR_R
            return (
              <g key={`anchor-${i}`}>
                <circle
                  cx={a.sx}
                  cy={a.sy}
                  r={ANCHOR_HIT_R}
                  fill="transparent"
                  className="is-designer__anchor-hit"
                  onPointerEnter={() => setHoverAnchorIndex(i)}
                  onPointerLeave={() => setHoverAnchorIndex((prev) => (prev === i ? null : prev))}
                  onPointerDown={(e) => handleAnchorPointerDown(e, i)}
                  onDoubleClick={(e) => {
                    e.stopPropagation()
                    if (i > 0 && i < nodes.length - 1 && nodes.length > CUSTOM_HULL_MIN_NODES) {
                      pushHistory()
                      setNodes((prev) => prev.filter((_, idx) => idx !== i))
                      setSelected(null)
                      setSelectedAnchors([])
                      setDirty(true)
                    }
                  }}
                />
                {(hovered || sel || multiSel) && (
                  <circle
                    cx={a.sx}
                    cy={a.sy}
                    r={anchorR + ANCHOR_RING_PAD}
                    fill="none"
                    stroke={
                      multiSel
                        ? '#a78bfa'
                        : sel
                          ? keelPt
                            ? '#e0954a'
                            : '#5fd4c4'
                          : keelPt
                            ? 'rgba(224, 149, 74, 0.45)'
                            : 'rgba(95, 212, 196, 0.45)'
                    }
                    strokeWidth={1.5}
                    pointerEvents="none"
                    {...NON_SCALING}
                  />
                )}
                <circle
                  cx={a.sx}
                  cy={a.sy}
                  r={anchorR}
                  fill={
                    multiSel
                      ? '#a78bfa'
                      : sel
                        ? keelPt
                          ? '#e0954a'
                          : '#5fd4c4'
                        : hovered
                          ? '#e2e8f0'
                          : keelPt
                            ? '#f0a35e'
                            : '#cbd5e1'
                  }
                  stroke={sel || multiSel ? '#0a141f' : hovered ? (keelPt ? '#e0954a' : '#5fd4c4') : '#0a141f'}
                  strokeWidth={hovered || sel || multiSel ? 1.5 : 1.25}
                  pointerEvents="none"
                  className="is-designer__anchor-visual"
                />
              </g>
            )
          })}

          {nodes.map((n, i) => {
            const hIn = view.flip(n.anchor.x + n.handleIn.x, n.anchor.z + n.handleIn.z)
            const hOut = view.flip(n.anchor.x + n.handleOut.x, n.anchor.z + n.handleOut.z)
            const selIn = selected?.kind === 'handleIn' && selected.index === i
            const selOut = selected?.kind === 'handleOut' && selected.index === i
            const showInLine = Math.hypot(n.handleIn.x, n.handleIn.z) > 0.01
            const showOutLine = Math.hypot(n.handleOut.x, n.handleOut.z) > 0.01
            const handleHitR = (isSelected: boolean) => (isSelected ? HANDLE_HIT_R_SELECTED : HANDLE_HIT_R)
            return (
              <g key={`handle-hit-${i}`}>
                {showInLine && (
                  <circle
                    cx={hIn.sx}
                    cy={hIn.sy}
                    r={handleHitR(selIn)}
                    fill="transparent"
                    className="is-designer__handle-hit"
                    onPointerEnter={() => setHoverHandle({ index: i, kind: 'handleIn' })}
                    onPointerLeave={() => setHoverHandle((prev) => (prev?.index === i && prev.kind === 'handleIn' ? null : prev))}
                    onPointerDown={(e) => beginDrag(e, { kind: 'handleIn', index: i })}
                  />
                )}
                {showOutLine && (
                  <circle
                    cx={hOut.sx}
                    cy={hOut.sy}
                    r={handleHitR(selOut)}
                    fill="transparent"
                    className="is-designer__handle-hit"
                    onPointerEnter={() => setHoverHandle({ index: i, kind: 'handleOut' })}
                    onPointerLeave={() => setHoverHandle((prev) => (prev?.index === i && prev.kind === 'handleOut' ? null : prev))}
                    onPointerDown={(e) => beginDrag(e, { kind: 'handleOut', index: i })}
                  />
                )}
              </g>
            )
          })}

          {showDimensions && dimensionSpecs.length > 0 && (
            <>
              <DimensionLines
                specs={dimensionSpecs}
                view={view}
                heelRad={0}
                mutedOpacity={DESIGN_DIM_MUTED_OPACITY}
                hoveredId={hoveredDimId}
                onHoverId={setHoveredDimId}
              />
              <DimensionLabels
                specs={dimensionSpecs}
                view={view}
                heelRad={0}
                tp={(p) => p}
                fontSize={6}
                mutedOpacity={DESIGN_DIM_MUTED_OPACITY}
                hoveredId={hoveredDimId}
                onHoverId={setHoveredDimId}
              />
            </>
          )}

          {selected?.kind === 'anchor' && selectedAnchorScreen && selectedNode && !multiSelectActive && (
            <InlineToolRow origin={selectedAnchorScreen} zoom={zoom}>
              <DesignerToolBtn
                x={inlineToolOrigin(ANCHOR_R_SELECTED).x}
                y={0}
                label="Add curve"
                disabled={!canAddBezier}
                onClick={addBezierToSelected}
                icon={Plus}
              />
              <DesignerToolBtn
                x={inlineToolOrigin(ANCHOR_R_SELECTED).x + VERTEX_TOOL_STEP}
                y={0}
                label="Remove curve"
                disabled={!canRemoveBezier}
                onClick={removeBezierFromSelected}
                icon={Minus}
              />
              <DesignerToolBtn
                x={inlineToolOrigin(ANCHOR_R_SELECTED).x + VERTEX_TOOL_STEP * 2}
                y={0}
                label="Link handles"
                active={isNodeHandlesLinked(selectedNode)}
                disabled={!canLinkHandles}
                onClick={linkSelectedHandles}
                icon={Link2}
              />
              <DesignerToolBtn
                x={inlineToolOrigin(ANCHOR_R_SELECTED).x + VERTEX_TOOL_STEP * 3}
                y={0}
                label="Break link"
                active={!isNodeHandlesLinked(selectedNode)}
                disabled={!canBreakHandles}
                onClick={breakSelectedHandles}
                icon={Unlink2}
              />
              <DesignerToolBtn
                x={inlineToolOrigin(ANCHOR_R_SELECTED).x + VERTEX_TOOL_STEP * 4}
                y={0}
                label="Delete point"
                tone="danger"
                disabled={!canDeleteVertex}
                onClick={deleteSelectedNode}
                icon={Trash2}
              />
            </InlineToolRow>
          )}

          {selectedHandleScreen && selectedNode && (selected?.kind === 'handleIn' || selected?.kind === 'handleOut') && (
            <InlineToolRow origin={selectedHandleScreen} zoom={zoom}>
              <DesignerToolBtn
                x={inlineToolOrigin(HANDLE_R_SELECTED).x}
                y={0}
                label="Delete handle"
                tone="danger"
                disabled={!canDeleteHandle}
                onClick={deleteSelectedHandle}
                icon={Trash2}
              />
              <DesignerToolBtn
                x={inlineToolOrigin(HANDLE_R_SELECTED).x + VERTEX_TOOL_STEP}
                y={0}
                label="Link handles"
                active={isNodeHandlesLinked(selectedNode)}
                disabled={!canLinkHandles}
                onClick={linkSelectedHandles}
                icon={Link2}
              />
              <DesignerToolBtn
                x={inlineToolOrigin(HANDLE_R_SELECTED).x + VERTEX_TOOL_STEP * 2}
                y={0}
                label="Break link"
                active={!isNodeHandlesLinked(selectedNode)}
                disabled={!canBreakHandles}
                onClick={breakSelectedHandles}
                icon={Unlink2}
              />
            </InlineToolRow>
          )}

        </g>

        {insertHover && !dragRef.current && !marqueeRef.current && (
          <g className="is-designer__insert" transform={`translate(${insertHover.rootSx}, ${insertHover.rootSy})`} pointerEvents="none">
            <circle r={5.5} className="is-designer__insert-bg" />
            <text y={0.5} textAnchor="middle" dominantBaseline="middle" className="is-designer__insert-icon">
              +
            </text>
          </g>
        )}

        {marquee && (
          <rect
            x={Math.min(marquee.sx0, marquee.sx1)}
            y={Math.min(marquee.sy0, marquee.sy1)}
            width={Math.abs(marquee.sx1 - marquee.sx0)}
            height={Math.abs(marquee.sy1 - marquee.sy0)}
            className="is-designer__marquee"
            pointerEvents="none"
          />
        )}
      </svg>

      {multiSelectActive && (
        <div className="is-designer__panel is-designer__panel--region" onPointerDown={(e) => e.stopPropagation()}>
          <span className="is-designer__region-label">{selectedAnchors.length} points selected</span>
          <button
            type="button"
            className="is-designer__btn"
            disabled={!canKeelSelection}
            onClick={markSelectionAsKeel}
            title="Mark selected points as keel appendage"
          >
            <Anchor size={14} />
            Mark as keel
          </button>
          <button
            type="button"
            className="is-designer__btn"
            disabled={!canHullSelection}
            onClick={markSelectionAsHull}
            title="Restore selected points to hull"
          >
            <Ship size={14} />
            Restore as hull
          </button>
          <button
            type="button"
            className="is-designer__btn is-designer__btn--danger"
            disabled={!canDeleteMultiAnchors}
            onClick={deleteSelectedAnchors}
            title="Delete selected points"
          >
            <Trash2 size={14} />
            Delete points
          </button>
        </div>
      )}

      <div className="is-designer__panel is-designer__panel--tl" onPointerDown={(e) => e.stopPropagation()}>
        {error && <p className="is-designer__error">{error}</p>}
        <div className="is-designer__controls">
          <label className="is-designer__name-field">
            <span className="is-field__label">Name</span>
            <input
              className="is-designer__name-input"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setDirty(true)
              }}
              placeholder="My hull design"
            />
          </label>
          <div className="is-designer__actions">
            {designerEditId && (
              <button type="button" className="is-designer__btn is-designer__btn--danger" onClick={handleDelete}>
                <Trash2 size={14} />
                Delete
              </button>
            )}
            <button type="button" className="is-designer__btn" onClick={handleCancel}>
              <X size={14} />
              Cancel
            </button>
            <button type="button" className="is-designer__btn is-designer__btn--primary" onClick={handleSave}>
              <Save size={14} />
              Save
            </button>
            <HelpPopover title="Hull designer">
              Draw the starboard half with cubic Bézier points. Port side mirrors automatically. ⌘/Ctrl+drag
              to select multiple bottom points, then mark as keel — the simulator switches to Custom keel
              appendage automatically. Drag the blue dashed line to set the waterline.
            </HelpPopover>
          </div>
        </div>
      </div>

      <div className="is-designer__panel is-designer__panel--tr" onPointerDown={(e) => e.stopPropagation()}>
        <div className="is-diagram__toolbar">
          <button type="button" className="is-diagram__zoom-btn" onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z * 1.2))} aria-label="Zoom in">
            <Plus size={14} />
          </button>
          <button type="button" className="is-diagram__zoom-btn" onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z / 1.2))} aria-label="Zoom out">
            <Minus size={14} />
          </button>
          <button
            type="button"
            className="is-diagram__zoom-btn"
            onClick={() => {
              setZoom(1)
              setPan({ x: 0, y: 0 })
            }}
            aria-label="Reset view"
          >
            <RotateCcw size={14} />
          </button>
          <span className="is-diagram__toolbar-sep" />
          <button type="button" className="is-diagram__zoom-btn" onClick={undo} aria-label="Undo">
            <Undo2 size={14} />
          </button>
          <button type="button" className="is-diagram__zoom-btn" onClick={redo} aria-label="Redo">
            <Redo2 size={14} />
          </button>
          <button
            type="button"
            className={`is-diagram__zoom-btn${snapEnabled ? ' is-diagram__zoom-btn--active' : ''}`}
            onClick={() => setSnapEnabled((s) => !s)}
            aria-label="Toggle snap"
          >
            <Magnet size={14} />
          </button>
          <span className="is-diagram__toolbar-sep" />
          <button
            type="button"
            className={`is-diagram__zoom-btn${showDimensions ? ' is-diagram__zoom-btn--active' : ''}`}
            onClick={() => {
              setShowDimensions((s) => !s)
              setHoveredDimId(null)
            }}
            title="Dimensions"
            aria-label="Toggle dimensions"
          >
            <Ruler size={14} />
          </button>
        </div>
      </div>

      <p className="is-designer__hint">
        Snap {snapEnabled ? `${CUSTOM_HULL_SNAP_M} m` : 'off'}
        {hasKeelRegion ? ' · Keel + hull regions' : ''} · ⌘/Ctrl+drag to multi-select · Drag selection to move ·
        Click outside to deselect · Delete to remove · Space/Alt+drag to pan · Scroll to zoom
      </p>
    </div>
  )
}

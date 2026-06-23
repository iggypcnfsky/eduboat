import { useRef, useMemo, useState, useEffect, useLayoutEffect } from 'react'
import { Minus, Plus, RotateCcw, Play, Pause } from 'lucide-react'
import { Toggle } from '../../../ui/Toggle'
import { useStability } from '../store'
import { bodyToEarth } from '../sim/geometry'
import { buildHullPartsForConfig, customHullKeelPartIndex } from '../sim/keel-config'
import {
  applyKeelDatumParts,
  buildJointedBridgeQuad,
  buildMultiHullBridges,
  isMultiHullPreset,
  type MultiHullBridge,
} from '../sim/hull-presets'
import {
  buildWaveAboveClipPath,
  buildWaveSurfaceLine,
  buildWaveWaterPath,
  computeVesselHeaveLayout,
  enforceMultihullDryDeck,
  resolveMultihullHeaveMode,
  stepRoll,
  waveSurfaceZ,
  waveSwayOffsetM,
  type RollState,
  type WaveVisualParams,
} from '../sim/roll-dynamics'
import type { Vec2 } from '../sim/types'
import {
  computeDimensionSpecs,
  DimensionLabels,
  DimensionLines,
} from './dimension-overlay'
import { HelpPopover } from './HelpPopover'

const SVG_W = 640
const SVG_H = 520
const PAD = 56
const ZOOM_MIN = 0.2
const ZOOM_MAX = 24
/** Fallback screen padding for clip paths when bounds are unavailable */
const EXT = 8000

/** Gravity (G), buoyancy (B), metacenter (M) — distinct palette */
const COL = {
  g: '#f0a35e',
  b: '#5fd4c4',
  m: '#b794f6',
  k: '#cbd5e1',
  gz: '#6fbf9a',
  dash: '4 3',
  dashLong: '6 4',
} as const

type ViewTransform = {
  scale: number
  cx: number
  cy: number
  flip: (x: number, z: number) => { sx: number; sy: number }
}

const NON_SCALING = { vectorEffect: 'non-scaling-stroke' as const }

type ScreenPt = { sx: number; sy: number }

function applyPanZoom(
  sx: number,
  sy: number,
  zoom: number,
  pan: { x: number; y: number },
): ScreenPt {
  return {
    sx: (sx - SVG_W / 2) * zoom + SVG_W / 2 + pan.x,
    sy: (sy - SVG_H / 2) * zoom + SVG_H / 2 + pan.y,
  }
}

function toPath(pts: ScreenPt[]): string {
  if (pts.length < 2) return ''
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.sx.toFixed(1)} ${p.sy.toFixed(1)}`).join(' ') + ' Z'
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

function bridgeToEarth(bridge: MultiHullBridge, heelRad: number): MultiHullBridge {
  const lo = bodyToEarth({ x: bridge.lower.x1, z: bridge.lower.z1 }, heelRad)
  const hi = bodyToEarth({ x: bridge.lower.x2, z: bridge.lower.z2 }, heelRad)
  return {
    platform: bridge.platform.map((p) => bodyToEarth(p, heelRad)),
    lower: { x1: lo.x, z1: lo.z, x2: hi.x, z2: hi.z },
  }
}

function diagramHalfSpan(config: { presetId: string; params: { beam: number; demiHullWidth: number } }, hullParts: { x: number; z: number }[][]): number {
  if (hullParts.length > 0) {
    const xs = hullParts.flatMap((p) => p.map((pt) => Math.abs(pt.x)))
    return Math.max(...xs, config.params.beam / 2) + 0.35
  }
  if (config.presetId === 'catamaran') {
    return config.params.beam / 2 + config.params.demiHullWidth / 2 + 0.35
  }
  if (config.presetId === 'trimaran') {
    return config.params.beam + config.params.demiHullWidth * 0.4 + 0.35
  }
  return config.params.beam / 2 + 0.45
}

type EarthBounds = { xHalf: number; zMin: number; zMax: number }

function computeEarthBounds(
  hullParts: { x: number; z: number }[][],
  spanBeam: number,
  m0z: number,
  draft: number,
  freeboard: number,
): EarthBounds {
  const marginX = 0.75
  const marginZ = 0.45
  let xHalf = spanBeam / 2 + marginX
  let zMin = -marginZ
  let zMax = draft + freeboard + marginZ

  for (const part of hullParts) {
    for (const p of part) {
      xHalf = Math.max(xHalf, Math.abs(p.x) + marginX)
      zMin = Math.min(zMin, p.z - marginZ)
      zMax = Math.max(zMax, p.z + marginZ)
    }
  }

  zMax = Math.max(zMax, m0z + 0.85, draft + freeboard + marginZ)
  return { xHalf, zMin, zMax }
}

function mergeEarthBounds(a: EarthBounds, b: EarthBounds): EarthBounds {
  return {
    xHalf: Math.max(a.xHalf, b.xHalf),
    zMin: Math.min(a.zMin, b.zMin),
    zMax: Math.max(a.zMax, b.zMax),
  }
}

/** Fixed framing envelope: upright hull plus ±180° rotation so heel never refits the camera. */
function computeDesignSceneBounds(
  bodyParts: { x: number; z: number }[][],
  spanBeam: number,
  m0z: number,
  draft: number,
  freeboard: number,
): EarthBounds {
  let bounds = computeEarthBounds(bodyParts, spanBeam, m0z, draft, freeboard)
  for (const heelDeg of [-180, -90, 90, 180]) {
    const heelRad = (heelDeg * Math.PI) / 180
    const rotated = bodyParts.map((part) => part.map((p) => bodyToEarth(p, heelRad)))
    bounds = mergeEarthBounds(
      bounds,
      computeEarthBounds(rotated, spanBeam, m0z, draft, freeboard),
    )
  }
  return bounds
}

type DesignFrame = {
  view: ViewTransform
  bounds: EarthBounds
}

function contentFromSvg(
  sx: number,
  sy: number,
  zoom: number,
  pan: { x: number; y: number },
): ScreenPt {
  return {
    sx: ((sx - SVG_W / 2 - pan.x) / zoom) + SVG_W / 2,
    sy: ((sy - SVG_H / 2 - pan.y) / zoom) + SVG_H / 2,
  }
}

function earthFromContent(pt: ScreenPt, view: ViewTransform): { x: number; z: number } {
  return {
    x: (pt.sx - SVG_W / 2) / view.scale + view.cx,
    z: view.cy - (pt.sy - SVG_H / 2) / view.scale,
  }
}

/** Expand design bounds to cover the full schematic viewport at the current zoom/pan. */
function computeRenderEarthBounds(
  view: ViewTransform,
  zoom: number,
  pan: { x: number; y: number },
  designBounds: EarthBounds,
  viewportAspect = SVG_W / SVG_H,
): EarthBounds {
  const margin = 1.25
  let xHalf = designBounds.xHalf
  let zMin = designBounds.zMin
  let zMax = designBounds.zMax

  const corners: [number, number][] = [
    [0, 0],
    [SVG_W, 0],
    [SVG_W, SVG_H],
    [0, SVG_H],
  ]

  for (const [sx, sy] of corners) {
    const earth = earthFromContent(contentFromSvg(sx, sy, zoom, pan), view)
    xHalf = Math.max(xHalf, Math.abs(earth.x) + margin)
    zMin = Math.min(zMin, earth.z - margin)
    zMax = Math.max(zMax, earth.z + margin)
  }

  const viewBoxAspect = SVG_W / SVG_H
  if (viewportAspect > viewBoxAspect * 1.02) {
    const visibleHalfPx = (SVG_H * viewportAspect) / 2
    xHalf = Math.max(xHalf, visibleHalfPx / view.scale + margin)
  } else if (viewportAspect < viewBoxAspect * 0.98) {
    const visibleHalfPx = SVG_W / (2 * viewportAspect)
    zMin = Math.min(zMin, view.cy - visibleHalfPx / view.scale - margin)
    zMax = Math.max(zMax, view.cy + visibleHalfPx / view.scale + margin)
  }

  return { xHalf, zMin, zMax }
}

/** Earth half-width that fills the schematic viewport horizontally (incl. zoom/pan). */
function fillEarthHalfWidth(
  view: ViewTransform,
  zoom: number,
  pan: { x: number; y: number },
  svgClientW: number,
  svgClientH: number,
): number {
  const margin = 2.5
  let maxAbsX = 0

  for (const sx of [0, SVG_W / 2, SVG_W]) {
    for (const sy of [0, SVG_H / 2, SVG_H]) {
      const earth = earthFromContent(contentFromSvg(sx, sy, zoom, pan), view)
      maxAbsX = Math.max(maxAbsX, Math.abs(earth.x))
    }
  }

  const viewBoxAspect = SVG_W / SVG_H
  if (svgClientW > 0 && svgClientH > 0) {
    const viewportAspect = svgClientW / svgClientH
    if (viewportAspect > viewBoxAspect) {
      maxAbsX = Math.max(maxAbsX, SVG_W / (2 * view.scale))
    } else {
      maxAbsX = Math.max(maxAbsX, SVG_W / (2 * view.scale))
    }
  } else {
    maxAbsX = Math.max(maxAbsX, SVG_W / (2 * view.scale))
  }

  return maxAbsX + margin
}

/** Earth z span that fills the schematic viewport vertically (incl. zoom/pan). */
function fillEarthDepthSpan(
  view: ViewTransform,
  zoom: number,
  pan: { x: number; y: number },
  svgClientW: number,
  svgClientH: number,
  cy: number,
): { zMin: number; zMax: number } {
  const margin = 2.5
  let zMin = Infinity
  let zMax = -Infinity

  for (const sx of [0, SVG_W / 2, SVG_W]) {
    for (const sy of [0, SVG_H / 2, SVG_H]) {
      const earth = earthFromContent(contentFromSvg(sx, sy, zoom, pan), view)
      zMin = Math.min(zMin, earth.z)
      zMax = Math.max(zMax, earth.z)
    }
  }

  const viewBoxAspect = SVG_W / SVG_H
  if (svgClientW > 0 && svgClientH > 0) {
    const viewportAspect = svgClientW / svgClientH
    if (viewportAspect < viewBoxAspect) {
      const visibleHalfPx = SVG_W / (2 * viewportAspect)
      zMin = Math.min(zMin, cy - visibleHalfPx / view.scale)
      zMax = Math.max(zMax, cy + visibleHalfPx / view.scale)
    } else {
      const half = SVG_H / (2 * view.scale)
      zMin = Math.min(zMin, cy - half)
      zMax = Math.max(zMax, cy + half)
    }
  }

  return { zMin: zMin - margin, zMax: zMax + margin }
}

function earthRectPath(
  view: ViewTransform,
  xMin: number,
  xMax: number,
  zBottom: number,
  zTop: number,
): string {
  const tl = view.flip(xMin, zTop)
  const tr = view.flip(xMax, zTop)
  const br = view.flip(xMax, zBottom)
  const bl = view.flip(xMin, zBottom)
  return `M ${tl.sx.toFixed(1)} ${tl.sy.toFixed(1)} L ${tr.sx.toFixed(1)} ${tr.sy.toFixed(1)} L ${br.sx.toFixed(1)} ${br.sy.toFixed(1)} L ${bl.sx.toFixed(1)} ${bl.sy.toFixed(1)} Z`
}

function buildEarthFixedView(bounds: EarthBounds): ViewTransform {
  const w = bounds.xHalf * 2 + 0.6
  const h = bounds.zMax - bounds.zMin
  const cx = 0
  const cy = (bounds.zMin + bounds.zMax) / 2
  const scale = Math.min((SVG_W - PAD * 2) / w, (SVG_H - PAD * 2) / Math.max(h, 0.5))
  const flip = (x: number, z: number) => ({
    sx: SVG_W / 2 + (x - cx) * scale,
    sy: SVG_H / 2 - (z - cy) * scale,
  })
  return { scale, cx, cy, flip }
}

type GridLine = { x1: number; y1: number; x2: number; y2: number; major: boolean }

function buildGridLines(
  view: ViewTransform,
  xHalf: number,
  zMin: number,
  zMax: number,
): GridLine[] {
  const minor = 0.5
  const major = 2
  const lines: GridLine[] = []
  const xStart = Math.floor(-xHalf / minor) * minor
  const xEnd = Math.ceil(xHalf / minor) * minor
  const zStart = Math.floor(zMin / minor) * minor
  const zEnd = Math.ceil(zMax / minor) * minor

  for (let v = xStart; v <= xEnd; v += minor) {
    const isMajor = Math.abs(v / major - Math.round(v / major)) < 1e-6
    const a = view.flip(v, zMin)
    const b = view.flip(v, zMax)
    lines.push({ x1: a.sx, y1: a.sy, x2: b.sx, y2: b.sy, major: isMajor })
  }

  for (let v = zStart; v <= zEnd; v += minor) {
    const isMajor = Math.abs(v / major - Math.round(v / major)) < 1e-6
    const a = view.flip(-xHalf, v)
    const b = view.flip(xHalf, v)
    lines.push({ x1: a.sx, y1: a.sy, x2: b.sx, y2: b.sy, major: isMajor })
  }

  return lines
}

function DiagramGrid({
  view,
  xHalf,
  zMin,
  zMax,
}: {
  view: ViewTransform
  xHalf: number
  zMin: number
  zMax: number
}) {
  const lines = useMemo(
    () => buildGridLines(view, xHalf, zMin, zMax),
    [view, xHalf, zMin, zMax],
  )
  return (
    <g className="is-diagram__grid" pointerEvents="none">
      {lines.map((ln, i) => (
        <line
          key={i}
          x1={ln.x1}
          y1={ln.y1}
          x2={ln.x2}
          y2={ln.y2}
          stroke="rgba(203, 213, 225, 1)"
          strokeWidth={ln.major ? 0.6 : 0.4}
          opacity={ln.major ? 0.14 : 0.06}
          {...NON_SCALING}
        />
      ))}
    </g>
  )
}

function angleArcPath(
  cx: number,
  cy: number,
  r: number,
  a0: number,
  a1: number,
): { d: string; midAngle: number; endAngle: number; sweep: number } {
  let delta = a1 - a0
  while (delta <= -Math.PI) delta += 2 * Math.PI
  while (delta > Math.PI) delta -= 2 * Math.PI
  const sweep = delta >= 0 ? 1 : 0
  const x0 = cx + r * Math.cos(a0)
  const y0 = cy + r * Math.sin(a0)
  const x1 = cx + r * Math.cos(a1)
  const y1 = cy + r * Math.sin(a1)
  return {
    d: `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 0 ${sweep} ${x1.toFixed(2)} ${y1.toFixed(2)}`,
    midAngle: a0 + delta / 2,
    endAngle: a1,
    sweep,
  }
}

type PointMark = {
  id: string
  symbol: string
  title: string
  pt: ScreenPt
  color: string
  ghost?: boolean
  layer?: 'gravity' | 'buoyancy' | 'reference'
}

function LayerToggle({
  label,
  on,
  onChange,
}: {
  label: string
  on: boolean
  onChange: (on: boolean) => void
}) {
  return (
    <label className="is-diagram__layer">
      <Toggle on={on} onChange={onChange} label={label} />
      <span className="is-diagram__layer-label">{label}</span>
    </label>
  )
}

export function HullDiagram() {
  const snapshot = useStability((s) => s.snapshot)
  const config = useStability((s) => s.config)
  const rollSimActive = useStability((s) => s.rollSimActive)
  const simTimeS = useStability((s) => s.simTimeS)
  const setHeelDeg = useStability((s) => s.setHeelDeg)
  const setRollSimActive = useStability((s) => s.setRollSimActive)
  const setSimTimeS = useStability((s) => s.setSimTimeS)
  const setWaveSimParam = useStability((s) => s.setWaveSimParam)

  const waveVisual: WaveVisualParams = useMemo(
    () => ({
      waveHeightM: config.waveHeightM,
      wavePeriodS: config.wavePeriodS,
      waveNoise: config.waveNoise,
      simSpeed: config.simSpeed,
    }),
    [config.waveHeightM, config.wavePeriodS, config.waveNoise, config.simSpeed],
  )

  const svgRef = useRef<SVGSVGElement>(null)
  const panStartRef = useRef({ clientX: 0, clientY: 0, panX: 0, panY: 0 })
  const zoomPanRef = useRef({ zoom: 1, pan: { x: 0, y: 0 } })
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [svgSize, setSvgSize] = useState({ w: SVG_W, h: SVG_H })
  zoomPanRef.current = { zoom, pan }
  const [isPanning, setIsPanning] = useState(false)
  const isPanningRef = useRef(false)
  const [showBuoyancy, setShowBuoyancy] = useState(true)
  const [showGravity, setShowGravity] = useState(true)
  const [showReference, setShowReference] = useState(true)
  const [showGz, setShowGz] = useState(true)
  const [showDimensions, setShowDimensions] = useState(false)

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

  const bodyPartsForView = useMemo(
    () => applyKeelDatumParts(buildHullPartsForConfig(config)),
    [
      config.presetId,
      config.customHullId,
      config.keelBallastId,
      config.params.beam,
      config.params.draft,
      config.params.freeboard,
      config.params.bilgeRadius,
      config.params.finDepth,
      config.params.keelThickness,
      config.params.demiHullWidth,
    ],
  )

  const designBoundsForCamera = useMemo((): EarthBounds => {
    if (!snapshot.ok) {
      return { xHalf: 2.5, zMin: -0.35, zMax: 3.5 }
    }
    const spanBeam = diagramHalfSpan(config, bodyPartsForView) * 2
    const m0z = snapshot.kbUpright + snapshot.bmUpright
    return computeDesignSceneBounds(
      bodyPartsForView,
      spanBeam,
      m0z,
      config.params.draft,
      config.params.freeboard,
    )
  }, [
    snapshot.ok,
    snapshot.kbUpright,
    snapshot.bmUpright,
    bodyPartsForView,
    config.presetId,
    config.params.beam,
    config.params.demiHullWidth,
    config.params.draft,
    config.params.freeboard,
  ])

  const [cameraLock, setCameraLock] = useState<DesignFrame | null>(null)

  useEffect(() => {
    if (!snapshot.ok) return
    setCameraLock({
      view: buildEarthFixedView(designBoundsForCamera),
      bounds: designBoundsForCamera,
    })
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [config.presetId, snapshot.ok])

  const designFrame = cameraLock ?? {
    view: buildEarthFixedView(designBoundsForCamera),
    bounds: designBoundsForCamera,
  }

  const { view, bounds: designBounds } = designFrame

  const showWaves = rollSimActive || simTimeS > 0
  const swayActive = snapshot.ok && showWaves && config.waveSwayEnabled
  const swayX = swayActive
    ? waveSwayOffsetM(snapshot.bEarth.x, simTimeS, waveVisual)
    : 0
  const followPanX = swayActive ? -swayX * view.scale * zoom : 0
  const displayPan = useMemo(
    () => ({ x: pan.x + followPanX, y: pan.y }),
    [pan.x, pan.y, followPanX],
  )

  const sceneBounds = useMemo(
    () => mergeEarthBounds(designBounds, designBoundsForCamera),
    [designBounds, designBoundsForCamera],
  )

  const renderBounds = useMemo(
    () => computeRenderEarthBounds(view, zoom, displayPan, sceneBounds, svgSize.w / Math.max(svgSize.h, 1)),
    [view, zoom, displayPan.x, displayPan.y, sceneBounds, svgSize.w, svgSize.h],
  )

  const fillXHalf = useMemo(
    () => fillEarthHalfWidth(view, zoom, displayPan, svgSize.w, svgSize.h),
    [view, zoom, displayPan.x, displayPan.y, svgSize.w, svgSize.h],
  )

  const fillZSpan = useMemo(
    () => fillEarthDepthSpan(view, zoom, displayPan, svgSize.w, svgSize.h, view.cy),
    [view, zoom, displayPan.x, displayPan.y, svgSize.w, svgSize.h, view.cy],
  )

  const sceneXHalf = Math.max(renderBounds.xHalf, fillXHalf)
  const sceneZDeep = Math.min(renderBounds.zMin - 8, fillZSpan.zMin)
  const sceneZTop = Math.max(renderBounds.zMax + 6, fillZSpan.zMax)

  const startPan = (e: React.PointerEvent) => {
    e.preventDefault()
    panStartRef.current = { clientX: e.clientX, clientY: e.clientY, panX: pan.x, panY: pan.y }
    isPanningRef.current = true
    setIsPanning(true)
    svgRef.current?.setPointerCapture(e.pointerId)
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button === 1 || e.button === 0) {
      startPan(e)
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isPanningRef.current) return
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const scaleX = SVG_W / rect.width
    const scaleY = SVG_H / rect.height
    const dx = (e.clientX - panStartRef.current.clientX) * scaleX
    const dy = (e.clientY - panStartRef.current.clientY) * scaleY
    setPan({
      x: panStartRef.current.panX + dx,
      y: panStartRef.current.panY + dy,
    })
  }

  const onPointerUp = () => {
    isPanningRef.current = false
    setIsPanning(false)
  }

  const onHeelSlider = (deg: number) => {
    setRollSimActive(false)
    setHeelDeg(deg)
  }

  const applyZoomAt = (factor: number, focalSx: number, focalSy: number) => {
    const { zoom: z, pan: p } = zoomPanRef.current
    const next = zoomAtPoint(z, p, focalSx, focalSy, factor)
    setZoom(next.zoom)
    setPan(next.pan)
  }

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const mx = ((e.clientX - rect.left) / rect.width) * SVG_W
    const my = ((e.clientY - rect.top) / rect.height) * SVG_H
    const factor = e.deltaY > 0 ? 0.92 : 1.08
    applyZoomAt(factor, mx, my)
  }

  const zoomIn = () => applyZoomAt(1.2, SVG_W / 2, SVG_H / 2)
  const zoomOut = () => applyZoomAt(1 / 1.2, SVG_W / 2, SVG_H / 2)
  const zoomReset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setRollSimActive(false)
    setSimTimeS(0)
    setHeelDeg(0)
  }

  useEffect(() => {
    if (!rollSimActive) return

    const st0 = useStability.getState()
    const rollState: RollState = {
      thetaRad: (st0.config.heelDeg * Math.PI) / 180,
      omegaRad: 0,
      timeS: st0.simTimeS,
    }

    let raf = 0
    let last = performance.now()

    const tick = (now: number) => {
      const st = useStability.getState()
      if (!st.rollSimActive || !st.snapshot.ok) return

      const dt = Math.min(0.033, (now - last) / 1000)
      last = now

      const hullCenters =
        st.snapshot.hullEarthParts.length > 1
          ? st.snapshot.hullEarthParts.map(
              (part) => part.reduce((sum, p) => sum + p.x, 0) / Math.max(part.length, 1),
            )
          : undefined

      const heaveModeTick =
        isMultiHullPreset(st.config.presetId) && st.snapshot.hullEarthParts.length > 1
          ? resolveMultihullHeaveMode(
              st.config.dynamicHullStabilization,
              st.config.hullStabilizationStrength,
              st.config.jointedDeck,
            )
          : 'rigid'

      const next = stepRoll(
        rollState,
        {
          gmUpright: st.snapshot.gmUpright,
          displacementKg: st.snapshot.displacementKg,
          beam: st.config.params.beam,
          gzPoints: st.gzCurve.points,
          dampingRatio: st.config.dampingRatio,
          waveHeightM: st.config.waveHeightM,
          wavePeriodS: st.config.wavePeriodS,
          waveNoise: st.config.waveNoise,
          simSpeed: st.config.simSpeed,
          hullStabilizationStrength:
            heaveModeTick === 'dynamic' ? st.config.hullStabilizationStrength : 0,
          hullStabilizationLimitM: st.config.hullStabilizationLimitM,
          hullCenterXsEarth: hullCenters,
          multihullHeaveMode: heaveModeTick,
          baseWlZ: st.snapshot.waterlineZ,
        },
        dt,
      )

      Object.assign(rollState, next)
      setSimTimeS(next.timeS)
      st.setHeelDeg((next.thetaRad * 180) / Math.PI, { fromSim: true })
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [rollSimActive, setHeelDeg, setSimTimeS])

  const toggleRollSim = () => {
    if (!snapshot.ok) return
    setRollSimActive(!rollSimActive)
  }

  if (!snapshot.ok) {
    return (
      <div className="is-diagram is-diagram--error">
        <p>{snapshot.error ?? 'Cannot compute hydrostatics'}</p>
      </div>
    )
  }

  const showWavesRender = showWaves
  const hullParts =
    snapshot.hullEarthParts.length > 0 ? snapshot.hullEarthParts : [snapshot.hullEarth]
  const hullCenterXs = hullParts.map(
    (part) => part.reduce((sum, p) => sum + p.x, 0) / Math.max(part.length, 1),
  )
  const multihullActive = isMultiHullPreset(config.presetId) && hullParts.length > 1
  const heaveMode = multihullActive
    ? resolveMultihullHeaveMode(
        config.dynamicHullStabilization,
        config.hullStabilizationStrength,
        config.jointedDeck,
      )
    : 'rigid'
  const dynamicMultihull = heaveMode === 'dynamic'
  const jointedDeck = heaveMode === 'jointed'
  const baseHeaveLayout = showWavesRender
    ? computeVesselHeaveLayout(
        swayActive ? hullCenterXs.map((x) => x + swayX) : hullCenterXs,
        swayActive ? snapshot.bEarth.x + swayX : snapshot.bEarth.x,
        snapshot.waterlineZ,
        simTimeS,
        waveVisual,
        heaveMode,
        config.hullStabilizationStrength,
        config.hullStabilizationLimitM,
      )
    : { rigidHeaveZ: 0, deckHeaveZ: 0, hullHeaveZs: hullParts.map(() => 0) }

  const bodyHullParts = applyKeelDatumParts(buildHullPartsForConfig(config))
  const bodyBridges = buildMultiHullBridges(bodyHullParts, config.presetId)

  const multiHullBridges = bodyBridges.map((bridge) => bridgeToEarth(bridge, snapshot.heelRad))

  const sortedHullIndices = hullCenterXs
    .map((cx, idx) => ({ idx, cx }))
    .sort((a, b) => a.cx - b.cx)
    .map((h) => h.idx)
  const bridgeHullPairs: [number, number][] = []
  if (config.presetId === 'catamaran' && sortedHullIndices.length >= 2) {
    bridgeHullPairs.push([sortedHullIndices[0], sortedHullIndices[sortedHullIndices.length - 1]])
  } else if (config.presetId === 'trimaran' && sortedHullIndices.length >= 3) {
    bridgeHullPairs.push([sortedHullIndices[0], sortedHullIndices[1]])
    bridgeHullPairs.push([sortedHullIndices[1], sortedHullIndices[sortedHullIndices.length - 1]])
  }

  const hullDeckTopZsEarth = hullParts.map((part) => Math.max(...part.map((p) => p.z)))

  const heaveState =
    showWavesRender && multihullActive
      ? enforceMultihullDryDeck(
          baseHeaveLayout,
          multiHullBridges.map((b) => b.platform),
          bridgeHullPairs,
          swayActive ? hullCenterXs.map((x) => x + swayX) : hullCenterXs,
          hullDeckTopZsEarth,
          snapshot.waterlineZ,
          simTimeS,
          waveVisual,
          heaveMode,
        )
      : { ...baseHeaveLayout, dryDeckBoostM: 0 }

  const rigidHeaveZ = heaveState.rigidHeaveZ
  const deckHeaveZ = heaveState.deckHeaveZ
  const hullHeaveZs = heaveState.hullHeaveZs
  const dryDeckBoostM = heaveState.dryDeckBoostM
  const hzDeck = (z: number) => z + deckHeaveZ
  const flipEarth = (p: Vec2, heaveZ = deckHeaveZ) => view.flip(p.x + swayX, p.z + heaveZ)
  const flipEarthFixed = (p: Vec2, heaveZ = deckHeaveZ) => view.flip(p.x, p.z + heaveZ)
  const flipDeck = (p: Vec2) => flipEarth(p, deckHeaveZ)
  const flipDeckFixed = (p: Vec2) => flipEarthFixed(p, deckHeaveZ)

  const hullPaths = hullParts
    .filter((part) => part.length >= 3)
    .map((part, i) =>
      toPath(part.map((p) => view.flip(p.x + swayX, p.z + (hullHeaveZs[i] ?? deckHeaveZ)))),
    )

  const keelAppendagePartIndex = customHullKeelPartIndex(config)
  const hullFill = (i: number) =>
    i === keelAppendagePartIndex ? 'rgba(240, 163, 94, 0.28)' : 'rgba(22, 34, 46, 0.52)'
  const hullStroke = (i: number) => (i === keelAppendagePartIndex ? '#e0954a' : '#8fa3b0')
  const hullStrokeOpacity = (i: number) => (i === keelAppendagePartIndex ? 0.92 : 0.56)

  const multihullPitch = jointedDeck
  const bridgePlatformDepth = (i: number) => {
    const body = bodyBridges[i]
    if (!body) return 0.12
    return Math.max(0.05, body.platform[3].z - body.platform[0].z)
  }
  const hullDeckZ = (idx: number) =>
    Math.max(...hullParts[idx].map((p) => p.z)) + (hullHeaveZs[idx] ?? deckHeaveZ)
  const stabSaturated =
    dynamicMultihull &&
    showWaves &&
    (Math.abs(rigidHeaveZ * config.hullStabilizationStrength) >
      config.hullStabilizationLimitM * 0.98 ||
      dryDeckBoostM > 0.05)

  const wlY = view.flip(0, snapshot.waterlineZ).sy
  const waterFadePx = Math.max(100, view.scale * 2.4)
  const waveExtent = sceneXHalf
  const waveVisStep = 0.12
  const waveClipStep = 0.05
  const flatWaterPath = earthRectPath(
    view,
    -sceneXHalf,
    sceneXHalf,
    sceneZDeep,
    snapshot.waterlineZ,
  )
  const flatAboveWaterClip = earthRectPath(
    view,
    -sceneXHalf,
    sceneXHalf,
    snapshot.waterlineZ,
    sceneZTop,
  )
  const flatBelowWaterClip = flatWaterPath
  const waveWaterPath = showWaves
    ? buildWaveWaterPath(
        view,
        snapshot.waterlineZ,
        simTimeS,
        waveVisual,
        waveExtent,
        waveClipStep,
        sceneZDeep,
      )
    : null
  const waveAboveClipPath = showWaves
    ? buildWaveAboveClipPath(
        view,
        snapshot.waterlineZ,
        simTimeS,
        sceneZTop,
        waveVisual,
        waveExtent,
        waveClipStep,
      )
    : null
  const waveLinePath = showWaves
    ? buildWaveSurfaceLine(
        view,
        snapshot.waterlineZ,
        simTimeS,
        waveVisual,
        waveExtent,
        waveVisStep,
      )
    : null

  const kb = snapshot.kbUpright
  const bm = snapshot.bmUpright
  const km = kb + bm

  const m0Earth: Vec2 = { x: 0, z: km }
  const showMetaCircle = bm > 0.01
  const metaRadiusM = Math.hypot(
    snapshot.bEarthUpright.x - m0Earth.x,
    snapshot.bEarthUpright.z - m0Earth.z,
  )
  const circleR = metaRadiusM * view.scale

  const mPlumb = view.flip(m0Earth.x, hzDeck(m0Earth.z))
  const b0 = flipDeckFixed(snapshot.bEarthUpright)
  const g0 = flipDeckFixed(snapshot.gEarthUpright)

  const kHull = flipEarth(snapshot.kEarth)
  const g = flipEarth(snapshot.gEarth)
  const b = flipEarth(snapshot.bEarth)

  const heeled = Math.abs(config.heelDeg) > 0.5
  const bPlumbAtG = view.flip(snapshot.bEarth.x + swayX, hzDeck(snapshot.gEarth.z))

  const tp = (p: ScreenPt) => applyPanZoom(p.sx, p.sy, zoom, displayPan)

  let mAngleArc: { d: string; lx: number; ly: number } | null = null
  if (heeled && bm > 0.01) {
    const mS = tp(mPlumb)
    const b0S = tp(b0)
    const bS = tp(b)
    const a0 = Math.atan2(b0S.sy - mS.sy, b0S.sx - mS.sx)
    const a1 = Math.atan2(bS.sy - mS.sy, bS.sx - mS.sx)
    const armLen = Math.min(
      Math.hypot(b0S.sx - mS.sx, b0S.sy - mS.sy),
      Math.hypot(bS.sx - mS.sx, bS.sy - mS.sy),
    )
    const r = Math.max(10, Math.min(armLen * 0.38, circleR > 0 ? circleR * 0.42 * zoom : 22))
    const { d, midAngle } = angleArcPath(mS.sx, mS.sy, r, a0, a1)
    const labelR = r + 11
    mAngleArc = {
      d,
      lx: mS.sx + labelR * Math.cos(midAngle),
      ly: mS.sy + labelR * Math.sin(midAngle),
    }
  }

  const marks: PointMark[] = [
    { id: 'k', symbol: 'K', title: 'Keel', pt: tp(kHull), color: COL.k, layer: 'reference' },
    { id: 'g', symbol: 'G', title: 'Center of gravity', pt: tp(g), color: COL.g, layer: 'gravity' },
    { id: 'b', symbol: 'B', title: 'Center of buoyancy', pt: tp(b), color: COL.b, layer: 'buoyancy' },
    {
      id: 'm',
      symbol: 'M',
      title: 'Metacenter (fixed on upright plumb)',
      pt: tp(mPlumb),
      color: COL.m,
      layer: 'reference',
    },
  ]

  if (heeled) {
    marks.push(
      {
        id: 'g0',
        symbol: 'G₀',
        title: 'Center of gravity — upright',
        pt: tp(g0),
        color: COL.g,
        ghost: true,
        layer: 'gravity',
      },
      {
        id: 'b0',
        symbol: 'B₀',
        title: 'Center of buoyancy — upright',
        pt: tp(b0),
        color: COL.b,
        ghost: true,
        layer: 'buoyancy',
      },
    )
  }

  const visibleMarks = marks.filter((mk) => {
    if (mk.layer === 'gravity') return showGravity
    if (mk.layer === 'buoyancy') return showBuoyancy
    if (mk.layer === 'reference') return showReference
    return true
  })

  const gS = tp(g)
  const bPlumbAtGS = tp(bPlumbAtG)

  const displayEarthParts = hullParts.map((part, i) =>
    part.map((p) => ({ x: p.x + swayX, z: p.z + (hullHeaveZs[i] ?? deckHeaveZ) })),
  )

  const dimensionSpecs = computeDimensionSpecs({
    config,
    bodyParts: bodyHullParts,
    displayEarthParts,
    hullHeaveZs,
    deckHeaveZ,
    actualWlEarthZ: (x) =>
      showWaves
        ? waveSurfaceZ(x, snapshot.waterlineZ, simTimeS, waveVisual)
        : snapshot.waterlineZ + deckHeaveZ,
    heelRad: snapshot.heelRad,
  })

  return (
    <div className="is-diagram">
      <div className="is-diagram__header" onPointerDown={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={`is-diagram__sim-btn${rollSimActive ? ' is-diagram__sim-btn--active' : ''}`}
          onClick={toggleRollSim}
          title={rollSimActive ? 'Pause wave roll simulation' : 'Play wave roll simulation'}
          aria-label={rollSimActive ? 'Pause simulation' : 'Play simulation'}
        >
          {rollSimActive ? <Pause size={14} /> : <Play size={14} />}
          <span>{rollSimActive ? 'Pause simulation' : 'Play simulation'}</span>
        </button>

        {dynamicMultihull && showWaves && (
          <span
            className={`is-diagram__stab-badge${stabSaturated ? ' is-diagram__stab-badge--warn' : ''}`}
          >
            {stabSaturated
              ? dryDeckBoostM > 0.05
                ? 'Keeping deck dry · stabilizer working hard'
                : 'Stabilizer at limit · deck moving'
              : 'Deck stabilized · hulls tracking swell'}
          </span>
        )}

        {jointedDeck && showWaves && (
          <span className="is-diagram__stab-badge is-diagram__stab-badge--joint">
            Jointed deck · pitching with hulls
          </span>
        )}

        <div className="is-diagram__layers is-diagram__layers--header">
          <label
            className={`is-diagram__layer${showWaves ? '' : ' is-diagram__layer--muted'}`}
          >
            <Toggle
              on={config.waveSwayEnabled}
              onChange={(on) => setWaveSimParam('waveSwayEnabled', on)}
              locked={!showWaves}
              label="Sway (X)"
            />
            <span className="is-diagram__layer-label">Sway (X)</span>
            <HelpPopover title="Sway (X)">
              Adds horizontal wave orbital motion in the section view. The camera follows the hull;
              stability numbers (G, B, GM) stay earth-fixed.
            </HelpPopover>
          </label>
          <LayerToggle label="Gravity" on={showGravity} onChange={setShowGravity} />
          <LayerToggle label="Buoyancy" on={showBuoyancy} onChange={setShowBuoyancy} />
          <LayerToggle label="Reference" on={showReference} onChange={setShowReference} />
          <LayerToggle label="GZ (θ)" on={showGz} onChange={setShowGz} />
          <LayerToggle label="Dimensions" on={showDimensions} onChange={setShowDimensions} />
        </div>

        <div className="is-diagram__toolbar">
          <button type="button" className="is-diagram__zoom-btn" onClick={zoomOut} title="Zoom out" aria-label="Zoom out">
            <Minus size={14} />
          </button>
          <span className="is-diagram__zoom-label">{Math.round(zoom * 100)}%</span>
          <button type="button" className="is-diagram__zoom-btn" onClick={zoomIn} title="Zoom in" aria-label="Zoom in">
            <Plus size={14} />
          </button>
          <button type="button" className="is-diagram__zoom-btn" onClick={zoomReset} title="Reset view & upright" aria-label="Reset view and upright">
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        preserveAspectRatio="xMidYMid slice"
        className="is-diagram__svg"
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onWheel={onWheel}
      >
        <g transform={panZoomTransform(zoom, displayPan)}>
          <rect x={-EXT} y={-EXT} width={EXT * 2} height={EXT * 2} fill="transparent" />

          <defs>
            <clipPath id="is-hull-clip">
              {hullPaths.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </clipPath>
            <clipPath id="is-above-water-clip">
              <path d={waveAboveClipPath ?? flatAboveWaterClip} />
            </clipPath>
            <clipPath id="is-below-water-clip">
              {waveWaterPath ? (
                <path d={waveWaterPath} />
              ) : (
                <path d={flatBelowWaterClip} />
              )}
            </clipPath>
            <linearGradient
              id="is-water-fill"
              gradientUnits="userSpaceOnUse"
              x1={0}
              y1={wlY}
              x2={0}
              y2={wlY + waterFadePx}
            >
              <stop offset="0%" stopColor="rgba(72, 210, 205, 0.42)" />
              <stop offset="38%" stopColor="rgba(48, 155, 195, 0.22)" />
              <stop offset="100%" stopColor="rgba(28, 88, 158, 0.07)" />
            </linearGradient>
          </defs>

          <g pointerEvents="none">
            <DiagramGrid
              view={view}
              xHalf={sceneXHalf}
              zMin={sceneZDeep}
              zMax={sceneZTop}
            />
          </g>

          {waveWaterPath ? (
            <path d={waveWaterPath} fill="url(#is-water-fill)" pointerEvents="none" />
          ) : (
            <path d={flatWaterPath} fill="url(#is-water-fill)" pointerEvents="none" />
          )}

          {waveLinePath && (
            <path
              d={waveLinePath}
              fill="none"
              stroke="rgba(64, 175, 200, 0.58)"
              strokeWidth={1.2}
              pointerEvents="none"
              {...NON_SCALING}
            />
          )}

          {/* Full hull body — underwater portion is covered by the wave fill below */}
          {hullPaths.map((d, i) => (
            <path
              key={`hull-fill-${i}`}
              d={d}
              fill={hullFill(i)}
              stroke="none"
              clipPath="url(#is-hull-clip)"
              pointerEvents="none"
            />
          ))}

          {/* Water + buoyancy inside hull — clipped to hull ∩ below free surface (follows waves) */}
          <g clipPath="url(#is-below-water-clip)">
            <g clipPath="url(#is-hull-clip)">
              {hullPaths.map((d, i) => (
                <path
                  key={`hull-water-${i}`}
                  d={d}
                  fill="url(#is-water-fill)"
                  pointerEvents="none"
                />
              ))}
              {showBuoyancy &&
                hullPaths.map((d, i) => (
                  <path
                    key={`hull-buoy-${i}`}
                    d={d}
                    fill="rgba(48, 155, 195, 0.16)"
                    pointerEvents="none"
                  />
                ))}
            </g>
          </g>

          {/* Underwater hull outline — stroke traces wavy free surface on hull */}
          <g clipPath="url(#is-below-water-clip)">
            {hullPaths.map((d, i) => (
              <path
                key={`hull-stroke-below-${i}`}
                d={d}
                fill="none"
                stroke={hullStroke(i)}
                strokeWidth={i === keelAppendagePartIndex ? 1.75 : 1.5}
                pointerEvents="none"
                {...NON_SCALING}
              />
            ))}
          </g>
          {/* Above-water hull outline */}
          {hullPaths.map((d, i) => (
            <path
              key={`hull-stroke-above-${i}`}
              d={d}
              fill="none"
              stroke={hullStroke(i)}
              strokeWidth={1.5}
              strokeOpacity={hullStrokeOpacity(i)}
              clipPath="url(#is-above-water-clip)"
              pointerEvents="none"
              {...NON_SCALING}
            />
          ))}

          {/* Multi-hull deck bridges (above waterline only) */}
          {multiHullBridges.length > 0 && (
            <g clipPath="url(#is-above-water-clip)" pointerEvents="none">
              {multiHullBridges.map((bridge, i) => {
                const pair = bridgeHullPairs[i]
                const platformDepth = bridgePlatformDepth(i)
                const leftDeckZ = pair ? hullDeckZ(pair[0]) : deckHeaveZ
                const rightDeckZ = pair ? hullDeckZ(pair[1]) : deckHeaveZ

                const jointedCorners =
                  multihullPitch && pair
                    ? buildJointedBridgeQuad(
                        bridge.lower.x1,
                        bridge.lower.x2,
                        leftDeckZ,
                        rightDeckZ,
                        platformDepth,
                      )
                    : null

                const platformPath = dynamicMultihull
                  ? toPath(bridge.platform.map((p) => flipDeck(p)))
                  : jointedCorners
                    ? toPath(jointedCorners.map((p) => view.flip(p.x + swayX, p.z)))
                    : toPath(bridge.platform.map((p) => flipDeck(p)))

                const topLeft = dynamicMultihull
                  ? flipDeck(bridge.platform[3])
                  : jointedCorners
                    ? view.flip(jointedCorners[3].x + swayX, jointedCorners[3].z)
                    : flipDeck(bridge.platform[3])
                const topRight = dynamicMultihull
                  ? flipDeck(bridge.platform[2])
                  : jointedCorners
                    ? view.flip(jointedCorners[2].x + swayX, jointedCorners[2].z)
                    : flipDeck(bridge.platform[2])
                const lowLeft = dynamicMultihull
                  ? view.flip(bridge.lower.x1 + swayX, hzDeck(bridge.lower.z1))
                  : jointedCorners
                    ? view.flip(jointedCorners[0].x + swayX, jointedCorners[0].z)
                    : flipDeck(bridge.platform[0])
                const lowRight = dynamicMultihull
                  ? view.flip(bridge.lower.x2 + swayX, hzDeck(bridge.lower.z2))
                  : jointedCorners
                    ? view.flip(jointedCorners[1].x + swayX, jointedCorners[1].z)
                    : flipDeck(bridge.platform[1])
                const leftDeckPt =
                  dynamicMultihull && pair
                    ? view.flip(bridge.lower.x1 + swayX, hullDeckZ(pair[0]))
                    : null
                const rightDeckPt =
                  dynamicMultihull && pair
                    ? view.flip(bridge.lower.x2 + swayX, hullDeckZ(pair[1]))
                    : null
                return (
                  <g key={`bridge-${i}`}>
                    <path
                      d={platformPath}
                      fill="rgba(22, 34, 46, 0.52)"
                      stroke="none"
                    />
                    {dynamicMultihull && leftDeckPt && (
                      <line
                        x1={lowLeft.sx}
                        y1={lowLeft.sy}
                        x2={leftDeckPt.sx}
                        y2={leftDeckPt.sy}
                        stroke="#7ec8e3"
                        strokeWidth={1}
                        strokeDasharray="3 2"
                        strokeOpacity={0.55}
                        {...NON_SCALING}
                      />
                    )}
                    {dynamicMultihull && rightDeckPt && (
                      <line
                        x1={lowRight.sx}
                        y1={lowRight.sy}
                        x2={rightDeckPt.sx}
                        y2={rightDeckPt.sy}
                        stroke="#7ec8e3"
                        strokeWidth={1}
                        strokeDasharray="3 2"
                        strokeOpacity={0.55}
                        {...NON_SCALING}
                      />
                    )}
                    <line
                      x1={topLeft.sx}
                      y1={topLeft.sy}
                      x2={topRight.sx}
                      y2={topRight.sy}
                      stroke="#8fa3b0"
                      strokeWidth={1.5}
                      strokeOpacity={0.56}
                      {...NON_SCALING}
                    />
                    <line
                      x1={lowLeft.sx}
                      y1={lowLeft.sy}
                      x2={lowRight.sx}
                      y2={lowRight.sy}
                      stroke="#8fa3b0"
                      strokeWidth={1.2}
                      strokeOpacity={0.45}
                      {...NON_SCALING}
                    />
                  </g>
                )
              })}
            </g>
          )}

          <g pointerEvents="none">
            {showBuoyancy && kb > 0.02 && (
              <line
                x1={kHull.sx}
                y1={kHull.sy}
                x2={b.sx}
                y2={b.sy}
                stroke={COL.b}
                strokeWidth={1.2}
                strokeDasharray={COL.dash}
                opacity={0.45}
                {...NON_SCALING}
              />
            )}

            {showGravity && snapshot.kg > 0.02 && (
              <line
                x1={kHull.sx}
                y1={kHull.sy}
                x2={g0.sx}
                y2={g0.sy}
                stroke={COL.g}
                strokeWidth={1.2}
                strokeDasharray={COL.dash}
                opacity={0.45}
                {...NON_SCALING}
              />
            )}

            {showGravity && heeled && snapshot.kg > 0.02 && (
              <line
                x1={kHull.sx}
                y1={kHull.sy}
                x2={g.sx}
                y2={g.sy}
                stroke={COL.g}
                strokeWidth={1.2}
                strokeDasharray={COL.dash}
                opacity={0.65}
                {...NON_SCALING}
              />
            )}

            {showReference && showGravity && (
            <line
              x1={g0.sx}
              y1={g0.sy}
              x2={mPlumb.sx}
              y2={mPlumb.sy}
              stroke={COL.m}
              strokeWidth={1.2}
              strokeDasharray={COL.dashLong}
              opacity={0.45}
              {...NON_SCALING}
            />
            )}

            {showReference && showMetaCircle && (
              <circle
                cx={mPlumb.sx}
                cy={mPlumb.sy}
                r={circleR}
                fill="none"
                stroke={COL.m}
                strokeWidth={1.2}
                strokeDasharray={COL.dashLong}
                opacity={0.5}
                {...NON_SCALING}
              />
            )}

            {heeled && (
              <>
                {showGravity && (
                <line
                  x1={g0.sx}
                  y1={g0.sy}
                  x2={g.sx}
                  y2={g.sy}
                  stroke={COL.g}
                  strokeWidth={1}
                  strokeDasharray={COL.dash}
                  opacity={0.4}
                  {...NON_SCALING}
                />
                )}
                {showBuoyancy && (
                <line
                  x1={b0.sx}
                  y1={b0.sy}
                  x2={b.sx}
                  y2={b.sy}
                  stroke={COL.b}
                  strokeWidth={1}
                  strokeDasharray={COL.dash}
                  opacity={0.4}
                  {...NON_SCALING}
                />
                )}
                {showReference && showBuoyancy && (
                <>
                <line
                  x1={mPlumb.sx}
                  y1={mPlumb.sy}
                  x2={b0.sx}
                  y2={b0.sy}
                  stroke={COL.m}
                  strokeWidth={1}
                  strokeDasharray={COL.dash}
                  opacity={0.3}
                  {...NON_SCALING}
                />
                <line
                  x1={mPlumb.sx}
                  y1={mPlumb.sy}
                  x2={b.sx}
                  y2={b.sy}
                  stroke={COL.m}
                  strokeWidth={1}
                  strokeDasharray={COL.dash}
                  opacity={0.45}
                  {...NON_SCALING}
                />
                </>
                )}
                {showBuoyancy && (
                <line
                  x1={b.sx}
                  y1={b.sy}
                  x2={bPlumbAtG.sx}
                  y2={bPlumbAtG.sy}
                  stroke={COL.b}
                  strokeWidth={1}
                  strokeDasharray={COL.dash}
                  opacity={0.35}
                  {...NON_SCALING}
                />
                )}
              </>
            )}
          </g>

          {showDimensions && dimensionSpecs.length > 0 && (
            <DimensionLines specs={dimensionSpecs} view={view} heelRad={snapshot.heelRad} />
          )}
        </g>

        <g className="is-diagram__overlay">
          {showDimensions && dimensionSpecs.length > 0 && (
            <DimensionLabels
              specs={dimensionSpecs}
              view={view}
              heelRad={snapshot.heelRad}
              tp={tp}
            />
          )}
          {heeled && showReference && showBuoyancy && mAngleArc && (
            <path
              d={mAngleArc.d}
              fill="none"
              stroke={COL.m}
              strokeWidth={1.1}
              opacity={0.75}
            />
          )}
          {showGz && heeled && (
            <>
              <line
                x1={gS.sx}
                y1={gS.sy}
                x2={bPlumbAtGS.sx}
                y2={bPlumbAtGS.sy}
                stroke={COL.gz}
                strokeWidth={1.5}
              />
              <polygon
                points={
                  bPlumbAtGS.sx >= gS.sx
                    ? `${bPlumbAtGS.sx},${bPlumbAtGS.sy} ${bPlumbAtGS.sx - 6},${bPlumbAtGS.sy - 2.5} ${bPlumbAtGS.sx - 6},${bPlumbAtGS.sy + 2.5}`
                    : `${bPlumbAtGS.sx},${bPlumbAtGS.sy} ${bPlumbAtGS.sx + 6},${bPlumbAtGS.sy - 2.5} ${bPlumbAtGS.sx + 6},${bPlumbAtGS.sy + 2.5}`
                }
                fill={COL.gz}
              />
              <text
                x={(gS.sx + bPlumbAtGS.sx) / 2}
                y={gS.sy - 10}
                fill={COL.gz}
                fontSize={8}
                fontWeight={600}
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {`GZ = ${Math.abs(snapshot.gz).toFixed(2)} m`}
              </text>
            </>
          )}
          {heeled && showReference && mAngleArc && (
            <text
              x={mAngleArc.lx}
              y={mAngleArc.ly}
              fill={COL.m}
              fontSize={8}
              fontWeight={600}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              θ {config.heelDeg.toFixed(1)}°
            </text>
          )}
          {visibleMarks.map((mk) => (
            <PointMarker key={mk.id} {...mk} />
          ))}
        </g>
      </svg>

      <div className="is-diagram__footer" onPointerDown={(e) => e.stopPropagation()}>
        <div className="is-diagram__heel-bar">
          <label className="is-diagram__heel-label" htmlFor="is-heel-slider">
            Heel θ: {config.heelDeg.toFixed(1)}°
          </label>
          <input
            id="is-heel-slider"
            className="is-diagram__heel-slider"
            type="range"
            min={-180}
            max={180}
            step={0.5}
            value={config.heelDeg}
            onChange={(e) => onHeelSlider(parseFloat(e.target.value))}
          />
        </div>
      </div>
    </div>
  )
}

function PointNameLabel({
  x,
  y,
  text,
  color,
  visible,
  ghost,
}: {
  x: number
  y: number
  text: string
  color: string
  visible: boolean
  ghost?: boolean
}) {
  const textRef = useRef<SVGTextElement>(null)
  const [size, setSize] = useState({ w: 0, h: 8 })

  useLayoutEffect(() => {
    const el = textRef.current
    if (!el) return
    const b = el.getBBox()
    setSize({ w: b.width, h: b.height })
  }, [text])

  const padX = 5
  const padY = 3
  const opacity = visible ? (ghost ? 0.88 : 1) : 0

  return (
    <g className="is-diagram__point-name" opacity={opacity}>
      {size.w > 0 && (
        <rect
          x={x - padX}
          y={y - size.h / 2 - padY}
          width={size.w + padX * 2}
          height={size.h + padY * 2}
          rx={5}
          ry={5}
          fill="rgba(8, 14, 22, 0.92)"
          stroke="rgba(255, 255, 255, 0.14)"
          strokeWidth={0.75}
          pointerEvents="none"
        />
      )}
      <text
        ref={textRef}
        x={x}
        y={y}
        fill={color}
        fontSize={8}
        fontWeight={500}
        dominantBaseline="middle"
        pointerEvents="none"
      >
        {text}
      </text>
    </g>
  )
}

function PointMarker({
  symbol,
  title,
  pt,
  color,
  ghost,
}: PointMark) {
  const [hover, setHover] = useState(false)
  const dotR = ghost ? 2.5 : 3
  const fontSize = ghost ? 8 : 9
  const labelX = pt.sx + dotR + 4
  const symbolW = symbol.length > 1 ? 14 : 8
  const nameX = labelX + symbolW + 3

  return (
    <g
      className="is-diagram__point"
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      <circle cx={pt.sx} cy={pt.sy} r={12} fill="transparent" />
      <circle
        cx={pt.sx}
        cy={pt.sy}
        r={dotR}
        fill={ghost ? 'none' : color}
        stroke={color}
        strokeWidth={ghost ? 1 : 1.2}
        strokeDasharray={ghost ? '2 1.5' : undefined}
        opacity={ghost ? 0.8 : 1}
        pointerEvents="none"
      />
      <>
          <text
            x={labelX}
            y={pt.sy}
            fill={color}
            fontSize={fontSize}
            fontWeight={700}
            dominantBaseline="middle"
            opacity={ghost ? 0.85 : 1}
            pointerEvents="none"
          >
            {symbol}
          </text>
          <PointNameLabel
            x={nameX}
            y={pt.sy}
            text={title}
            color={color}
            visible={hover}
            ghost={ghost}
          />
        </>
    </g>
  )
}

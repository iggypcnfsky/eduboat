import { useLayoutEffect, useRef, useState } from 'react'
import { bodyToEarth } from '../sim/geometry'
import { customHullKeelPartIndex, designWaterlineZ } from '../sim/keel-config'
import { isCustomHullPreset, isMultiHullPreset } from '../sim/hull-presets'
import {
  bodyToExportPoint,
  bodyToExportY,
  computeExportViewBox,
  customHullClosedPathD,
  deriveHullParams,
  exportPointToBody,
  exportSvgDasharray,
  exportSvgLength,
  sampleCustomHullOutline,
  type CustomHullDesign,
} from '../sim/custom-hull'
import type { SimConfig, Vec2 } from '../sim/types'

const DIM_COLOR = '#8faec0'
const DESIGN_DRAFT_COLOR = '#d4a574'
const ACTUAL_DRAFT_COLOR = '#48c8c0'
/** Gap from hull surface to the dimension line (meters, body frame). */
const GAP_FROM_HULL_M = 0.62
/** Extra spacing between parallel vertical callouts on the same side (m). */
const VERT_LANE_STAGGER_M = 0.42
/** Beam dimension line above deck (m). */
const BEAM_ABOVE_DECK_M = 0.5
const FIN_DEPTH_MIN = 0.05
const DESIGN_DRAFT_DASH = '5 3'
/** Earth +x = screen right — design dims starboard, actual dims port (fixed under heel/heave). */
const DESIGN_DIM_SIDE = 1
const ACTUAL_DIM_SIDE = -1
export const DIM_LABEL_FONT_PX = 4
export const DESIGN_DIM_MUTED_OPACITY = 0.3

const NON_SCALING = { vectorEffect: 'non-scaling-stroke' as const }

export type DimensionHoverProps = {
  mutedOpacity?: number
  hoveredId?: string | null
  onHoverId?: (id: string | null) => void
}

function dimensionGroupOpacity(
  specId: string,
  mutedOpacity: number | undefined,
  hoveredId: string | null | undefined,
): number {
  if (mutedOpacity === undefined) return 1
  if (!hoveredId) return mutedOpacity
  return hoveredId === specId ? 1 : mutedOpacity
}

export type ViewTransform = {
  scale: number
  cx: number
  cy: number
  flip: (x: number, z: number) => { sx: number; sy: number }
}

type ScreenPt = { sx: number; sy: number }

export type DimensionAxis = 'horizontal' | 'vertical'

export type DimensionSpec = {
  id: string
  label: string
  valueM: number
  aBody: Vec2
  bBody: Vec2
  axis: DimensionAxis
  /** Port (-1) or starboard (+1) for vertical dims; above (+1) for horizontal beam */
  offsetSign: number
  heaveZ: number
  /** When true, aBody/bBody are earth-frame coords (heeled, heaved) — no bodyToEarth at render */
  earthFrame?: boolean
  /** Hull center x and half-beam for outboard placement */
  centerX: number
  halfBeam: number
  /** Distance from hull edge to dimension line (m) */
  offsetM: number
  /** Override stroke color (defaults to DIM_COLOR) */
  color?: string
  strokeDasharray?: string
}

export type DimensionScene = {
  config: SimConfig
  /** Upright body parts (keel datum) for design WL reference */
  bodyParts: Vec2[][]
  /** Earth-frame hull parts with heave — must match drawn hull paths */
  displayEarthParts: Vec2[][]
  hullHeaveZs: number[]
  deckHeaveZ: number
  /** Local equilibrium / wave surface height in earth frame (m) */
  actualWlEarthZ: (centerXEarth: number) => number
  heelRad: number
}

function partMinZ(part: Vec2[]): number {
  return Math.min(...part.map((p) => p.z))
}

function partMaxZ(part: Vec2[]): number {
  return Math.max(...part.map((p) => p.z))
}

function isCustomParametricAppendagePart(config: SimConfig, hullIndex: number): boolean {
  return isCustomHullPreset(config.presetId) && customHullKeelPartIndex(config) === hullIndex
}

function beamHalfAtWl(part: Vec2[], centerX: number, wlZ: number, fallback: number): number {
  const tol = 0.12
  const nearWl = part.filter((p) => Math.abs(p.z - wlZ) <= tol)
  if (nearWl.length >= 2) {
    const xs = nearWl.map((p) => Math.abs(p.x - centerX))
    return Math.max(...xs, 0.1)
  }
  const xs = part.map((p) => Math.abs(p.x - centerX))
  return Math.max(...xs, fallback / 2, 0.1)
}

function hullCenterX(part: Vec2[]): number {
  return part.reduce((s, p) => s + p.x, 0) / Math.max(part.length, 1)
}

function minKeelEarthZ(earthParts: Vec2[][]): number {
  return Math.min(...earthParts.flatMap((part) => part.map((p) => p.z)))
}

function minKeelBodyZ(bodyParts: Vec2[][]): number {
  return Math.min(...bodyParts.flatMap((part) => part.map((p) => p.z)))
}

function bodyPointEarth(p: Vec2, heelRad: number, heaveZ: number): Vec2 {
  const e = bodyToEarth(p, heelRad)
  return { x: e.x, z: e.z + heaveZ }
}

const EARTH_SPEC = { earthFrame: true as const, heaveZ: 0 }

export function computeDimensionSpecs(scene: DimensionScene): DimensionSpec[] {
  const { config, bodyParts, displayEarthParts, hullHeaveZs, deckHeaveZ, actualWlEarthZ, heelRad } =
    scene
  if (bodyParts.length === 0 || displayEarthParts.length === 0) return []

  const isMulti = isMultiHullPreset(config.presetId)
  const designWlBodyZ = designWaterlineZ(config)
  const keelBodyZ = minKeelBodyZ(bodyParts)
  const keelEarthZ = minKeelEarthZ(displayEarthParts)

  const indexed = bodyParts
    .map((part, i) => ({
      bodyPart: part,
      earthPart: displayEarthParts[i] ?? part,
      i,
      cx: hullCenterX(displayEarthParts[i] ?? part),
    }))
    .filter(({ bodyPart }) => bodyPart.length >= 3)
    .sort((a, b) => a.cx - b.cx)

  const specs: DimensionSpec[] = []

  for (let si = 0; si < indexed.length; si++) {
    const { bodyPart, earthPart, i: hullIndex } = indexed[si]
    const isParametricAppendage = isCustomParametricAppendagePart(config, hullIndex)
    const heaveZ = hullHeaveZs[hullIndex] ?? deckHeaveZ
    const centerEarthX = hullCenterX(earthPart)
    const centerBodyX = hullCenterX(bodyPart)
    const deckBodyZ = partMaxZ(bodyPart)
    const hullBottomBodyZ =
      isMulti || isCustomHullPreset(config.presetId) ? partMinZ(bodyPart) : keelBodyZ
    const deckZ = partMaxZ(earthPart)
    const partBottomZ = partMinZ(earthPart)
    const draftRefZ =
      isMulti || isCustomHullPreset(config.presetId) ? partBottomZ : keelEarthZ
    const designWlEarthPt = bodyPointEarth({ x: centerBodyX, z: designWlBodyZ }, heelRad, heaveZ)
    const designWlZ = designWlEarthPt.z
    const designDraftBottomZ = bodyPointEarth(
      { x: centerBodyX, z: hullBottomBodyZ },
      heelRad,
      heaveZ,
    ).z
    const designDeckZ = bodyPointEarth({ x: centerBodyX, z: deckBodyZ }, heelRad, heaveZ).z
    const actualWlZ = actualWlEarthZ(centerEarthX)
    const beamFallback = isMulti
      ? Math.max(config.params.demiHullWidth, config.params.beam * 0.35)
      : config.params.beam
    const halfBeam = beamHalfAtWl(earthPart, centerEarthX, designWlZ, beamFallback)

    const prefix = indexed.length > 1 ? `h${si}-` : ''
    const designDraftValue = Math.max(0, designWlBodyZ - hullBottomBodyZ)
    const actualDraftValue = Math.max(0, actualWlZ - draftRefZ)
    const designFreeboardValue = Math.max(0, deckBodyZ - designWlBodyZ)
    const actualFreeboardValue = Math.max(0, deckZ - actualWlZ)
    const partTopBodyZ = partMaxZ(bodyPart)
    const partTopZ = partMaxZ(earthPart)
    const designFinDepthValue = Math.max(0, partTopBodyZ - keelBodyZ)
    const actualFinDepthValue = Math.max(0, Math.min(actualWlZ, partTopZ) - keelEarthZ)
    let portLane = GAP_FROM_HULL_M
    let starboardLane = GAP_FROM_HULL_M

    if (!isParametricAppendage) {
      specs.push({
        id: `${prefix}beam`,
        label: isMulti ? 'Beam (hull)' : 'Beam',
        valueM: isMulti
          ? config.params.demiHullWidth > 0.1
            ? config.params.demiHullWidth
            : halfBeam * 2
          : config.params.beam,
        aBody: { x: centerEarthX - halfBeam, z: deckZ },
        bBody: { x: centerEarthX + halfBeam, z: deckZ },
        axis: 'horizontal',
        offsetSign: 1,
        centerX: centerEarthX,
        halfBeam,
        offsetM: BEAM_ABOVE_DECK_M,
        ...EARTH_SPEC,
      })

      if (designDraftValue > 0.02) {
        specs.push({
          id: `${prefix}design-draft`,
          label: 'Design draft',
          valueM: designDraftValue,
          aBody: { x: centerEarthX, z: designDraftBottomZ },
          bBody: { x: centerEarthX, z: designWlZ },
          axis: 'vertical',
          offsetSign: DESIGN_DIM_SIDE,
          centerX: centerEarthX,
          halfBeam,
          offsetM: starboardLane,
          color: DESIGN_DRAFT_COLOR,
          strokeDasharray: DESIGN_DRAFT_DASH,
          ...EARTH_SPEC,
        })
        starboardLane += VERT_LANE_STAGGER_M
      }

      if (designFreeboardValue > 0.02) {
        specs.push({
          id: `${prefix}design-freeboard`,
          label: 'Design freeboard',
          valueM: designFreeboardValue,
          aBody: { x: centerEarthX, z: designWlZ },
          bBody: { x: centerEarthX, z: designDeckZ },
          axis: 'vertical',
          offsetSign: DESIGN_DIM_SIDE,
          centerX: centerEarthX,
          halfBeam,
          offsetM: starboardLane,
          color: DESIGN_DRAFT_COLOR,
          strokeDasharray: DESIGN_DRAFT_DASH,
          ...EARTH_SPEC,
        })
        starboardLane += VERT_LANE_STAGGER_M
      }

      if (actualDraftValue > 0.02) {
        specs.push({
          id: `${prefix}actual-draft`,
          label: 'Actual draft',
          valueM: actualDraftValue,
          aBody: { x: centerEarthX, z: draftRefZ },
          bBody: { x: centerEarthX, z: actualWlZ },
          axis: 'vertical',
          offsetSign: ACTUAL_DIM_SIDE,
          centerX: centerEarthX,
          halfBeam,
          offsetM: portLane,
          color: ACTUAL_DRAFT_COLOR,
          ...EARTH_SPEC,
        })
        portLane += VERT_LANE_STAGGER_M
      }

      if (actualFreeboardValue > 0.02) {
        specs.push({
          id: `${prefix}actual-freeboard`,
          label: 'Actual freeboard',
          valueM: actualFreeboardValue,
          aBody: { x: centerEarthX, z: actualWlZ },
          bBody: { x: centerEarthX, z: deckZ },
          axis: 'vertical',
          offsetSign: ACTUAL_DIM_SIDE,
          centerX: centerEarthX,
          halfBeam,
          offsetM: portLane,
          color: ACTUAL_DRAFT_COLOR,
          ...EARTH_SPEC,
        })
        portLane += VERT_LANE_STAGGER_M
      }
    }

    if (isParametricAppendage && designFinDepthValue > FIN_DEPTH_MIN) {
      specs.push({
        id: `${prefix}design-fin-depth`,
        label: 'Design fin depth',
        valueM: designFinDepthValue,
        aBody: {
          x: centerEarthX,
          z: bodyPointEarth({ x: centerBodyX, z: keelBodyZ }, heelRad, heaveZ).z,
        },
        bBody: {
          x: centerEarthX,
          z: bodyPointEarth({ x: centerBodyX, z: partTopBodyZ }, heelRad, heaveZ).z,
        },
        axis: 'vertical',
        offsetSign: DESIGN_DIM_SIDE,
        centerX: centerEarthX,
        halfBeam,
        offsetM: starboardLane,
        color: DESIGN_DRAFT_COLOR,
        strokeDasharray: DESIGN_DRAFT_DASH,
        ...EARTH_SPEC,
      })
    }

    if (isParametricAppendage && actualFinDepthValue > FIN_DEPTH_MIN) {
      specs.push({
        id: `${prefix}actual-fin-depth`,
        label: 'Actual fin depth',
        valueM: actualFinDepthValue,
        aBody: { x: centerEarthX, z: keelEarthZ },
        bBody: { x: centerEarthX, z: keelEarthZ + actualFinDepthValue },
        axis: 'vertical',
        offsetSign: ACTUAL_DIM_SIDE,
        centerX: centerEarthX,
        halfBeam,
        offsetM: portLane,
        color: ACTUAL_DRAFT_COLOR,
        ...EARTH_SPEC,
      })
    }
  }

  return specs
}

/** Upright cross-section dimensions for the hull editor (beam, draft, freeboard). */
export function computeEditorDimensionSpecs(
  outline: Vec2[],
  designWlZ: number,
  beam: number,
  draft: number,
  freeboard: number,
): DimensionSpec[] {
  if (outline.length < 3) return []

  const centerX = 0
  const hullBottomZ = partMinZ(outline)
  const deckZ = partMaxZ(outline)
  const halfBeam = beam / 2
  const heaveZ = 0
  const offsetSign = 1

  const specs: DimensionSpec[] = [
    {
      id: 'beam',
      label: 'Beam',
      valueM: beam,
      aBody: { x: centerX - halfBeam, z: deckZ },
      bBody: { x: centerX + halfBeam, z: deckZ },
      axis: 'horizontal',
      offsetSign: 1,
      heaveZ,
      centerX,
      halfBeam,
      offsetM: BEAM_ABOVE_DECK_M,
    },
  ]

  if (draft > 0.02 && designWlZ > hullBottomZ + 0.02) {
    specs.push({
      id: 'draft',
      label: 'Design draft',
      valueM: draft,
      aBody: { x: centerX, z: hullBottomZ },
      bBody: { x: centerX, z: designWlZ },
      axis: 'vertical',
      offsetSign,
      heaveZ,
      centerX,
      halfBeam,
      offsetM: GAP_FROM_HULL_M,
      color: DESIGN_DRAFT_COLOR,
      strokeDasharray: DESIGN_DRAFT_DASH,
    })
  }

  if (freeboard > 0.02 && deckZ > designWlZ + 0.02) {
    specs.push({
      id: 'freeboard',
      label: 'Design freeboard',
      valueM: freeboard,
      aBody: { x: centerX, z: designWlZ },
      bBody: { x: centerX, z: deckZ },
      axis: 'vertical',
      offsetSign,
      heaveZ,
      centerX,
      halfBeam,
      offsetM: GAP_FROM_HULL_M + VERT_LANE_STAGGER_M,
      color: DESIGN_DRAFT_COLOR,
      strokeDasharray: DESIGN_DRAFT_DASH,
    })
  }

  return specs
}

function bodyToScreen(
  p: Vec2,
  view: ViewTransform,
  heelRad: number,
  heaveZ: number,
  earthFrame?: boolean,
): ScreenPt {
  if (earthFrame) return view.flip(p.x, p.z)
  const e = bodyToEarth(p, heelRad)
  return view.flip(e.x, e.z + heaveZ)
}

/** Extension starts at hull outboard edge; dimension line sits offsetM beyond the edge. */
function dimensionAttachPoints(spec: DimensionSpec): { fa: Vec2; fb: Vec2; da: Vec2; db: Vec2 } {
  const { centerX, halfBeam, offsetSign, offsetM, axis, aBody, bBody } = spec

  if (axis === 'vertical') {
    const edgeX = centerX + offsetSign * halfBeam
    const dimX = centerX + offsetSign * (halfBeam + offsetM)
    return {
      fa: { x: edgeX, z: aBody.z },
      fb: { x: edgeX, z: bBody.z },
      da: { x: dimX, z: aBody.z },
      db: { x: dimX, z: bBody.z },
    }
  }

  const dimZ = aBody.z + offsetSign * offsetM
  return {
    fa: { x: aBody.x, z: aBody.z },
    fb: { x: bBody.x, z: bBody.z },
    da: { x: aBody.x, z: dimZ },
    db: { x: bBody.x, z: dimZ },
  }
}

function screenPerp(fa: ScreenPt, fb: ScreenPt): { px: number; py: number } {
  const dx = fb.sx - fa.sx
  const dy = fb.sy - fa.sy
  const len = Math.hypot(dx, dy) || 1
  return { px: -dy / len, py: dx / len }
}

function tickSegment(center: ScreenPt, perp: { px: number; py: number }, half = 4): string {
  return `${(center.sx - perp.px * half).toFixed(1)},${(center.sy - perp.py * half).toFixed(1)} ${(center.sx + perp.px * half).toFixed(1)},${(center.sy + perp.py * half).toFixed(1)}`
}

type RenderedDim = {
  spec: DimensionSpec
  fa: ScreenPt
  fb: ScreenPt
  da: ScreenPt
  db: ScreenPt
  labelPt: ScreenPt
  perp: { px: number; py: number }
}

function renderDimension(
  spec: DimensionSpec,
  view: ViewTransform,
  heelRad: number,
): RenderedDim {
  const { fa: faBody, fb: fbBody, da: daBody, db: dbBody } = dimensionAttachPoints(spec)
  const earth = spec.earthFrame === true
  const fa = bodyToScreen(faBody, view, heelRad, spec.heaveZ, earth)
  const fb = bodyToScreen(fbBody, view, heelRad, spec.heaveZ, earth)
  const da = bodyToScreen(daBody, view, heelRad, spec.heaveZ, earth)
  const db = bodyToScreen(dbBody, view, heelRad, spec.heaveZ, earth)
  const perp = screenPerp(da, db)
  return {
    spec,
    fa,
    fb,
    da,
    db,
    labelPt: { sx: (da.sx + db.sx) / 2, sy: (da.sy + db.sy) / 2 },
    perp,
  }
}

export function DimensionLines({
  specs,
  view,
  heelRad,
  mutedOpacity,
  hoveredId,
  onHoverId,
}: {
  specs: DimensionSpec[]
  view: ViewTransform
  heelRad: number
} & DimensionHoverProps) {
  const dims = specs.map((spec) => renderDimension(spec, view, heelRad))
  const interactive = onHoverId !== undefined

  return (
    <>
      <g className={`is-diagram__dim${interactive ? ' is-diagram__dim--interactive' : ''}`} pointerEvents="none">
        {dims.map(({ spec, fa, fb, da, db, perp }) => {
          const stroke = spec.color ?? DIM_COLOR
          const dash = spec.strokeDasharray ? { strokeDasharray: spec.strokeDasharray } : {}
          const groupOpacity = dimensionGroupOpacity(spec.id, mutedOpacity, hoveredId)
          return (
            <g key={spec.id} opacity={groupOpacity}>
              <line
                x1={fa.sx}
                y1={fa.sy}
                x2={da.sx}
                y2={da.sy}
                stroke={stroke}
                strokeWidth={0.75}
                strokeOpacity={0.55}
                {...dash}
                {...NON_SCALING}
              />
              <line
                x1={fb.sx}
                y1={fb.sy}
                x2={db.sx}
                y2={db.sy}
                stroke={stroke}
                strokeWidth={0.75}
                strokeOpacity={0.55}
                {...dash}
                {...NON_SCALING}
              />
              <line
                x1={da.sx}
                y1={da.sy}
                x2={db.sx}
                y2={db.sy}
                stroke={stroke}
                strokeWidth={1}
                strokeOpacity={0.85}
                {...dash}
                {...NON_SCALING}
              />
              <polyline
                points={tickSegment(da, perp)}
                fill="none"
                stroke={stroke}
                strokeWidth={1}
                strokeOpacity={0.85}
                {...dash}
                {...NON_SCALING}
              />
              <polyline
                points={tickSegment(db, perp)}
                fill="none"
                stroke={stroke}
                strokeWidth={1}
                strokeOpacity={0.85}
                {...dash}
                {...NON_SCALING}
              />
            </g>
          )
        })}
      </g>
      {interactive && (
        <g className="is-diagram__dim-hits" pointerEvents="stroke">
          {dims.map(({ spec, da, db }) => (
            <line
              key={`hit-${spec.id}`}
              x1={da.sx}
              y1={da.sy}
              x2={db.sx}
              y2={db.sy}
              stroke="transparent"
              strokeWidth={14}
              onPointerEnter={() => onHoverId?.(spec.id)}
              onPointerLeave={() => onHoverId?.(null)}
            />
          ))}
        </g>
      )}
    </>
  )
}

function DimensionLabel({
  x,
  y,
  text,
  perp,
  color = DIM_COLOR,
  fontSize = DIM_LABEL_FONT_PX,
  opacity = 1,
  onPointerEnter,
  onPointerLeave,
}: {
  x: number
  y: number
  text: string
  perp: { px: number; py: number }
  color?: string
  fontSize?: number
  opacity?: number
  onPointerEnter?: () => void
  onPointerLeave?: () => void
}) {
  const textRef = useRef<SVGTextElement>(null)
  const [size, setSize] = useState({ w: 0, h: fontSize })

  useLayoutEffect(() => {
    const el = textRef.current
    if (!el) return
    const b = el.getBBox()
    setSize({ w: b.width, h: b.height })
  }, [text, fontSize])

  const padX = Math.max(2, fontSize * 0.5)
  const padY = Math.max(1, fontSize * 0.25)
  const labelOffset = Math.max(7, fontSize * 1.75)
  const pillRx = Math.max(2, fontSize * 0.5)
  const lx = x + perp.px * labelOffset
  const ly = y + perp.py * labelOffset

  return (
    <g
      className="is-diagram__dim-label"
      opacity={opacity}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      style={onPointerEnter ? { pointerEvents: 'all', cursor: 'default' } : undefined}
    >
      {onPointerEnter && size.w > 0 && (
        <rect
          x={lx - size.w / 2 - padX - 4}
          y={ly - size.h / 2 - padY - 3}
          width={size.w + (padX + 4) * 2}
          height={size.h + (padY + 3) * 2}
          fill="transparent"
        />
      )}
      {size.w > 0 && (
        <rect
          x={lx - size.w / 2 - padX}
          y={ly - size.h / 2 - padY}
          width={size.w + padX * 2}
          height={size.h + padY * 2}
          rx={pillRx}
          ry={pillRx}
          fill="rgba(8, 14, 22, 0.88)"
          stroke={color}
          strokeOpacity={0.4}
          strokeWidth={0.75}
          pointerEvents="none"
        />
      )}
      <text
        ref={textRef}
        x={lx}
        y={ly}
        fill={color}
        fontSize={fontSize}
        fontWeight={600}
        textAnchor="middle"
        dominantBaseline="middle"
        pointerEvents="none"
      >
        {text}
      </text>
    </g>
  )
}

export function DimensionLabels({
  specs,
  view,
  heelRad,
  tp,
  fontSize = DIM_LABEL_FONT_PX,
  mutedOpacity,
  hoveredId,
  onHoverId,
}: {
  specs: DimensionSpec[]
  view: ViewTransform
  heelRad: number
  tp: (p: ScreenPt) => ScreenPt
  fontSize?: number
} & DimensionHoverProps) {
  const dims = specs.map((spec) => renderDimension(spec, view, heelRad))
  const interactive = onHoverId !== undefined

  return (
    <g className={interactive ? 'is-diagram__dim-labels--interactive' : undefined} pointerEvents={interactive ? 'auto' : 'none'}>
      {dims.map(({ spec, labelPt, perp }) => {
        const pt = tp(labelPt)
        const text = `${spec.label} ${spec.valueM.toFixed(2)} m`
        const groupOpacity = dimensionGroupOpacity(spec.id, mutedOpacity, hoveredId)
        return (
          <DimensionLabel
            key={spec.id}
            x={pt.sx}
            y={pt.sy}
            text={text}
            perp={perp}
            color={spec.color ?? DIM_COLOR}
            fontSize={fontSize}
            opacity={groupOpacity}
            onPointerEnter={interactive ? () => onHoverId?.(spec.id) : undefined}
            onPointerLeave={interactive ? () => onHoverId?.(null) : undefined}
          />
        )
      })}
    </g>
  )
}

type ExportPt = { x: number; y: number }

function exportPerp(da: ExportPt, db: ExportPt): { px: number; py: number } {
  const dx = db.x - da.x
  const dy = db.y - da.y
  const len = Math.hypot(dx, dy) || 1
  return { px: -dy / len, py: dx / len }
}

function exportTickSegment(center: ExportPt, perp: { px: number; py: number }, half: number): string {
  return `${(center.x - perp.px * half).toFixed(3)},${(center.y - perp.py * half).toFixed(3)} ${(center.x + perp.px * half).toFixed(3)},${(center.y + perp.py * half).toFixed(3)}`
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Body-frame attach points for dimension export (same geometry as on-screen). */
export function dimensionAttachBodyPoints(spec: DimensionSpec): { fa: Vec2; fb: Vec2; da: Vec2; db: Vec2 } {
  return dimensionAttachPoints(spec)
}

/** Collect body-frame points for export viewBox padding. */
export function dimensionSpecsBodyExtentPoints(specs: DimensionSpec[], beam: number): Vec2[] {
  const fontSize = exportSvgLength(Math.max(0.08, beam * 0.045))
  const labelOffset = fontSize * 1.75
  const pts: Vec2[] = []
  for (const spec of specs) {
    const { fa, fb, da, db } = dimensionAttachPoints(spec)
    pts.push(fa, fb, da, db)
    const ea = bodyToExportPoint(da)
    const eb = bodyToExportPoint(db)
    const perp = exportPerp(ea, eb)
    const text = `${spec.label} ${spec.valueM.toFixed(2)} m`
    const padX = fontSize * 0.5
    const padY = fontSize * 0.25
    const estW = text.length * fontSize * 0.55
    const estH = fontSize + padY * 2
    const lx = (ea.x + eb.x) / 2 + perp.px * labelOffset
    const ly = (ea.y + eb.y) / 2 + perp.py * labelOffset
    pts.push(exportPointToBody({ x: lx - estW / 2 - padX, y: ly - estH / 2 }))
    pts.push(exportPointToBody({ x: lx + estW / 2 + padX, y: ly + estH / 2 }))
  }
  return pts
}

/** Dimension callouts as SVG markup in export coordinates (20× body meters). */
export function dimensionSpecsToSvgMarkup(specs: DimensionSpec[], beam: number): string {
  if (specs.length === 0) return ''
  const fontSize = exportSvgLength(Math.max(0.08, beam * 0.045))
  const tickHalf = exportSvgLength(Math.max(0.03, beam * 0.02))
  const labelOffset = fontSize * 1.75
  const padX = fontSize * 0.5
  const padY = fontSize * 0.25
  const pillRx = fontSize * 0.5
  const thinStroke = exportSvgLength(0.02).toFixed(3)
  const mainStroke = exportSvgLength(0.025).toFixed(3)
  const pillStroke = exportSvgLength(0.015).toFixed(3)
  const parts: string[] = []

  for (const spec of specs) {
    const { fa, fb, da, db } = dimensionAttachPoints(spec)
    const efa = bodyToExportPoint(fa)
    const efb = bodyToExportPoint(fb)
    const eda = bodyToExportPoint(da)
    const edb = bodyToExportPoint(db)
    const perp = exportPerp(eda, edb)
    const stroke = spec.color ?? DIM_COLOR
    const dash = spec.strokeDasharray
      ? ` stroke-dasharray="${exportSvgDasharray(spec.strokeDasharray)}"`
      : ''
    const text = `${spec.label} ${spec.valueM.toFixed(2)} m`
    const estW = text.length * fontSize * 0.55
    const lx = (eda.x + edb.x) / 2 + perp.px * labelOffset
    const ly = (eda.y + edb.y) / 2 + perp.py * labelOffset

    parts.push(`<g>`)
    parts.push(
      `<line x1="${efa.x.toFixed(3)}" y1="${efa.y.toFixed(3)}" x2="${eda.x.toFixed(3)}" y2="${eda.y.toFixed(3)}" stroke="${stroke}" stroke-width="${thinStroke}" stroke-opacity="0.55"${dash}/>`,
    )
    parts.push(
      `<line x1="${efb.x.toFixed(3)}" y1="${efb.y.toFixed(3)}" x2="${edb.x.toFixed(3)}" y2="${edb.y.toFixed(3)}" stroke="${stroke}" stroke-width="${thinStroke}" stroke-opacity="0.55"${dash}/>`,
    )
    parts.push(
      `<line x1="${eda.x.toFixed(3)}" y1="${eda.y.toFixed(3)}" x2="${edb.x.toFixed(3)}" y2="${edb.y.toFixed(3)}" stroke="${stroke}" stroke-width="${mainStroke}" stroke-opacity="0.85"${dash}/>`,
    )
    parts.push(
      `<polyline points="${exportTickSegment(eda, perp, tickHalf)}" fill="none" stroke="${stroke}" stroke-width="${mainStroke}" stroke-opacity="0.85"${dash}/>`,
    )
    parts.push(
      `<polyline points="${exportTickSegment(edb, perp, tickHalf)}" fill="none" stroke="${stroke}" stroke-width="${mainStroke}" stroke-opacity="0.85"${dash}/>`,
    )
    parts.push(
      `<rect x="${(lx - estW / 2 - padX).toFixed(3)}" y="${(ly - fontSize / 2 - padY).toFixed(3)}" width="${(estW + padX * 2).toFixed(3)}" height="${(fontSize + padY * 2).toFixed(3)}" rx="${pillRx.toFixed(3)}" ry="${pillRx.toFixed(3)}" fill="rgba(8,14,22,0.88)" stroke="${stroke}" stroke-opacity="0.4" stroke-width="${pillStroke}"/>`,
    )
    parts.push(
      `<text x="${lx.toFixed(3)}" y="${ly.toFixed(3)}" fill="${stroke}" font-size="${fontSize.toFixed(3)}" font-weight="600" text-anchor="middle" dominant-baseline="middle">${escapeXml(text)}</text>`,
    )
    parts.push(`</g>`)
  }

  return parts.join('')
}

/** Annotated design SVG: hull + design waterline + dimension callouts. */
export function exportCustomHullDesignSvg(design: CustomHullDesign): string {
  const pathD = customHullClosedPathD(design)
  if (!pathD) return ''

  const outline = sampleCustomHullOutline(design)
  const params = deriveHullParams(outline, design.designWaterlineZ)
  const specs = computeEditorDimensionSpecs(
    outline,
    design.designWaterlineZ,
    params.beam,
    params.draft,
    params.freeboard,
  )
  const dimExtents = dimensionSpecsBodyExtentPoints(specs, params.beam)
  const vb = computeExportViewBox(design, dimExtents)
  const viewBox = `${vb.minX.toFixed(3)} ${vb.minY.toFixed(3)} ${vb.width.toFixed(3)} ${vb.height.toFixed(3)}`
  const title = design.name ? `<title>${escapeXml(design.name)}</title>` : ''
  const wlY = bodyToExportY(design.designWaterlineZ)
  const wlHalf = exportSvgLength(params.beam / 2 + 0.15)
  const hullStroke = exportSvgLength(0.03).toFixed(3)
  const wlStroke = exportSvgLength(0.025).toFixed(3)
  const wlDash = exportSvgDasharray('0.12 0.08')

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">`,
    title,
    `<path d="${pathD}" fill="rgba(95,212,196,0.12)" stroke="#5fd4c4" stroke-width="${hullStroke}"/>`,
    `<line x1="${(-wlHalf).toFixed(3)}" y1="${wlY.toFixed(3)}" x2="${wlHalf.toFixed(3)}" y2="${wlY.toFixed(3)}" stroke="#48c8c0" stroke-width="${wlStroke}" stroke-dasharray="${wlDash}"/>`,
    dimensionSpecsToSvgMarkup(specs, params.beam),
    `</svg>`,
  ].join('')
}

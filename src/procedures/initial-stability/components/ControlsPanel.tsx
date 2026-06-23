import { useMemo } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { Toggle } from '../../../ui/Toggle'
import { useCustomHullStore } from '../customHullStore'
import { hasCustomKeelAppendage, sampleCustomHullOutline, customHullDraftRange, customHullKeelHeight, customHullKeelHeightRange } from '../sim/custom-hull'
import { useStability, getPreset, HULL_PRESETS } from '../store'
import { isCustomHullPreset } from '../sim/hull-presets'
import { getKeelBallastOption, KEEL_BALLAST_OPTIONS } from '../sim/keel-config'
import { isMultiHullPreset } from '../sim/hull-presets'
import {
  CUSTOM_TEMPLATE_ID,
  getAllBoatTemplates,
  getTemplate,
} from '../sim/hull-templates'
import {
  MAX_TOTAL_BOAT_MASS_KG,
  MIN_VESSEL_LENGTH_M,
  MAX_VESSEL_LENGTH_M,
  defaultTotalBoatMassKg,
  weightSliderMaxKg,
} from '../sim/weight-distribution'
import { waveFrequencyHz, waveLengthDeepWater } from '../sim/roll-dynamics'
import type { HullParams, HullPresetId, KeelBallastId } from '../sim/types'
import { FieldLabel, HelpPopover } from './HelpPopover'
import { MULTIHULL_PARAM_HELP, PARAM_HELP } from './control-help'

function resolveParamHelp(
  key: keyof HullParams,
  presetId: HullPresetId,
  fallbackLabel: string,
): { title: string; text: string } {
  if (isMultiHullPreset(presetId)) {
    const mh = MULTIHULL_PARAM_HELP[key]?.[presetId as 'catamaran' | 'trimaran']
    if (mh) return mh
  }
  return PARAM_HELP[key] ?? { title: fallbackLabel, text: 'Hull geometry parameter for this cross-section.' }
}

export function ControlsPanel() {
  const config = useStability((s) => s.config)
  const snapshot = useStability((s) => s.snapshot)
  const rollSimActive = useStability((s) => s.rollSimActive)
  const setHullType = useStability((s) => s.setHullType)
  const setCustomHull = useStability((s) => s.setCustomHull)
  const openDesigner = useStability((s) => s.openDesigner)
  const setTemplate = useStability((s) => s.setTemplate)
  const setParam = useStability((s) => s.setParam)
  const setCustomKeelHeight = useStability((s) => s.setCustomKeelHeight)
  const setKeelBallastId = useStability((s) => s.setKeelBallastId)
  const setTotalBoatMass = useStability((s) => s.setTotalBoatMass)
  const setVesselLength = useStability((s) => s.setVesselLength)
  const setKeelBallastMass = useStability((s) => s.setKeelBallastMass)
  const setWaveSimParam = useStability((s) => s.setWaveSimParam)

  const hullType = getPreset(config.presetId)
  const keelOption = getKeelBallastOption(config.keelBallastId)
  const boatTemplates = useMemo(() => getAllBoatTemplates(), [])
  const customHulls = useCustomHullStore((s) => s.designs)
  const getCustomDesign = useCustomHullStore((s) => s.get)
  const isCustomHull = isCustomHullPreset(config.presetId)
  const activeCustomDesign =
    isCustomHull && config.customHullId ? getCustomDesign(config.customHullId) : undefined
  const hasDrawnKeel = activeCustomDesign ? hasCustomKeelAppendage(activeCustomDesign) : false

  const hullSelectValue =
    isCustomHull && config.customHullId
      ? `custom:${config.customHullId}`
      : config.presetId

  const activeTemplate = useMemo(() => {
    if (config.templateId === CUSTOM_TEMPLATE_ID) return undefined
    return getTemplate(config.templateId)
  }, [config.templateId])

  const templateSelectValue =
    config.templateId === CUSTOM_TEMPLATE_ID || !activeTemplate
      ? CUSTOM_TEMPLATE_ID
      : config.templateId

  const keelOptions = useMemo(() => {
    if (isMultiHullPreset(config.presetId)) {
      return KEEL_BALLAST_OPTIONS.filter((k) => k.id === 'none' || k.id === 'internal')
    }
    if (isCustomHull && hasDrawnKeel) {
      return [
        getKeelBallastOption('custom-keel'),
        getKeelBallastOption('internal'),
        getKeelBallastOption('none'),
      ]
    }
    if (isCustomHull) {
      return KEEL_BALLAST_OPTIONS.filter((k) => k.id !== 'custom-keel')
    }
    return KEEL_BALLAST_OPTIONS.filter((k) => k.id !== 'custom-keel')
  }, [config.presetId, isCustomHull, hasDrawnKeel])

  const visibleParamKeys = useMemo(() => {
    if (isCustomHull) {
      return ['draft', ...keelOption.visibleParams] as (keyof HullParams)[]
    }
    const keys = new Set<keyof HullParams>([...hullType.visibleParams, ...keelOption.visibleParams])
    return [...keys]
  }, [hullType.visibleParams, keelOption.visibleParams, isCustomHull])

  const customDraftRange = useMemo(() => {
    if (!isCustomHull || !config.customHullId) return null
    const design = customHulls.find((d) => d.id === config.customHullId)
    if (!design) return null
    const outline = sampleCustomHullOutline(design)
    const { min, max } = customHullDraftRange(outline)
    return { min, max, step: 0.05, label: 'Design draft (m)' }
  }, [isCustomHull, config.customHullId, customHulls])

  const customKeelHeightControl = useMemo(() => {
    if (!isCustomHull || !config.customHullId) return null
    const design = customHulls.find((d) => d.id === config.customHullId)
    if (!design) return null
    const { min, max } = customHullKeelHeightRange(design)
    return {
      min,
      max,
      step: 0.01,
      value: customHullKeelHeight(design),
    }
  }, [isCustomHull, config.customHullId, customHulls, config.params.draft])

  const designBoatMassKg = useMemo(() => defaultTotalBoatMassKg(config), [config])
  const weightSliderMax = useMemo(() => weightSliderMaxKg(config), [config])

  const fmtTonnes = (kg: number) => `${(kg / 1000).toFixed(2)} t`

  const keelBallastPct = ((config.keelBallastKg / Math.max(config.totalBoatMassKg, 1)) * 100).toFixed(0)

  return (
    <div className="is-panel-inner">
      <label className="is-field">
        <FieldLabel label="Hull type" helpTitle="Hull type" help={hullType.description} />
        <div className="is-field__row">
          <select
            className="is-select is-field__row-select"
            value={hullSelectValue}
            onChange={(e) => {
              const v = e.target.value
              if (v.startsWith('custom:')) {
                setCustomHull(v.slice(7))
              } else {
                setHullType(v as HullPresetId)
              }
            }}
          >
            {HULL_PRESETS.filter((p) => p.id !== 'custom').map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
            {customHulls.length > 0 && (
              <optgroup label="Custom designs">
                {customHulls.map((d) => (
                  <option key={d.id} value={`custom:${d.id}`}>
                    {d.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          {isCustomHull && config.customHullId && (
            <button
              type="button"
              className="is-icon-btn"
              onClick={() => openDesigner(config.customHullId!)}
              aria-label="Edit custom hull"
              title="Edit custom hull"
            >
              <Pencil size={15} />
            </button>
          )}
          <button
            type="button"
            className="is-icon-btn"
            onClick={() => openDesigner()}
            aria-label="Design custom hull"
            title="Design custom hull"
          >
            <Plus size={15} />
          </button>
        </div>
      </label>

      {isCustomHull && snapshot.ok && (
        <div className="is-field is-field--readonly">
          <FieldLabel
            label="Derived dimensions"
            helpTitle="Derived dimensions"
            help="Beam and freeboard are derived from your drawn outline and design waterline. Use the design draft slider below (or the editor) to move the design waterline. Saving in the editor syncs the same value. The schematic float line follows total weight."
          />
          <p className="is-field__live">
            Beam {config.params.beam.toFixed(2)} m · Freeboard {config.params.freeboard.toFixed(2)} m
          </p>
        </div>
      )}

      <label className="is-field">
        <FieldLabel
          label="Boat template"
          helpTitle="Boat template"
          help={
            isCustomHull
              ? 'Boat templates apply to built-in hull types. Select a preset hull or switch away from your custom design to use a template.'
              : activeTemplate
                ? `${activeTemplate.description} Applied to ${hullType.title} geometry.`
                : 'Parameters were changed manually — pick a template to load published dimensions.'
          }
        />
        <select
          className="is-select"
          value={templateSelectValue}
          disabled={isCustomHull}
          onChange={(e) => {
            const id = e.target.value
            if (id === CUSTOM_TEMPLATE_ID) return
            setTemplate(id)
          }}
        >
          {boatTemplates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
          {templateSelectValue === CUSTOM_TEMPLATE_ID && (
            <option value={CUSTOM_TEMPLATE_ID}>Custom (edited)</option>
          )}
        </select>
      </label>

      {isCustomHull && hasDrawnKeel && config.keelBallastId === 'custom-keel' && (
        <p className="is-field__live">
          Keel-labeled points in your design (orange in the editor). Add keel ballast mass below to model weight
          low in that region.
        </p>
      )}

      <div className="is-controls-section">
        <h4 className="is-controls-section__title is-controls-section__title--row">
          <span>Keel &amp; ballast type</span>
          <HelpPopover title="Keel &amp; ballast">
            Appendage shape and dense ballast mass low in the hull. Geometry alone does not lower G — you
            must add keel ballast mass when a keel type is selected. Mark keel points in the hull designer
            to draw your own appendage; appendage switches to Custom keel automatically.
          </HelpPopover>
        </h4>

        <label className="is-field">
          <FieldLabel label="Appendage" helpTitle="Appendage" help={keelOption.description} />
          <select
            className="is-select"
            value={config.keelBallastId}
            onChange={(e) => setKeelBallastId(e.target.value as KeelBallastId)}
          >
            {keelOptions.map((k) => (
              <option key={k.id} value={k.id}>
                {k.title}
              </option>
            ))}
          </select>
        </label>

        <label className="is-field">
          <FieldLabel
            label={
              <>
                Keel ballast: {config.keelBallastKg.toFixed(0)} kg ({fmtTonnes(config.keelBallastKg)})
              </>
            }
            helpTitle="Keel ballast"
            help={
              config.keelBallastId === 'none'
                ? 'Select a keel type to add ballast mass — appendage shape alone does not lower G.'
                : `Dense mass low in the ${keelOption.title.toLowerCase()} — lowers KG. This is a portion of total weight (now ${keelBallastPct}%), not extra mass on top. Raise total weight first if you need more ballast.`
            }
          />
          <input
            type="range"
            min={0}
            max={config.totalBoatMassKg}
            step={50}
            value={config.keelBallastKg}
            onChange={(e) => setKeelBallastMass(parseFloat(e.target.value))}
            disabled={config.keelBallastId === 'none'}
          />
        </label>
      </div>

      <label className="is-field">
        <FieldLabel
          label={`Waterline length (LWL): ${config.vesselLengthM.toFixed(1)} m`}
          helpTitle="Waterline length (LWL)"
          help="Length at the waterline (LWL). Used with total weight — the 2D slice model scales load as kg ÷ LWL. Changing LWL does not change total weight; longer length spreads the same load over more metres."
        />
        <input
          type="range"
          min={MIN_VESSEL_LENGTH_M}
          max={MAX_VESSEL_LENGTH_M}
          step={0.5}
          value={config.vesselLengthM}
          onChange={(e) => setVesselLength(parseFloat(e.target.value))}
        />
      </label>

      <label className="is-field">
        <FieldLabel
          label={
            <>
              Total weight: {config.totalBoatMassKg.toFixed(0)} kg ({fmtTonnes(config.totalBoatMassKg)})
              {snapshot.ok && (
                <span className="is-field__live"> · KG = {snapshot.kg.toFixed(2)} m</span>
              )}
            </>
          }
          helpTitle="Total weight"
          help={
            <>
              Total boat mass (includes keel ballast). Hull sliders do not change this — adjust manually to
              overload or lighten; the equilibrium waterline moves away from design draft. Cannot go below
              current keel ballast — lower keel first if you need a lighter total.
              {snapshot.ok && (
                <>
                  {' '}
                  Design displacement at current geometry ≈ {fmtTonnes(designBoatMassKg)}.
                </>
              )}
            </>
          }
        />
        {designBoatMassKg > MAX_TOTAL_BOAT_MASS_KG && (
          <p className="is-field__live">
            Design displacement exceeds the default 120 t range — slider extended to{' '}
            {fmtTonnes(weightSliderMax)}.
          </p>
        )}
        <input
          type="range"
          min={config.keelBallastKg}
          max={weightSliderMax}
          step={50}
          value={config.totalBoatMassKg}
          onChange={(e) => setTotalBoatMass(parseFloat(e.target.value))}
        />
      </label>

      {visibleParamKeys.map((key) => {
        const range =
          isCustomHull && key === 'draft' && customDraftRange
            ? customDraftRange
            : hullType.paramRanges[key]
        const val = config.params[key]
        const label = hullType.paramLabels?.[key] ?? range.label
        const help = resolveParamHelp(key, config.presetId, label)
        return (
          <label key={key} className="is-field">
            <FieldLabel
              label={
                <>
                  {label}: {val.toFixed(2)}
                  {key === 'draft' && snapshot.ok && (
                    <span className="is-field__live">
                      {' '}
                      · KB ≈ {snapshot.kbUpright.toFixed(2)} m · WL ≈ {snapshot.waterlineZ.toFixed(2)} m
                    </span>
                  )}
                </>
              }
              helpTitle={help.title}
              help={help.text}
            />
            <input
              type="range"
              min={range.min}
              max={range.max}
              step={range.step}
              value={val}
              onChange={(e) => setParam(key, parseFloat(e.target.value) as HullParams[typeof key])}
            />
          </label>
        )
      })}

      {customKeelHeightControl && (
        <label className="is-field">
          <FieldLabel
            label={`Keel height: ${customKeelHeightControl.value.toFixed(2)} m`}
            helpTitle="Keel height"
            help="Vertical span from the keel tip to the first hull point above the keel. The whole keel block moves as one rigid shape; hull points stay fixed. Saves to your custom design."
          />
          <input
            type="range"
            min={customKeelHeightControl.min}
            max={customKeelHeightControl.max}
            step={customKeelHeightControl.step}
            value={customKeelHeightControl.value}
            onChange={(e) => setCustomKeelHeight(parseFloat(e.target.value))}
          />
        </label>
      )}

      {snapshot.ok && (
        <div className="is-field">
          <FieldLabel
            label="Displacement (computed)"
            helpTitle="Displacement (computed)"
            help="Submerged cross-section area ∇ at the solved waterline, multiplied by LWL for total buoyancy. Should match your total weight slider at equilibrium."
          />
          <span className="is-field__live">
            ∇ = {snapshot.area.toFixed(2)} m²/m · supporting {fmtTonnes(snapshot.totalBoatMassKg)} at{' '}
            {snapshot.vesselLengthM.toFixed(1)} m LWL
          </span>
        </div>
      )}

      <div className="is-controls-section">
        <h4 className="is-controls-section__title is-controls-section__title--row">
          <span>Wave simulation</span>
          <HelpPopover title="Wave simulation">
            Adjust sea state and playback speed, then press Play on the diagram to roll the vessel in
            waves.
          </HelpPopover>
        </h4>
        {rollSimActive && <span className="is-field__live">Simulation running.</span>}

        <label className="is-field">
          <FieldLabel
            label={`Wave height: ${config.waveHeightM.toFixed(2)} m`}
            helpTitle="Wave height"
            help="Peak-to-trough height of the rolling swell driving heel. Larger waves excite greater roll amplitude."
          />
          <input
            type="range"
            min={0}
            max={30}
            step={0.1}
            value={config.waveHeightM}
            onChange={(e) => setWaveSimParam('waveHeightM', parseFloat(e.target.value))}
          />
        </label>

        <label className="is-field">
          <FieldLabel
            label={
              <>
                Wave period: {config.wavePeriodS.toFixed(1)} s
                <span className="is-field__live">
                  {' '}
                  · f = {waveFrequencyHz(config.wavePeriodS).toFixed(2)} Hz · λ ≈{' '}
                  {waveLengthDeepWater(config.wavePeriodS).toFixed(0)} m
                </span>
              </>
            }
            helpTitle="Wave period"
            help="Time between wave crests. Longer period means longer wavelength and slower roll forcing."
          />
          <input
            type="range"
            min={2}
            max={14}
            step={0.5}
            value={config.wavePeriodS}
            onChange={(e) => setWaveSimParam('wavePeriodS', parseFloat(e.target.value))}
          />
        </label>

        <label className="is-field">
          <FieldLabel
            label={`Wave irregularity: ${(config.waveNoise * 100).toFixed(0)}%`}
            helpTitle="Wave irregularity"
            help="0% = smooth rolling swell; higher values add short chop on the water surface. Chop barely affects roll — heel still follows main wave height and period."
          />
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={config.waveNoise}
            onChange={(e) => setWaveSimParam('waveNoise', parseFloat(e.target.value))}
          />
        </label>

        <label className="is-field">
          <FieldLabel
            label={`Sim speed: ${config.simSpeed.toFixed(1)}×`}
            helpTitle="Sim speed"
            help="Playback multiplier for the wave roll animation. Does not change physics — only how fast simulated time advances."
          />
          <input
            type="range"
            min={0.25}
            max={3}
            step={0.05}
            value={config.simSpeed}
            onChange={(e) => setWaveSimParam('simSpeed', parseFloat(e.target.value))}
          />
        </label>

        <label className="is-field">
          <FieldLabel
            label={`Roll damping: ${(config.dampingRatio * 100).toFixed(0)}%`}
            helpTitle="Roll damping"
            help="Energy dissipation in the roll motion — higher damping settles oscillations faster after each wave encounter."
          />
          <input
            type="range"
            min={0.02}
            max={0.25}
            step={0.01}
            value={config.dampingRatio}
            onChange={(e) => setWaveSimParam('dampingRatio', parseFloat(e.target.value))}
          />
        </label>

        {isMultiHullPreset(config.presetId) && (
          <>
            <label className="is-field is-field--toggle">
              <FieldLabel
                label="Jointed deck"
                helpTitle="Jointed deck"
                help="Deck connected to each hull on hinges — demi-hulls ride local swell and the bridge pitches between them. No active stabilizers."
              />
              <Toggle
                on={config.jointedDeck}
                onChange={(on) => setWaveSimParam('jointedDeck', on)}
                label="Jointed deck"
              />
            </label>

            <label className="is-field is-field--toggle">
              <FieldLabel
                label="Dynamic hull stabilization"
                helpTitle="Dynamic hull stabilization"
                help="Active ride control — deck stays level while hulls track the swell (gyros / actuators). Mutually exclusive with jointed deck."
              />
              <Toggle
                on={config.dynamicHullStabilization}
                onChange={(on) => setWaveSimParam('dynamicHullStabilization', on)}
                label="Dynamic hull stabilization"
              />
            </label>

            {config.dynamicHullStabilization && (
              <>
                <label className="is-field">
                  <FieldLabel
                    label={`Stabilization strength: ${(config.hullStabilizationStrength * 100).toFixed(0)}%`}
                    helpTitle="Stabilization strength"
                    help="How hard the system fights deck motion. 100% = full authority requested."
                  />
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={config.hullStabilizationStrength}
                    onChange={(e) =>
                      setWaveSimParam('hullStabilizationStrength', parseFloat(e.target.value))
                    }
                  />
                </label>

                <label className="is-field">
                  <FieldLabel
                    label={`Actuator stroke limit: ${config.hullStabilizationLimitM.toFixed(2)} m`}
                    helpTitle="Actuator stroke limit"
                    help="Max vertical travel of gyros / active ride units. Beyond this the deck must move with the sea."
                  />
                  <input
                    type="range"
                    min={0.05}
                    max={3}
                    step={0.05}
                    value={config.hullStabilizationLimitM}
                    onChange={(e) =>
                      setWaveSimParam('hullStabilizationLimitM', parseFloat(e.target.value))
                    }
                  />
                </label>
              </>
            )}
          </>
        )}
      </div>

      {snapshot.ok && snapshot.gmUpright < 0 && (
        <p className="is-warning">GM &lt; 0 — loading raises G too high; vessel is unstable upright.</p>
      )}
      {!snapshot.ok && snapshot.error && (
        <p className="is-warning">{snapshot.error}</p>
      )}
    </div>
  )
}

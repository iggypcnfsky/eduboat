import { useMemo } from 'react'
import { Toggle } from '../../../ui/Toggle'
import { useStability, getPreset, HULL_PRESETS } from '../store'
import { KEEL_BALLAST_OPTIONS, getKeelBallastOption } from '../sim/keel-config'
import { isMultiHullPreset } from '../sim/hull-presets'
import {
  CUSTOM_TEMPLATE_ID,
  getAllBoatTemplates,
  getTemplate,
} from '../sim/hull-templates'
import {
  MAX_TOTAL_BOAT_MASS_KG,
  defaultTotalBoatMassKg,
} from '../sim/weight-distribution'
import { waveFrequencyHz, waveLengthDeepWater } from '../sim/roll-dynamics'
import type { HullParams, HullPresetId, KeelBallastId } from '../sim/types'

export function ControlsPanel() {
  const config = useStability((s) => s.config)
  const snapshot = useStability((s) => s.snapshot)
  const rollSimActive = useStability((s) => s.rollSimActive)
  const setHullType = useStability((s) => s.setHullType)
  const setTemplate = useStability((s) => s.setTemplate)
  const setParam = useStability((s) => s.setParam)
  const setKeelBallastId = useStability((s) => s.setKeelBallastId)
  const setTotalBoatMass = useStability((s) => s.setTotalBoatMass)
  const setVesselLength = useStability((s) => s.setVesselLength)
  const setKeelBallastMass = useStability((s) => s.setKeelBallastMass)
  const setWaveSimParam = useStability((s) => s.setWaveSimParam)

  const hullType = getPreset(config.presetId)
  const keelOption = getKeelBallastOption(config.keelBallastId)
  const boatTemplates = useMemo(() => getAllBoatTemplates(), [])

  const activeTemplate = useMemo(() => {
    if (config.templateId === CUSTOM_TEMPLATE_ID) return undefined
    return getTemplate(config.templateId)
  }, [config.templateId])

  const templateSelectValue =
    config.templateId === CUSTOM_TEMPLATE_ID || !activeTemplate
      ? CUSTOM_TEMPLATE_ID
      : config.templateId

  const keelOptions = useMemo(
    () =>
      isMultiHullPreset(config.presetId)
        ? KEEL_BALLAST_OPTIONS.filter((k) => k.id === 'none' || k.id === 'internal')
        : KEEL_BALLAST_OPTIONS,
    [config.presetId],
  )

  const visibleParamKeys = useMemo(() => {
    const keys = new Set<keyof HullParams>([...hullType.visibleParams, ...keelOption.visibleParams])
    return [...keys]
  }, [hullType.visibleParams, keelOption.visibleParams])

  const designBoatMassKg = useMemo(() => defaultTotalBoatMassKg(config), [config])

  const fmtTonnes = (kg: number) => `${(kg / 1000).toFixed(2)} t`

  return (
    <div className="is-panel-inner">
      <label className="is-field">
        <span className="is-field__label">Hull type</span>
        <select
          className="is-select"
          value={config.presetId}
          onChange={(e) => setHullType(e.target.value as HullPresetId)}
        >
          {HULL_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
        <span className="is-field__hint">{hullType.description}</span>
      </label>

      <label className="is-field">
        <span className="is-field__label">Boat template</span>
        <select
          className="is-select"
          value={templateSelectValue}
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
        <span className="is-field__hint">
          {activeTemplate
            ? `${activeTemplate.description} Applied to ${hullType.title} geometry.`
            : 'Parameters were changed manually — pick a template to load published dimensions.'}
        </span>
      </label>

      <div className="is-controls-section">
        <h4 className="is-controls-section__title">Keel &amp; ballast type</h4>
        <label className="is-field">
          <span className="is-field__label">Appendage</span>
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
          <span className="is-field__hint">{keelOption.description}</span>
        </label>

        <label className="is-field">
          <span className="is-field__label">
            Keel ballast: {config.keelBallastKg.toFixed(0)} kg ({fmtTonnes(config.keelBallastKg)})
          </span>
          <input
            type="range"
            min={0}
            max={config.totalBoatMassKg}
            step={50}
            value={config.keelBallastKg}
            onChange={(e) => setKeelBallastMass(parseFloat(e.target.value))}
            disabled={config.keelBallastId === 'none'}
          />
          <span className="is-field__hint">
            {config.keelBallastId === 'none'
              ? 'Select a keel type to add ballast mass — appendage shape alone does not lower G'
              : `Dense mass low in the ${keelOption.title.toLowerCase()} — lowers KG (${((config.keelBallastKg / Math.max(config.totalBoatMassKg, 1)) * 100).toFixed(0)}% of total)`}
          </span>
        </label>
      </div>

      <label className="is-field">
        <span className="is-field__label">
          Waterline length (LWL): {config.vesselLengthM.toFixed(1)} m
        </span>
        <input
          type="range"
          min={4}
          max={200}
          step={0.5}
          value={config.vesselLengthM}
          onChange={(e) => setVesselLength(parseFloat(e.target.value))}
        />
        <span className="is-field__hint">
          Used with total weight below — the 2D slice model scales load as kg ÷ LWL.
        </span>
      </label>

      <label className="is-field">
        <span className="is-field__label">
          Total weight: {config.totalBoatMassKg.toFixed(0)} kg ({fmtTonnes(config.totalBoatMassKg)})
        </span>
        <input
          type="range"
          min={0}
          max={MAX_TOTAL_BOAT_MASS_KG}
          step={50}
          value={config.totalBoatMassKg}
          onChange={(e) => setTotalBoatMass(parseFloat(e.target.value))}
        />
        <span className="is-field__hint">
          0–30 t · KG = {snapshot.ok ? snapshot.kg.toFixed(2) : '—'} m
          {snapshot.ok && (
            <>
              {' · design displacement ≈ '}
              {fmtTonnes(designBoatMassKg)}
              {' at this hull & length (100% = design waterline)'}
            </>
          )}
        </span>
      </label>

      {visibleParamKeys.map((key) => {
        const range = hullType.paramRanges[key]
        const val = config.params[key]
        return (
          <label key={key} className="is-field">
            <span className="is-field__label">
              {hullType.paramLabels?.[key] ?? range.label}: {val.toFixed(2)}
            </span>
            <input
              type="range"
              min={range.min}
              max={range.max}
              step={range.step}
              value={val}
              onChange={(e) => setParam(key, parseFloat(e.target.value) as HullParams[typeof key])}
            />
            {key === 'draft' && (
              <span className="is-field__hint">
                Draft — depth from the keel (K) to the design waterline: grows the hull below the water
                only. At design loading (100% weight), the waterline sits here.
                {snapshot.ok &&
                  ` KB ≈ ${snapshot.kbUpright.toFixed(2)} m · WL ≈ ${snapshot.waterlineZ.toFixed(2)} m.`}
              </span>
            )}
            {key === 'freeboard' && (
              <span className="is-field__hint">
                Freeboard — height from the design waterline to the deck edge: the dry topsides above the
                sea. It does not add underwater volume, but adds superstructure mass and raises KG.
                {snapshot.ok && ' B moves only if total immersion (loading) changes.'}
              </span>
            )}
            {key === 'finDepth' && (
              <span className="is-field__hint">
                Fin depth — extra appendage length below the hull bottom (does not reduce draft). The hull
                body and waterline stay fixed; the section grows deeper at the keel.
              </span>
            )}
          </label>
        )
      })}

      {snapshot.ok && (
        <div className="is-field">
          <span className="is-field__label">Displacement (computed)</span>
          <span className="is-field__hint">
            ∇ = {snapshot.area.toFixed(2)} m²/m (cross-section) · supporting{' '}
            {fmtTonnes(snapshot.totalBoatMassKg)} total at {snapshot.vesselLengthM.toFixed(1)} m LWL
          </span>
        </div>
      )}

      <div className="is-controls-section">
        <h4 className="is-controls-section__title">Wave simulation</h4>
        <span className="is-field__hint">
          Adjust sea state and playback speed, then press Play on the diagram.
          {rollSimActive ? ' Simulation running.' : ''}
        </span>

        <label className="is-field">
          <span className="is-field__label">
            Wave height: {config.waveHeightM.toFixed(2)} m
          </span>
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
          <span className="is-field__label">
            Wave period: {config.wavePeriodS.toFixed(1)} s
            {' · '}
            f = {waveFrequencyHz(config.wavePeriodS).toFixed(2)} Hz
            {' · '}
            λ ≈ {waveLengthDeepWater(config.wavePeriodS).toFixed(0)} m
          </span>
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
          <span className="is-field__label">
            Wave irregularity: {(config.waveNoise * 100).toFixed(0)}%
          </span>
          <span className="is-field__hint">
            0% = smooth rolling swell; higher values add short chop on the water surface. Chop
            barely affects roll — heel still follows main wave height and period.
          </span>
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
          <span className="is-field__label">
            Sim speed: {config.simSpeed.toFixed(1)}×
          </span>
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
          <span className="is-field__label">
            Roll damping: {(config.dampingRatio * 100).toFixed(0)}%
          </span>
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
              <span className="is-field__label">Jointed deck</span>
              <Toggle
                on={config.jointedDeck}
                onChange={(on) => setWaveSimParam('jointedDeck', on)}
                label="Jointed deck"
              />
              <span className="is-field__hint">
                Deck connected to each hull on hinges — demi-hulls ride local swell and the bridge
                pitches between them. No active stabilizers.
              </span>
            </label>

            <label className="is-field is-field--toggle">
              <span className="is-field__label">Dynamic hull stabilization</span>
              <Toggle
                on={config.dynamicHullStabilization}
                onChange={(on) => setWaveSimParam('dynamicHullStabilization', on)}
                label="Dynamic hull stabilization"
              />
              <span className="is-field__hint">
                Active ride control — deck stays level while hulls track the swell (gyros /
                actuators). Mutually exclusive with jointed deck.
              </span>
            </label>

            {config.dynamicHullStabilization && (
              <>
                <label className="is-field">
                  <span className="is-field__label">
                    Stabilization strength: {(config.hullStabilizationStrength * 100).toFixed(0)}%
                  </span>
                  <span className="is-field__hint">
                    How hard the system fights deck motion. 100% = full authority requested.
                  </span>
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
                  <span className="is-field__label">
                    Actuator stroke limit: {config.hullStabilizationLimitM.toFixed(2)} m
                  </span>
                  <span className="is-field__hint">
                    Max vertical travel of gyros / active ride units. Beyond this the deck must
                    move with the sea.
                  </span>
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

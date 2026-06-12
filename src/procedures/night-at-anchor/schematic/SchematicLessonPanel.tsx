import { useState } from 'react'
import { useSim, useSnapshot } from '../store'
import { SCHEMATIC_LESSONS } from './lessons'

interface SchematicLessonPanelProps {
  onHide: () => void
}

export function SchematicLessonPanel({ onHide }: SchematicLessonPanelProps) {
  const snap = useSnapshot()
  const config = useSim((s) => s.config)
  const [index, setIndex] = useState(0)

  const lesson = SCHEMATIC_LESSONS[index]
  const total = SCHEMATIC_LESSONS.length

  const go = (next: number) => {
    setIndex((next + total) % total)
  }

  return (
    <div className="naa-lesson glass">
      <div className="naa-lesson__head">
        <span className="naa-beat__kicker">{lesson.kicker}</span>
        <div className="naa-lesson__head-actions">
          <span className="naa-lesson__counter num">
            {index + 1}/{total}
          </span>
          <button type="button" className="btn btn--compact" onClick={onHide} aria-label="Hide lessons">
            Hide
          </button>
        </div>
      </div>

      <h3 className="naa-lesson__title">{lesson.title}</h3>

      <div className="naa-lesson__body">{lesson.body({ snap, config })}</div>

      {lesson.footnote && <span className="naa-beat__footnote">{lesson.footnote}</span>}

      <div className="naa-lesson__nav">
        <button type="button" className="btn btn--compact" onClick={() => go(index - 1)} aria-label="Previous lesson">
          ← Prev
        </button>

        <div className="naa-lesson__dots" role="tablist" aria-label="Lessons">
          {SCHEMATIC_LESSONS.map((l, i) => (
            <button
              key={l.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Lesson ${i + 1}: ${l.title}`}
              className={`naa-lesson__dot${i === index ? ' is-active' : ''}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>

        <button type="button" className="btn btn--compact" onClick={() => go(index + 1)} aria-label="Next lesson">
          Next →
        </button>
      </div>
    </div>
  )
}

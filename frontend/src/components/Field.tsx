import type { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  optional?: boolean
  span?: 1 | 2 | 3 | 4 | 6
}

export function Field({ label, error, optional, span = 6, id, ...rest }: Props) {
  const errId = `${id}-erro`
  return (
    <div className="field" style={{ gridColumn: `span ${span}` }}>
      <label htmlFor={id}>
        {label}
        {optional ? <span className="optional"> (opcional)</span> : <span aria-hidden="true" className="req"> *</span>}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errId : undefined}
        aria-required={!optional}
        {...rest}
      />
      {error && (
        <p id={errId} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

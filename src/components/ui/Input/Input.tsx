import { InputHTMLAttributes, forwardRef, useId } from 'react'
import { MdCancel } from 'react-icons/md'
import styles from './Input.module.css'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  helpText?: string
  unstyled?: boolean
  hideLabel?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, helpText, className = '', id, unstyled = false, hideLabel = false, ...props },
  ref
) {
  const reactId = useId();
  const inputId = id ?? `input-${reactId}`;
  const describedByIds = [
    error ? `${inputId}-error` : undefined,
    helpText ? `${inputId}-help` : undefined,
  ]
    .filter(Boolean)
    .join(' ');

  if (unstyled) {
    return (
      <>
        {!hideLabel && (
          <label className={styles['sr-only']} htmlFor={inputId}>{label}</label>
        )}
        <input
          id={inputId}
          ref={ref}
          aria-label={hideLabel ? label : undefined}
          aria-invalid={!!error}
          aria-describedby={describedByIds || undefined}
          className={className}
          {...props}
        />
        {helpText && !error && (
          <span id={`${inputId}-help`} className={styles['input-help-message']}>{helpText}</span>
        )}
      </>
    )
  }

  return (
    <div className={[styles['input-field'], error ? styles['input-field-error'] : '', className].filter(Boolean).join(' ')}>
      <label className={styles['input-label']} htmlFor={inputId}>{label}</label>
      <div className={styles['input-container']}>
        <input
          id={inputId}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={describedByIds || undefined}
          className={styles['input-element']}
          {...props}
        />
      </div>
      {helpText && !error && (
        <span id={`${inputId}-help`} className={styles['input-help-message']}>{helpText}</span>
      )}
      {error && (
        <div id={`${inputId}-error`} className={styles['input-error-message']}>
          <div className={styles.icon}>
            <MdCancel size={16} color="#E61E32" />
          </div>
          <span>{error}</span>
        </div>
      )}
    </div>
  )
})

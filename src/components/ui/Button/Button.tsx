import { ButtonHTMLAttributes } from 'react'
import styles from './Button.module.css'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
}

export function Button({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}: ButtonProps) {
  return (
    <button 
      className={[
        styles.btn,
        styles[`btn-${variant}`],
        className,
      ].filter(Boolean).join(' ')} 
      {...props}
    >
      <span className={styles['btn-label']}>{children}</span>
    </button>
  )
}

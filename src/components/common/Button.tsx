import type { ButtonHTMLAttributes, ReactNode } from 'react'
import './Button.css'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'small' | 'medium' | 'large'
  fullWidth?: boolean
}

export function Button({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  const classes = ['btn', `btn-${variant}`, `btn-${size}`, fullWidth ? 'btn-full' : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <button className={classes} type={type} {...props}>
      {children}
    </button>
  )
}

import type { ButtonHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router'
import { type ButtonVariant, buttonClasses } from './buttonClasses'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

export function Button({ variant = 'primary', className, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, className)} {...props} />
}

interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant
}

/** Enlace con aspecto de botón: se usa para navegar, nunca para ejecutar acciones. */
export function ButtonLink({ variant = 'primary', className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses(variant, className ?? '')} {...props} />
}

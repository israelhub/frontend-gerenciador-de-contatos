'use client'

import Image from 'next/image'
import { ReactNode } from 'react'
import backgroundSvg from '@/assets/background.svg'
import logoGuard from '@/assets/logoGUARD.svg'
import './AuthLayout.css'

interface AuthLayoutProps {
  children: ReactNode
  /**
   * Classe opcional para sobrescrever estilos do container principal (main-container)
   * Ex.: passar um CSS Module da página de login
   */
  containerClassName?: string
}

export default function AuthLayout({ children, containerClassName }: AuthLayoutProps) {
  return (
    <div className="cadastro-container">
      {/* Background SVG */}
      <div className="background-svg">
        <Image 
          src={backgroundSvg}
          alt="Background"
          width={1366}
          height={768}
          priority
        />
      </div>

      {/* Background blur overlay - covers entire screen */}
      <div className="full-screen-blur"></div>

      {/* Logo */}
      <div className="logo">
        <Image 
          src={logoGuard}
          alt="Guard Logo"
          width={131}
          height={32}
        />
      </div>

      {/* Right side - form content */}
      <div className="content">
        <div className={["main-container", containerClassName].filter(Boolean).join(' ')}>
          {/* Logo - only visible on mobile */}
          <div className="logo mobile-logo">
            <Image 
              src={logoGuard}
              alt="Guard Logo"
              width={131}
              height={32}
            />
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}

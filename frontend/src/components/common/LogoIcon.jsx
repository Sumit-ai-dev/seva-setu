import React from 'react'
import logoSrc from '../../images/logo/logo.jpg'

export default function LogoIcon({ size = 52, style = {} }) {
  return (
    <img
      src={logoSrc}
      alt="Nexus Health"
      width={size}
      height={size}
      style={{ borderRadius: 18, objectFit: 'cover', display: 'block', ...style }}
    />
  )
}

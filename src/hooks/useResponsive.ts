import { useEffect, useState } from 'react'
import { BREAKPOINTS } from '@/utils/constants'

export type DeviceType = 'mobile' | 'tablet' | 'desktop'

interface ResponsiveInfo {
  device: DeviceType
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  width: number
  height: number
}

function getResponsiveInfo(width: number, height: number): ResponsiveInfo {
  let device: DeviceType = 'desktop'

  if (width < BREAKPOINTS.mobile) {
    device = 'mobile'
  } else if (width < BREAKPOINTS.tablet) {
    device = 'tablet'
  }

  return {
    device,
    isMobile: device === 'mobile',
    isTablet: device === 'tablet',
    isDesktop: device === 'desktop',
    width,
    height,
  }
}

export function useResponsive(): ResponsiveInfo {
  const [info, setInfo] = useState<ResponsiveInfo>(() =>
    getResponsiveInfo(window.innerWidth, window.innerHeight),
  )

  useEffect(() => {
    const handleResize = () => {
      setInfo(getResponsiveInfo(window.innerWidth, window.innerHeight))
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return info
}

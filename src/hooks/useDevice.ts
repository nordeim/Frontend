// src/hooks/useDevice.ts
import { useState, useEffect, useCallback } from 'react'

export interface DeviceCapabilities {
  touch: boolean
  pointer: boolean
  keyboard: boolean
  mouse: boolean
  touchPoints: number
  hover: boolean
  coarsePointer: boolean
  finePointer: boolean
}

export interface DeviceInfo {
  userAgent: string
  platform: string
  vendor: string
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isTouchDevice: boolean
  isIOS: boolean
  isAndroid: boolean
  isWindows: boolean
  isMacOS: boolean
  isLinux: boolean
  isChrome: boolean
  isFirefox: boolean
  isSafari: boolean
  isEdge: boolean
  isOpera: boolean
  isIE: boolean
  browserVersion: string
  osVersion: string
}

export interface NetworkInfo {
  connection: 'slow-2g' | '2g' | '3g' | '4g' | 'wifi' | 'ethernet' | 'unknown'
  effectiveType: string
  downlink: number
  rtt: number
  saveData: boolean
}

interface UseDeviceReturn {
  capabilities: DeviceCapabilities
  info: DeviceInfo
  network: NetworkInfo
  supportsWebP: boolean
  supportsAVIF: boolean
  prefersReducedMotion: boolean
  prefersColorScheme: 'light' | 'dark' | 'no-preference'
  prefersReducedData: boolean
  hasBattery: boolean
  batteryLevel: number | null
  isCharging: boolean | null
}

/**
 * Hook for comprehensive device detection and capability checking
 * Mobile-first approach with performance optimization
 */
export function useDevice(): UseDeviceReturn {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>({
    touch: false,
    pointer: false,
    keyboard: false,
    mouse: false,
    touchPoints: 0,
    hover: false,
    coarsePointer: false,
    finePointer: false
  })

  const [info, setInfo] = useState<DeviceInfo>({
    userAgent: '',
    platform: '',
    vendor: '',
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isTouchDevice: false,
    isIOS: false,
    isAndroid: false,
    isWindows: false,
    isMacOS: false,
    isLinux: false,
    isChrome: false,
    isFirefox: false,
    isSafari: false,
    isEdge: false,
    isOpera: false,
    isIE: false,
    browserVersion: '',
    osVersion: ''
  })

  const [network, setNetwork] = useState<NetworkInfo>({
    connection: 'unknown',
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
    saveData: false
  })

  const [supportsWebP, setSupportsWebP] = useState(false)
  const [supportsAVIF, setSupportsAVIF] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [prefersColorScheme, setPrefersColorScheme] = useState<'light' | 'dark' | 'no-preference'>('no-preference')
  const [prefersReducedData, setPrefersReducedData] = useState(false)
  const [hasBattery, setHasBattery] = useState(false)
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null)
  const [isCharging, setIsCharging] = useState<boolean | null>(null)

  // Detect device capabilities
  const detectCapabilities = useCallback(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return

    const touchSupported = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    const pointerSupported = 'onpointerdown' in window
    const keyboardSupported = true // Assume keyboard support unless proven otherwise
    const mouseSupported = !touchSupported || window.matchMedia('(hover: hover)').matches

    setCapabilities({
      touch: touchSupported,
      pointer: pointerSupported,
      keyboard: keyboardSupported,
      mouse: mouseSupported,
      touchPoints: navigator.maxTouchPoints || 0,
      hover: window.matchMedia('(hover: hover)').matches,
      coarsePointer: window.matchMedia('(pointer: coarse)').matches,
      finePointer: window.matchMedia('(pointer: fine)').matches
    })
  }, [])

  // Detect device info
  const detectDeviceInfo = useCallback(() => {
    if (typeof navigator === 'undefined') return

    const userAgent = navigator.userAgent.toLowerCase()
    const platform = navigator.platform.toLowerCase()
    const vendor = navigator.vendor?.toLowerCase() || ''

    const isIOS = /iphone|ipad|ipod/.test(userAgent)
    const isAndroid = /android/.test(userAgent)
    const isWindows = /windows/.test(userAgent)
    const isMacOS = /macintosh|mac os x/.test(userAgent)
    const isLinux = /linux/.test(userAgent)

    const isMobile = /mobile|android|iphone|ipad/.test(userAgent)
    const isTablet = /tablet|ipad/.test(userAgent) && !isMobile
    const isDesktop = !isMobile && !isTablet

    const isChrome = /chrome/.test(userAgent) && !/edge/.test(userAgent)
    const isFirefox = /firefox/.test(userAgent)
    const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent)
    const isEdge = /edge/.test(userAgent)
    const isOpera = /opera|opr/.test(userAgent)
    const isIE = /msie|trident/.test(userAgent)

    // Extract browser version
    const getBrowserVersion = () => {
      if (isChrome) return userAgent.match(/chrome\/(\d+)/)?.[1] || ''
      if (isFirefox) return userAgent.match(/firefox\/(\d+)/)?.[1] || ''
      if (isSafari) return userAgent.match(/version\/(\d+)/)?.[1] || ''
      if (isEdge) return userAgent.match(/edge\/(\d+)/)?.[1] || ''
      return ''
    }

    // Extract OS version
    const getOSVersion = () => {
      if (isIOS) return userAgent.match(/os (\d+)_(\d+)/)?.[0] || ''
      if (isAndroid) return userAgent.match(/android (\d+)/)?.[1] || ''
      if (isWindows) return userAgent.match(/windows nt (\d+\.\d+)/)?.[1] || ''
      if (isMacOS) return userAgent.match(/mac os x (\d+)[_\.](\d+)/)?.[0] || ''
      return ''
    }

    setInfo({
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      vendor: vendor,
      isMobile,
      isTablet,
      isDesktop,
      isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      isIOS,
      isAndroid,
      isWindows,
      isMacOS,
      isLinux,
      isChrome,
      isFirefox,
      isSafari,
      isEdge,
      isOpera,
      isIE,
      browserVersion: getBrowserVersion(),
      osVersion: getOSVersion()
    })
  }, [])

  // Detect network info
  const detectNetworkInfo = useCallback(() => {
    if (typeof navigator === 'undefined') return

    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    
    if (connection) {
      setNetwork({
        connection: connection.effectiveType || 'unknown',
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0,
        saveData: connection.saveData || false
      })
    }
  }, [])

  // Detect media support
  const detectMediaSupport = useCallback(async () => {
    if (typeof document === 'undefined') return

    // Check WebP support
    const webP = new Image()
    webP.onload = webP.onerror = () => {
      setSupportsWebP(webP.height === 2)
    }
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'

    // Check AVIF support
    const avif = new Image()
    avif.onload = avif.onerror = () => {
      setSupportsAVIF(avif.height === 2)
    }
    avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAQAAAAEAAAAEGF2MUOBAAAAAAAAFWF2MUOCAAAACQYBAAEAAAAAABhhdmNCAAAA' +

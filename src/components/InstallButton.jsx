import { useState, useEffect } from 'react'

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
}

function isInstalled() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showIOSHint, setShowIOSHint] = useState(false)
  const [alreadyInstalled, setAlreadyInstalled] = useState(false)

  useEffect(() => {
    if (isInstalled()) {
      setAlreadyInstalled(true)
      return
    }

    const onBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    const onInstalled = () => {
      setDeferredPrompt(null)
      setAlreadyInstalled(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (alreadyInstalled) return null

  // iOS Safari doesn't fire beforeinstallprompt — show manual instructions instead
  if (isIOS()) {
    return (
      <div style={{ position: 'relative' }}>
        <button
          className="site-nav__install"
          onClick={() => setShowIOSHint((h) => !h)}
          aria-expanded={showIOSHint}
        >
          📲 Install App
        </button>
        {showIOSHint && (
          <div className="install-ios-hint">
            In Safari, tap the <strong>Share</strong> button (↑) then choose{' '}
            <strong>"Add to Home Screen"</strong>
          </div>
        )}
      </div>
    )
  }

  if (!deferredPrompt) return null

  const handleInstall = async () => {
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }

  return (
    <button className="site-nav__install" onClick={handleInstall}>
      📲 Install App
    </button>
  )
}

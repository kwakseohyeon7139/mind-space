import { useEffect, useRef, useState } from 'react'

const VIDEO_ID = 'scke4gYlGFo'

// Gesture events Chrome/Firefox/Safari all recognise as user activation
const GESTURE_EVENTS = ['pointerdown', 'click', 'keydown', 'touchstart']

const IconMusic = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18V5l12-2v13"/>
    <circle cx="6" cy="18" r="3"/>
    <circle cx="18" cy="16" r="3"/>
  </svg>
)

const IconMuted = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="2" y1="2" x2="22" y2="22"/>
    <path d="M9 18V9.82M9 5l8.26-1.38A2 2 0 0 1 19 5.59V8"/>
    <circle cx="6" cy="18" r="3"/>
    <circle cx="18" cy="16" r="3"/>
  </svg>
)

export function MusicPlayer({ visible, triggerRef }) {
  const playerRef  = useRef(null)
  const readyRef   = useRef(false)
  const mutedRef   = useRef(true)   // shadow of muted state for closures
  const [muted, setMuted] = useState(true)
  const [ready, setReady] = useState(false)

  // ── unmute helper ────────────────────────────────────────────────
  const doUnmute = () => {
    if (!playerRef.current || !readyRef.current || !mutedRef.current) return
    try {
      playerRef.current.unMute()
      playerRef.current.setVolume(55)
      playerRef.current.playVideo()
      mutedRef.current = false
      setMuted(false)
    } catch (_) {}
  }

  // ── init YouTube IFrame player ───────────────────────────────────
  useEffect(() => {
    function initPlayer() {
      playerRef.current = new window.YT.Player('yt-hidden-player', {
        height: '0', width: '0',
        videoId: VIDEO_ID,
        playerVars: {
          autoplay: 1, mute: 1, loop: 1,
          playlist: VIDEO_ID, controls: 0, rel: 0, playsinline: 1,
        },
        events: {
          onReady: (e) => {
            e.target.setVolume(55)
            readyRef.current = true
            setReady(true)
            // Attempt immediate unmute — works when browser has enough
            // media engagement (returning visitors, Firefox, some Chromes)
            doUnmute()
          },
        },
      })
    }

    if (window.YT?.Player) {
      initPlayer()
    } else {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(tag)
      window.onYouTubeIframeAPIReady = initPlayer
    }

    return () => {
      if (window.onYouTubeIframeAPIReady === initPlayer)
        delete window.onYouTubeIframeAPIReady
    }
  }, []) // eslint-disable-line

  // ── expose doUnmute via triggerRef (called by Enter screen) ────────
  useEffect(() => {
    if (triggerRef) triggerRef.current = doUnmute
  }) // no deps — always keep ref fresh

  // ── auto-unmute on first real user gesture ───────────────────────
  // How it works:
  //   YouTube autoplays muted (browsers allow this).
  //   The iframe already has "autoplay" permission from the embed.
  //   Calling unMute() WITHIN a user-activation event handler
  //   propagates the activation into the cross-origin iframe,
  //   so the browser allows it — no policy violation.
  useEffect(() => {
    const handleGesture = () => {
      // remove first so we don't fire twice
      GESTURE_EVENTS.forEach(ev => document.removeEventListener(ev, handleGesture, true))

      if (readyRef.current) {
        doUnmute()
      } else {
        // Player still loading — poll briefly then unmute
        // (still within acceptable "activation propagation" window on most browsers)
        const tid = setInterval(() => {
          if (readyRef.current) {
            clearInterval(tid)
            doUnmute()
          }
        }, 80)
        setTimeout(() => clearInterval(tid), 6000)
      }
    }

    GESTURE_EVENTS.forEach(ev => document.addEventListener(ev, handleGesture, true))
    return () => GESTURE_EVENTS.forEach(ev => document.removeEventListener(ev, handleGesture, true))
  }, []) // eslint-disable-line

  // ── manual toggle ────────────────────────────────────────────────
  const toggle = () => {
    if (!playerRef.current || !ready) return
    if (mutedRef.current) {
      doUnmute()
    } else {
      playerRef.current.mute()
      mutedRef.current = true
      setMuted(true)
    }
  }

  return (
    <>
      <div
        id="yt-hidden-player"
        style={{ position: 'fixed', bottom: -9999, left: 0, width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
      />
      <button
        className={`music-btn ${visible ? 'music-btn-visible' : ''} ${!muted ? 'music-btn-on' : ''}`}
        onClick={toggle}
        title={muted ? '음악 켜기' : '음악 끄기'}
      >
        {muted ? <IconMuted /> : <IconMusic />}
      </button>
    </>
  )
}

import { useEffect, useRef, useState } from 'react'

const VIDEO_ID = 'scke4gYlGFo'
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

export function MusicPlayer({ visible }) {
  const playerRef    = useRef(null)
  const readyRef     = useRef(false)
  const mutedRef     = useRef(true)
  const pendingRef   = useRef(false)   // user gestured before player was ready
  const [muted, setMuted] = useState(true)

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

  // ── init YouTube IFrame player ─────────────────────────────────────
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
            // If user already gestured while player was loading → unmute now
            if (pendingRef.current) {
              doUnmute()
              pendingRef.current = false
            }
          },
        },
      })
    }

    if (window.YT?.Player) {
      initPlayer()
    } else {
      // API not ready yet — wait for callback
      const prev = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        if (prev) prev()
        initPlayer()
      }
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement('script')
        tag.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(tag)
      }
    }

    return () => { /* player lives for session */ }
  }, []) // eslint-disable-line

  // ── unmute on first real user gesture ─────────────────────────────
  useEffect(() => {
    const handleGesture = () => {
      GESTURE_EVENTS.forEach(ev => document.removeEventListener(ev, handleGesture, true))
      if (!mutedRef.current) return  // already unmuted

      if (readyRef.current) {
        doUnmute()
      } else {
        // Player still loading — mark pending, onReady will pick it up
        pendingRef.current = true
      }
    }

    GESTURE_EVENTS.forEach(ev => document.addEventListener(ev, handleGesture, true))
    return () => GESTURE_EVENTS.forEach(ev => document.removeEventListener(ev, handleGesture, true))
  }, []) // eslint-disable-line

  // ── manual toggle ──────────────────────────────────────────────────
  const toggle = () => {
    if (!playerRef.current || !readyRef.current) return
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

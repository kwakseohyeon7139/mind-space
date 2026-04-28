import { Canvas } from '@react-three/fiber'
import { Suspense, useState, useEffect } from 'react'
import { Scene } from './components/Scene'
import { CategoryNav } from './components/CategoryNav'
import { PostReader } from './components/PostReader'
import { GraphMinimap } from './components/GraphMinimap'
import { AdminPage } from './components/AdminPage'
import { MusicPlayer } from './components/MusicPlayer'
import { config } from './nav'
import './App.css'
import './cockpit-final.css'
import './flare-final.css'

const DragIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 11V6a2 2 0 0 0-4 0v0M14 10V4a2 2 0 0 0-4 0v0M10 10V3a2 2 0 0 0-4 0v9l-2-2a2 2 0 0 0-2.83 2.83l3.54 3.54A6 6 0 0 0 12 21h2a6 6 0 0 0 6-6v-4a2 2 0 0 0-4 0"/>
  </svg>
)

const PointerIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 3l14 9-7.5 1.5L8 21 5 3z"/>
    <path d="M12 12.5l5 5"/>
  </svg>
)

const PanelIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <path d="M15 3v18"/>
  </svg>
)

function playPadTap() {
  const AudioContext = window.AudioContext || window.webkitAudioContext
  if (!AudioContext) return

  const ctx = new AudioContext()
  const now = ctx.currentTime
  const gain = ctx.createGain()
  const osc = ctx.createOscillator()
  const filter = ctx.createBiquadFilter()

  osc.type = 'triangle'
  osc.frequency.setValueAtTime(420, now)
  osc.frequency.exponentialRampToValueAtTime(180, now + 0.08)
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(1500, now)
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.08, now + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11)

  osc.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.12)
  setTimeout(() => ctx.close(), 260)
}

const CockpitOverlay = ({ visible, activeControl, onProfile, onSettings, onLogin }) => (
  <nav className={`cockpit-overlay ${visible ? 'cockpit-overlay-visible' : ''} ${activeControl ? `cockpit-press-${activeControl}` : ''}`} aria-hidden={!visible}>
    <div className="bottom-nav">
      <button className="bottom-nav-item" type="button" onClick={onSettings}>
        <span className="nav-ind" />
        SETTING
      </button>
      <button className="bottom-nav-item" type="button" onClick={onLogin}>
        <span className="nav-ind" />
        LOG IN
      </button>
      <button className="bottom-nav-item" type="button" onClick={onProfile}>
        <span className="nav-ind" />
        ABOUT ME
      </button>
    </div>
  </nav>
)

const ProfileDossier = ({ open, onClose }) => (
  <div className={`profile-dossier-panel ${open ? 'profile-dossier-panel-open' : ''}`} aria-hidden={!open}>
    <button className="profile-dossier-close" type="button" onClick={onClose}>close</button>
    <div className="profile-dossier-kicker">personal file</div>
    <h2>mind-space pilot</h2>
    <p>
      A quiet archive drifting through memory, routine, emotion, and small private thoughts.
    </p>
    <div className="profile-dossier-grid">
      <span>mode</span><strong>observer</strong>
      <span>signal</span><strong>low orbit</strong>
      <span>archive</span><strong>open</strong>
    </div>
  </div>
)

const SettingsPanel = ({ open, mode, onModeChange, onClose }) => (
  <div className={`settings-panel ${open ? 'settings-panel-open' : ''}`} aria-hidden={!open}>
    <button className="settings-close" type="button" onClick={onClose}>close</button>
    <div className="settings-title">settings</div>
    <div className="settings-row">
      <span>view mode</span>
      <div className="settings-segment">
        <button type="button" className={mode === 'drag' ? 'settings-segment-active' : ''} onClick={() => onModeChange('drag')}>drag</button>
        <button type="button" className={mode === 'look' ? 'settings-segment-active' : ''} onClick={() => onModeChange('look')}>look</button>
      </div>
    </div>
    <div className="settings-note">WASD, wheel, and card focus stay as they are.</div>
  </div>
)

export default function App() {
  const [selectedPost, setSelectedPost] = useState(null)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [fading, setFading] = useState(true)
  const [showControls, setShowControls] = useState(false)
  const [mode, setMode] = useState('drag')
  const [adminMode, setAdminMode] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [activeControl, setActiveControl] = useState(null)

  const [showLoginModal, setShowLoginModal] = useState(false)
  const [loginId, setLoginId] = useState('')
  const [loginPw, setLoginPw] = useState('')
  const [loginError, setLoginError] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setFading(false), 800)
    const t2 = setTimeout(() => setShowControls(true), 1400)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const switchMode = (m) => { config.mode = m; setMode(m) }

  const handleCardClick = (post) => { setSelectedPost(post) }
  const handleTogglePanel = () => { setCategoryOpen(v => !v) }
  const handleCategoryClose = () => setCategoryOpen(false)
  const handlePostClose = () => setSelectedPost(null)

  const triggerControl = (control, action) => {
    setActiveControl(control)
    playPadTap()
    setTimeout(() => {
      action()
      setActiveControl(null)
    }, 220)
  }

  const handleProfileOpen = () => {
    triggerControl('profile', () => {
      setSettingsOpen(false)
      setProfileOpen(true)
    })
  }

  const handleSettingsOpen = () => {
    triggerControl('settings', () => {
      setProfileOpen(false)
      setSettingsOpen(true)
    })
  }

  const handleLoginOpen = () => {
    triggerControl('login', () => {
      setProfileOpen(false)
      setSettingsOpen(false)
      setShowLoginModal(true)
    })
  }

  const handleLoginSubmit = (e) => {
    e.preventDefault()
    if (loginId.trim() === 'admin' && loginPw === '1234') {
      setAdminMode(true); setShowLoginModal(false)
      setLoginId(''); setLoginPw(''); setLoginError(false)
    } else { setLoginError(true) }
  }
  const closeLoginModal = () => {
    setShowLoginModal(false); setLoginId(''); setLoginPw(''); setLoginError(false)
  }

  if (adminMode) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#020208', overflow: 'hidden auto' }}>
        <AdminPage onClose={() => setAdminMode(false)} />
      </div>
    )
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#06060e', overflow: 'hidden' }}>
      <Canvas
        camera={{ position: [0, 0, 0], fov: 75 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#06060e' }}
      >
        <Suspense fallback={null}>
          <Scene onCardClick={handleCardClick} />
        </Suspense>
      </Canvas>

      <div className="sun-screen-flare" aria-hidden="true">
        <span className="sun-flare-wash" />
        <span className="sun-flare-beam" />
        <span className="sun-flare-ray" />
        <span className="sun-flare-source" />
        <span className="sun-flare-ghost sun-flare-ghost-1" />
        <span className="sun-flare-ghost sun-flare-ghost-2" />
        <span className="sun-flare-ghost sun-flare-ghost-3" />
        <span className="sun-flare-ghost sun-flare-ghost-4" />
      </div>

      <div className="header">
        <span className="header-dot" />
        mind space
        <MusicPlayer visible={showControls} />
      </div>

      <button
        className={`panel-toggle-btn ${showControls ? 'panel-toggle-visible' : ''} ${categoryOpen ? 'panel-toggle-active' : ''}`}
        onClick={handleTogglePanel}
        title="Categories"
      >
        <PanelIcon />
      </button>

      <GraphMinimap visible={showControls} />

      <div className={`mode-toggle ${showControls ? 'mode-toggle-visible' : ''}`}>
        <button className={`mode-btn ${mode === 'drag' ? 'mode-btn-active' : ''}`} onClick={() => switchMode('drag')} title="Drag mode">
          <DragIcon />
        </button>
        <button className={`mode-btn ${mode === 'look' ? 'mode-btn-active' : ''}`} onClick={() => switchMode('look')} title="Look mode">
          <PointerIcon />
        </button>
      </div>

      <div className={`controls-hint ${showControls ? 'controls-hint-visible' : ''}`}>
        <div className="controls-row">
          <span className="controls-key">W A S D</span>
          <span className="controls-sep">.</span>
          <span className="controls-label">이동</span>
        </div>
        <span className="controls-divider" />
        <div className="controls-row">
          <span className="controls-key">{mode === 'drag' ? 'DRAG' : 'LOOK'}</span>
          <span className="controls-sep">.</span>
          <span className="controls-label">시점</span>
        </div>
        <span className="controls-divider" />
        <div className="controls-row">
          <span className="controls-key">SPACE</span>
          <span className="controls-sep">.</span>
          <span className="controls-label">위로</span>
        </div>
      </div>

      <ProfileDossier open={profileOpen && !showLoginModal} onClose={() => setProfileOpen(false)} />
      <SettingsPanel open={settingsOpen && !showLoginModal} mode={mode} onModeChange={switchMode} onClose={() => setSettingsOpen(false)} />

      <CockpitOverlay
        visible={showControls && !showLoginModal}
        activeControl={activeControl}
        onProfile={handleProfileOpen}
        onSettings={handleSettingsOpen}
        onLogin={handleLoginOpen}
      />

      <div className={`fade-overlay ${fading ? '' : 'fade-overlay-out'}`} />

      <CategoryNav open={categoryOpen} onClose={handleCategoryClose} />
      <PostReader post={selectedPost} onClose={handlePostClose} />

      {showLoginModal && (
        <div className="login-modal-overlay" onClick={(e) => e.target === e.currentTarget && closeLoginModal()}>
          <div className="login-modal">
            <div className="login-modal-title">LOG IN</div>
            <form onSubmit={handleLoginSubmit}>
              <input
                className="login-modal-input"
                type="text"
                placeholder="ID"
                value={loginId}
                onChange={e => { setLoginId(e.target.value); setLoginError(false) }}
                autoComplete="off"
                autoFocus
              />
              <input
                className="login-modal-input"
                type="password"
                placeholder="PASSWORD"
                value={loginPw}
                onChange={e => { setLoginPw(e.target.value); setLoginError(false) }}
              />
              {loginError && <div className="login-modal-error">Invalid ID or password.</div>}
              <div className="login-modal-actions">
                <button type="button" className="login-modal-cancel" onClick={closeLoginModal}>CANCEL</button>
                <button type="submit" className="login-modal-submit">LOG IN</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

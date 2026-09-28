import bgLogo from '../assets/bg_logo.webp'

// Big faded Roam logo fixed behind every screen.
export default function MascotBackground() {
  return (
    <img
      src={bgLogo}
      alt=""
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(85vw, 620px)',
        opacity: 0.06,
        zIndex: -1,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    />
  )
}

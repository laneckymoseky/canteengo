import bgLogo from '../assets/bg_logo.webp'
import LottiePlayer from '../components/LottiePlayer'
import foodBeverageAnim from '../assets/animations/food_beverage.json'

export default function AuthLayout({ children }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--roam-cream)',
        overflow: 'hidden',
      }}
    >
      {/* faded background logo */}
      <img
        src={bgLogo}
        alt=""
        style={{
          position: 'absolute',
          width: '70vh',
          maxWidth: '90vw',
          opacity: 0.06,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', width: '100%', maxWidth: 380 }}>
        <LottiePlayer
          animationData={foodBeverageAnim}
          style={{ width: 140, height: 140, margin: '0 auto' }}
        />
        {children}
      </div>
    </div>
  )
}

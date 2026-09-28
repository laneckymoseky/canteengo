import { useEffect, useRef } from 'react'
import lottie from 'lottie-web'

export default function LottiePlayer({ animationData, loop = true, onComplete, style }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop,
      autoplay: true,
      animationData,
    })
    if (onComplete) anim.addEventListener('complete', onComplete)
    return () => anim.destroy()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animationData, loop])

  return <div ref={containerRef} style={style} />
}

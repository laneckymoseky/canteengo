import { useEffect, useRef } from 'react'
import lottie from 'lottie-web'

export default function LottiePlayer({ animationData, loop = true, style }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop,
      autoplay: true,
      animationData,
    })
    return () => anim.destroy()
  }, [animationData, loop])

  return <div ref={containerRef} style={style} />
}

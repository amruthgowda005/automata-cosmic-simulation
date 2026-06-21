import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Hook: pin a section and animate on scroll
export function useGSAPScroll(containerRef, scenes) {
  useEffect(() => {
    if (!containerRef.current) return
    const ctx = gsap.context(() => {
      scenes.forEach(({ trigger, animation, options = {} }) => {
        ScrollTrigger.create({
          trigger,
          start: options.start || 'top top',
          end: options.end || '+=100%',
          pin: options.pin !== false,
          scrub: options.scrub !== false ? (options.scrub || 1) : false,
          onEnter: animation?.onEnter,
          onLeave: animation?.onLeave,
          onEnterBack: animation?.onEnterBack,
          animation: animation?.tween,
        })
      })
    }, containerRef)
    return () => ctx.revert()
  }, [])
}

// Hook: GSAP stagger text animation for title
export function useGSAPTitle(ref, options = {}) {
  useEffect(() => {
    if (!ref.current) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current.querySelectorAll('.char'),
        { y: 100, opacity: 0, rotateX: -90 },
        {
          y: 0,
          opacity: 1,
          rotateX: 0,
          duration: options.duration || 0.8,
          stagger: options.stagger || 0.05,
          ease: options.ease || 'back.out(1.7)',
          delay: options.delay || 0,
        }
      )
    }, ref)
    return () => ctx.revert()
  }, [])
}

// Hook: scroll-triggered entrance animations
export function useScrollReveal(refs) {
  useEffect(() => {
    const ctx = gsap.context(() => {
      refs.forEach((ref, i) => {
        if (!ref?.current) return
        gsap.fromTo(
          ref.current,
          { y: 60, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: ref.current,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
            delay: i * 0.1,
          }
        )
      })
    })
    return () => ctx.revert()
  }, [])
}

// Hook: GSAP timeline with cleanup
export function useGSAPTimeline() {
  const tlRef = useRef(null)
  useEffect(() => {
    tlRef.current = gsap.timeline()
    return () => {
      if (tlRef.current) tlRef.current.kill()
    }
  }, [])
  return tlRef
}

export { gsap, ScrollTrigger }

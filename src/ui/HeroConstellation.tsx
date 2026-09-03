import { useEffect, useRef } from 'react'
import type { Theme } from '../core/theme'

/**
 * The decorative constellation behind the landing hero (ADR-0023). A canvas of slowly
 * drifting nodes linked to their neighbours — a graph texture echoing a component tree — that
 * nudges toward the cursor when it passes near. Purely decorative: `aria-hidden`,
 * `pointer-events: none`, no business logic, no layout effect.
 *
 * Honours the hard rules: colours are read from the theme tokens (works in light and dark and
 * across the theme toggle), `prefers-reduced-motion` renders a single static frame with no
 * loop or pointer tracking, and the animation pauses when the tab is hidden or the hero is
 * scrolled out of view. `theme` is a prop only so the token colours are re-read when it flips.
 */

type Node = { x: number; y: number; vx: number; vy: number }

// All lengths in CSS pixels, all speeds in px/second — the loop is delta-timed, not per-frame.
// Values tuned against the live preview (ADR-0023).
const LINK_DIST = 135 // neighbours closer than this get a link, fading with distance
const DRIFT = 1.1 // multiplier on each node's base drift speed
const MOUSE_RADIUS = 280 // how wide the cursor's halo of links reaches
const MOUSE_PULL = 0 // acceleration toward the cursor (px/s²); 0 = cursor illuminates, never drags
const MAX_SPEED = 46 // clamp so any pull stays gentle and self-limiting
const NODE_ALPHA = 0.43
const LINK_ALPHA = 0.08
const MOUSE_LINK_ALPHA = 0.7

function readColors(): { line: string; accent: string } {
  const s = getComputedStyle(document.documentElement)
  return {
    line: s.getPropertyValue('--text').trim() || '#888',
    accent: s.getPropertyValue('--accent').trim() || '#c79a5e',
  }
}

/** Node count from the hero's area — scales down on small screens, capped so it stays calm. */
function nodeCount(w: number, h: number): number {
  return Math.max(22, Math.min(36, Math.round((w * h) / 22000)))
}

function seed(w: number, h: number): Node[] {
  const nodes: Node[] = []
  for (let i = 0; i < nodeCount(w, h); i++) {
    // A slow, arbitrary drift. No Math.random seed to preserve — the field is decorative and
    // its exact start does not matter — but keep speeds low so it reads as calm.
    const angle = (i * 137.508 * Math.PI) / 180 // golden-angle spread, deterministic
    const speed = (8 + ((i * 7) % 12)) * DRIFT
    nodes.push({
      x: (i * 89) % w,
      y: (i * 149) % h,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
    })
  }
  return nodes
}

export function HeroConstellation({ theme }: { theme: Theme }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const colorsRef = useRef(readColors())

  // Re-read the token colours when the theme flips, without restarting the animation.
  useEffect(() => {
    colorsRef.current = readColors()
  }, [theme])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let width = parent.clientWidth
    let height = parent.clientHeight
    const nodes = seed(width, height)
    const mouse = { x: 0, y: 0, active: false }

    const resize = (): void => {
      const w = parent.clientWidth
      const h = parent.clientHeight
      if (w === width && h === height) return
      // Keep the field's composition on resize by scaling positions into the new box.
      const sx = width ? w / width : 1
      const sy = height ? h / height : 1
      for (const n of nodes) {
        n.x *= sx
        n.y *= sy
      }
      width = w
      height = h
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    // Initial sizing.
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const draw = (): void => {
      const { line, accent } = colorsRef.current
      ctx.clearRect(0, 0, width, height)

      // Links between neighbours, and to the cursor — drawn before nodes so dots sit on top.
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist = Math.hypot(dx, dy)
          if (dist >= LINK_DIST) continue
          ctx.globalAlpha = (1 - dist / LINK_DIST) * LINK_ALPHA
          ctx.strokeStyle = line
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
        }
      }

      // Nodes, and the transient accent highlight for those the cursor is near.
      for (const n of nodes) {
        let near = 0
        if (mouse.active) {
          const d = Math.hypot(n.x - mouse.x, n.y - mouse.y)
          if (d < MOUSE_RADIUS) near = 1 - d / MOUSE_RADIUS
        }
        if (near > 0) {
          ctx.globalAlpha = MOUSE_LINK_ALPHA * near
          ctx.strokeStyle = accent
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(n.x, n.y)
          ctx.lineTo(mouse.x, mouse.y)
          ctx.stroke()
        }
        ctx.globalAlpha = NODE_ALPHA + near * 0.4
        ctx.fillStyle = near > 0.15 ? accent : line
        ctx.beginPath()
        ctx.arc(n.x, n.y, near > 0 ? 1.6 + near * 1.4 : 1.6, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    const step = (dt: number): void => {
      for (const n of nodes) {
        if (mouse.active) {
          const dx = mouse.x - n.x
          const dy = mouse.y - n.y
          const d = Math.hypot(dx, dy)
          if (d > 0 && d < MOUSE_RADIUS) {
            const pull = MOUSE_PULL * (1 - d / MOUSE_RADIUS)
            n.vx += (dx / d) * pull * dt
            n.vy += (dy / d) * pull * dt
          }
        }
        // Clamp speed so the cursor pull can never accelerate a node past a gentle drift.
        const sp = Math.hypot(n.vx, n.vy)
        if (sp > MAX_SPEED) {
          n.vx = (n.vx / sp) * MAX_SPEED
          n.vy = (n.vy / sp) * MAX_SPEED
        }
        n.x += n.vx * dt
        n.y += n.vy * dt
        // Soft-bounce off the hero edges so the field stays put.
        if (n.x < 0) { n.x = 0; n.vx = Math.abs(n.vx) }
        else if (n.x > width) { n.x = width; n.vx = -Math.abs(n.vx) }
        if (n.y < 0) { n.y = 0; n.vy = Math.abs(n.vy) }
        else if (n.y > height) { n.y = height; n.vy = -Math.abs(n.vy) }
      }
    }

    // Reduced motion: one static frame, no loop, no pointer tracking.
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (reduced.matches) {
      draw()
      return
    }

    let raf = 0
    let last = 0
    let running = false
    const frame = (t: number): void => {
      const dt = last ? Math.min((t - last) / 1000, 0.032) : 0
      last = t
      step(dt)
      draw()
      raf = requestAnimationFrame(frame)
    }
    const start = (): void => {
      if (running) return
      running = true
      last = 0
      raf = requestAnimationFrame(frame)
    }
    const stop = (): void => {
      running = false
      cancelAnimationFrame(raf)
    }

    const onMove = (e: PointerEvent): void => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      mouse.active = x >= 0 && y >= 0 && x <= width && y <= height
      mouse.x = x
      mouse.y = y
    }
    const onLeave = (): void => {
      mouse.active = false
    }
    const onVisibility = (): void => {
      if (document.hidden) stop()
      else start()
    }

    // Pause when the hero scrolls out of view; resume when it returns.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !document.hidden) start()
        else stop()
      },
      { threshold: 0 },
    )
    io.observe(parent)

    const ro = new ResizeObserver(resize)
    ro.observe(parent)

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerleave', onLeave)
    document.addEventListener('visibilitychange', onVisibility)

    start()

    return () => {
      stop()
      io.disconnect()
      ro.disconnect()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return <canvas ref={canvasRef} className="hero-constellation" aria-hidden="true" />
}

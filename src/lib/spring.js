// Physical motion helpers, after Apple's "Designing Fluid Interfaces" (WWDC 2018).
// No library: a spring is a few lines of maths run on requestAnimationFrame.
//
// A spring is described like Apple does it, with two numbers:
// - damping: 1 = settles without overshoot; below 1 = overshoots a little.
// - response: roughly how fast it gets there, in seconds (not a duration).

const reduceMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// One integration step (semi-implicit Euler, mass 1). Returns the new { x, v }.
export function springStep({ x, v }, target, { damping = 1, response = 0.4 }, dt) {
  const omega = (2 * Math.PI) / response
  const stiffness = omega * omega
  const friction = 2 * damping * omega
  const a = -stiffness * (x - target) - friction * v
  const nv = v + a * dt
  return { x: x + nv * dt, v: nv }
}

// Sample a spring from 0 to 1 (at rest) as points, for a CSS `linear()` curve.
// Returns { points: number[], duration: ms }.
export function springCurve({ damping = 1, response = 0.4 } = {}, step = 1 / 60) {
  let s = { x: 0, v: 0 }
  const points = [0]
  let t = 0
  while (t < 3) {
    for (let i = 0; i < 8; i++) s = springStep(s, 1, { damping, response }, step / 8)
    t += step
    points.push(s.x)
    if (Math.abs(1 - s.x) < 0.001 && Math.abs(s.v) < 0.01) break
  }
  points[points.length - 1] = 1
  return { points, duration: Math.round(t * 1000) }
}

// Animates one number from `from` to `to`, starting at `velocity` (units/s).
// Interruptible: `retarget(to)` keeps the current value and velocity, so a new
// target never makes the motion jump or stop dead (WWDC: "no brick wall").
export function animateSpring({ from, to, velocity = 0, damping = 1, response = 0.4, onUpdate, onComplete }) {
  let s = { x: from, v: velocity }
  let target = to
  let frame = 0
  let last = 0
  let done = false

  if (reduceMotion()) {
    onUpdate?.(to)
    onComplete?.()
    return { stop() {}, retarget() {}, get value() { return to }, get velocity() { return 0 } }
  }

  const tick = (now) => {
    const dt = Math.min(0.064, last ? (now - last) / 1000 : 1 / 60)
    last = now
    // Small fixed sub-steps keep stiff springs stable on slow frames.
    const n = Math.max(1, Math.ceil(dt / (1 / 240)))
    for (let i = 0; i < n; i++) s = springStep(s, target, { damping, response }, dt / n)
    const atRest = Math.abs(s.x - target) < 0.1 && Math.abs(s.v) < 1
    if (atRest) {
      s = { x: target, v: 0 }
      onUpdate?.(target)
      done = true
      onComplete?.()
      return
    }
    onUpdate?.(s.x)
    frame = requestAnimationFrame(tick)
  }
  frame = requestAnimationFrame(tick)

  return {
    stop() {
      cancelAnimationFrame(frame)
      done = true
    },
    retarget(next) {
      target = next
      if (done) {
        done = false
        last = 0
        frame = requestAnimationFrame(tick)
      }
    },
    get value() {
      return s.x
    },
    get velocity() {
      return s.v
    },
  }
}

// Where a flick would come to rest, like scroll deceleration (Apple's sample code).
// velocity in px/s; decelerationRate 0.998 = normal scroll, 0.99 = snappier.
export function project(velocity, decelerationRate = 0.998) {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate)
}

// Past a boundary, follow less and less the further you pull (iOS rubber band).
export function rubberband(overshoot, dimension, constant = 0.55) {
  if (dimension <= 0) return 0
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot))
}

// Remembers the last pointer positions to measure the release velocity (px/s).
export function velocityTracker(windowMs = 100) {
  let samples = []
  return {
    add(position, time) {
      samples.push({ position, time })
      samples = samples.filter((s) => time - s.time <= windowMs)
    },
    velocity() {
      if (samples.length < 2) return 0
      const first = samples[0]
      const last = samples[samples.length - 1]
      const dt = last.time - first.time
      return dt > 0 ? ((last.position - first.position) / dt) * 1000 : 0
    },
    reset() {
      samples = []
    },
  }
}

// A short buzz on phones that support it, only for "it's done" moments.
export function haptic(pattern = 10) {
  try {
    if (!reduceMotion()) navigator.vibrate?.(pattern)
  } catch {
    // Not supported: nothing to do.
  }
}

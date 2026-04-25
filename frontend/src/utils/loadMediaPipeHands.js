/**
 * Loads @mediapipe/hands as a plain script tag exactly once.
 * Returns a promise that resolves to the `Hands` constructor.
 * Subsequent calls return the same cached promise.
 */
const HANDS_URL = 'https://unpkg.com/@mediapipe/hands@0.4.1646424915/hands.js'

let _promise = null

export function loadMediaPipeHands() {
  if (_promise) return _promise
  _promise = new Promise((resolve, reject) => {
    if (window.Hands) { resolve(window.Hands); return }
    const script = document.createElement('script')
    script.src = HANDS_URL
    script.crossOrigin = 'anonymous'
    script.onload = () => resolve(window.Hands)
    script.onerror = () => reject(new Error('Failed to load MediaPipe Hands'))
    document.head.appendChild(script)
  })
  return _promise
}

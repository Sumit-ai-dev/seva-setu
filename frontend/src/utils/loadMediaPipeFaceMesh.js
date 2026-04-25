/**
 * Loads @mediapipe/face_mesh as a plain script tag exactly once.
 * Returns a promise that resolves to the `FaceMesh` constructor.
 */
const FACE_MESH_URL = 'https://unpkg.com/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js'

let _promise = null

export function loadMediaPipeFaceMesh() {
  if (_promise) return _promise
  _promise = new Promise((resolve, reject) => {
    if (window.FaceMesh) { resolve(window.FaceMesh); return }
    const script = document.createElement('script')
    script.src = FACE_MESH_URL
    script.crossOrigin = 'anonymous'
    script.onload = () => resolve(window.FaceMesh)
    script.onerror = () => reject(new Error('Failed to load MediaPipe FaceMesh'))
    document.head.appendChild(script)
  })
  return _promise
}

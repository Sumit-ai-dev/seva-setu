// Centralized API base URL — set VITE_API_URL in .env to override
export const API_BASE_URL = 'http://localhost:8000/api/v1'

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

/**
 * apiFetch — drop-in fetch() replacement for Render backend calls.
 *
 * Render free tier spins down after inactivity. First request after
 * spin-down fails or times out. This wrapper:
 *   1. Tries the request normally.
 *   2. On network failure or 502/503/504, waits 4s then retries once.
 *   3. Shows nothing extra — callers handle errors as before.
 */
export async function apiFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`
  const MAX_RETRIES = 9
  const RETRY_DELAY = 5000 // 5 seconds between attempts

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, options)

      // Render returns 502/503/504 while waking up
      if (res.status === 502 || res.status === 503 || res.status === 504) {
        if (attempt < MAX_RETRIES - 1) {
          console.log(`[apiFetch] Server waking up (status ${res.status}), retrying in ${RETRY_DELAY}ms... (Attempt ${attempt + 1}/${MAX_RETRIES})`)
          await sleep(RETRY_DELAY)
          continue
        }
      }
      return res
    } catch (err) {
      // Network error (server still waking or DNS resolving)
      if (attempt < MAX_RETRIES - 1) {
        console.log(`[apiFetch] Network error or server starting, retrying in ${RETRY_DELAY}ms... (Attempt ${attempt + 1}/${MAX_RETRIES})`)
        await sleep(RETRY_DELAY)
        continue
      }
      throw err // Re-throw if all retries fail
    }
  }
}

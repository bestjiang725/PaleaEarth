import axios from 'axios'

// In production (Cloudflare Pages), API is on a separate Tunnel URL
// In dev, Vite proxy handles /api/* → localhost:8000
const apiBase = import.meta.env.VITE_API_BASE_URL || ''

const apiClient = axios.create({
  baseURL: `${apiBase}/api/v1`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.msg || err.response?.data?.detail || err.message
    return Promise.reject(msg)
  }
)

export default apiClient

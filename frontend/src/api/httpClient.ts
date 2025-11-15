import axios from 'axios'

const baseURL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}`

export const httpClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API error', error)
    return Promise.reject(error)
  },
)

export default httpClient

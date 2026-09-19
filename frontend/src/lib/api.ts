import axios from "axios"

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api/v1",
  timeout: 4000,
})

// /health живёт вне /api/v1 — отдельный клиент без версионного префикса.
export const rootApi = axios.create({
  baseURL: "/",
  timeout: 4000,
})

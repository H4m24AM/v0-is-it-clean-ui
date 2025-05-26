"use client"

import { useEffect } from "react"

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
          })

          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  // New content is available, show update notification
                  if (confirm("New version available! Reload to update?")) {
                    window.location.reload()
                  }
                }
              })
            }
          })

          console.log("Service Worker registered successfully")
        } catch (error) {
          console.error("Service Worker registration failed:", error)
        }
      }

      registerSW()
    }
  }, [])

  return null
}

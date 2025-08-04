"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Camera, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import CleanBiteHome from "@/components/cleanbite-home"
import CleanBitePassResults from "@/components/cleanbite-pass-results"
import CleanBiteFailResults from "@/components/cleanbite-fail-results"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"
import { ServiceWorkerRegistration } from "@/components/service-worker-registration"

type AppState = "home" | "scanning" | "results" | "history"
type ScanResult = "pass" | "fail"

interface ScanData {
  preference: string
  customRestriction?: string
  ingredients: string[]
  result: ScanResult
  reasons?: string[]
  flaggedIngredients?: Array<{ name: string; level: "fail" | "caution" | "pass"; reason?: string }>
  confidence: "high" | "medium" | "low"
}

export default function CleanBiteApp() {
  const [appState, setAppState] = useState<AppState>("home")
  const [language, setLanguage] = useState("en")
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [scanData, setScanData] = useState<ScanData | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Device detection
  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
      setIsMobile(mobileRegex.test(userAgent) || window.innerWidth <= 768)
    }

    checkDevice()
    window.addEventListener("resize", checkDevice)
    return () => window.removeEventListener("resize", checkDevice)
  }, [])

  const handleScanStart = async (preference: string, customRestriction?: string) => {
    setAppState("scanning")

    // Trigger file input
    fileInputRef.current?.click()

    // Store preference for later use
    setScanData({
      preference,
      customRestriction,
      ingredients: [],
      result: "pass",
      confidence: "high",
    })
  }

  // Function to resize and compress image more aggressively
  const processImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.crossOrigin = "anonymous" // Important for canvas operations to avoid CORS issues
        img.onload = () => {
          const canvas = document.createElement("canvas")
          // Reduced max dimensions for better mobile performance and lower memory
          const MAX_DIMENSION = 1024 // Max width or height for the image
          let width = img.width
          let height = img.height

          // Calculate new dimensions while maintaining aspect ratio
          if (width > height) {
            if (width > MAX_DIMENSION) {
              height *= MAX_DIMENSION / width
              width = MAX_DIMENSION
            }
          } else {
            if (height > MAX_DIMENSION) {
              width *= MAX_DIMENSION / height
              height = MAX_DIMENSION
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext("2d")
          if (!ctx) {
            reject(new Error("Could not get canvas context"))
            return
          }
          ctx.drawImage(img, 0, 0, width, height)

          try {
            // Convert canvas to base64 JPEG with more compression
            // Quality reduced to 0.6 (60%) for smaller file size
            const dataUrl = canvas.toDataURL("image/jpeg", 0.6)
            console.log(`Processed image dimensions: ${width}x${height}, Data URL size: ${dataUrl.length / 1024} KB`)
            resolve(dataUrl)
          } catch (canvasError) {
            console.error("Error converting canvas to Data URL:", canvasError)
            reject(new Error("Failed to compress image. Please try a smaller image."))
          }
        }
        img.onerror = (error) => {
          console.error("Error loading image for processing:", error)
          reject(new Error("Failed to load image. Please try another file."))
        }
        reader.readAsDataURL(file)
      }
      reader.onerror = (error) => {
        console.error("Error reading file:", error)
        reject(new Error("Failed to read file. Please try again."))
      }
    })
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !scanData) return

    setIsScanning(true)
    setScanProgress(0)

    // Revoke previous blob URL if it exists to free up memory
    if (uploadedImage) {
      URL.revokeObjectURL(uploadedImage)
    }

    try {
      // Process and compress the image before sending
      const processedBase64Image = await processImage(file)
      setUploadedImage(processedBase64Image) // Set the processed image for display

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setScanProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      // Call API for analysis
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: processedBase64Image, // Send the processed image
          preference: scanData.preference,
          customRestriction: scanData.customRestriction,
        }),
      })

      clearInterval(progressInterval)
      setScanProgress(100)

      const data = await res.json()
      console.log("Analysis result:", data)

      if (!res.ok) {
        throw new Error(data.error || "Analysis failed")
      }

      setScanData({
        ...scanData,
        ingredients: data.ingredients || [],
        result: data.result,
        reasons: data.reasons,
        flaggedIngredients: data.flaggedIngredients,
        confidence: data.confidence || "medium",
      })

      setIsScanning(false)
      setAppState("results")
    } catch (error) {
      console.error("Scanning failed:", error)
      setIsScanning(false)
      setAppState("home")
      // You might want to show an error toast here
    }
  }

  const handleShare = async () => {
    if (!scanData) return

    const message = `CleanBite Analysis: This product is ${scanData.result === "pass" ? "✅ suitable" : "❌ not suitable"} for ${scanData.preference} diet.`

    if (navigator.share) {
      try {
        await navigator.share({
          title: "CleanBite Scan Result",
          text: message,
          url: window.location.href,
        })
      } catch (err) {
        navigator.clipboard.writeText(message)
      }
    } else {
      navigator.clipboard.writeText(message)
    }
  }

  // Desktop frame wrapper
  if (!isMobile) {
    return (
      <div className="min-h-screen bg-[#eff4e0] flex items-center justify-center p-8">
        <div className="flex flex-col items-center space-y-8 max-w-6xl">
          <div className="relative">
            <div className="w-[375px] h-[812px] bg-black rounded-[3rem] p-2 shadow-2xl">
              <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-10"></div>
                <div className="h-full overflow-y-auto">
                  <CleanBiteHome
                    onScanStart={handleScanStart}
                    onShowHistory={() => setAppState("history")}
                    language={language}
                    onLanguageChange={setLanguage}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-4xl text-center space-y-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-slate-800">CleanBite - AI Food Scanner</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Advanced AI-powered ingredient analysis for dietary compliance. Optimized for mobile experience.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Mobile app states
  return (
    <div className="min-h-screen">
      <ServiceWorkerRegistration />
      <PWAInstallPrompt />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />

      {appState === "home" && (
        <CleanBiteHome
          onScanStart={handleScanStart}
          onShowHistory={() => setAppState("history")}
          language={language}
          onLanguageChange={setLanguage}
        />
      )}

      {appState === "scanning" && (
        <div className="min-h-screen bg-[#eff4e0] flex items-center justify-center">
          <Card className="max-w-sm mx-4 shadow-lg border-0 rounded-2xl">
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-20 h-20 mx-auto bg-[#2ECC71] rounded-full flex items-center justify-center">
                <Camera className="h-10 w-10 text-white" />
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 font-['Inter']">
                  {isScanning ? "Analyzing Ingredients..." : "Ready to Scan"}
                </h2>

                {isScanning && (
                  <>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-[#2ECC71] h-3 rounded-full transition-all duration-300"
                        style={{ width: `${scanProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600">{scanProgress}% Complete</p>
                  </>
                )}

                {!isScanning && (
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-[#2b583a] hover:bg-[#1e3f2a] text-white rounded-xl"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Choose Image
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {appState === "results" && scanData && (
        <>
          {scanData.result === "pass" ? (
            <CleanBitePassResults
              dietaryPreference={scanData.preference}
              ingredients={scanData.ingredients}
              approvedIngredients={scanData.ingredients.slice(0, 3)}
              confidence={scanData.confidence}
              onScanAnother={() => setAppState("home")}
              onEditIngredients={() => setAppState("home")}
              onShare={handleShare}
            />
          ) : (
            <CleanBiteFailResults
              dietaryPreference={scanData.preference}
              reasons={scanData.reasons || []}
              flaggedIngredients={scanData.flaggedIngredients || []}
              confidence={scanData.confidence}
              onScanAnother={() => setAppState("home")}
              onEditIngredients={() => setAppState("home")}
              onShare={handleShare}
              onShowHistory={() => setAppState("history")}
            />
          )}
        </>
      )}
    </div>
  )
}

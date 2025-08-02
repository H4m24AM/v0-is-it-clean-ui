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
import Tesseract from "tesseract.js"

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !scanData) return

    setUploadedImage(URL.createObjectURL(file))
    setIsScanning(true)
    setScanProgress(0)

    try {
      // OCR Processing
      const worker = await Tesseract.createWorker("eng")

      const {
        data: { text },
      } = await worker.recognize(file, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setScanProgress(Math.round(m.progress * 100))
          }
        },
      })

      await worker.terminate()

      // Mock AI Analysis
      const ingredients = text
        .split(/[,\n]/)
        .map((i) => i.trim())
        .filter((i) => i.length > 0)
      const mockAnalysis = analyzeMockIngredients(ingredients, scanData.preference)

      setScanData({
        ...scanData,
        ingredients,
        ...mockAnalysis,
      })

      setIsScanning(false)
      setAppState("results")
    } catch (error) {
      console.error("Scanning failed:", error)
      setIsScanning(false)
      setAppState("home")
    }
  }

  const analyzeMockIngredients = (ingredients: string[], preference: string) => {
    // Mock analysis logic
    const problematicIngredients = ["gelatin", "pork", "alcohol", "milk", "wheat", "gluten"]
    const found = ingredients.filter((ing) => problematicIngredients.some((prob) => ing.toLowerCase().includes(prob)))

    if (found.length > 0) {
      return {
        result: "fail" as const,
        reasons: [
          `Contains ${found[0]} which is not ${preference} compliant`,
          "May contain traces of other restricted ingredients",
        ],
        flaggedIngredients: found.map((ing) => ({
          name: ing,
          level: "fail" as const,
          reason: `${ing} is not suitable for ${preference} diet`,
        })),
        confidence: "high" as const,
      }
    }

    return {
      result: "pass" as const,
      confidence: "high" as const,
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

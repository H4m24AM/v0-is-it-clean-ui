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

<<<<<<< Updated upstream
export default function CleanBiteApp() {
  const [appState, setAppState] = useState<AppState>("home")
=======
type ScanResult = {
  id: string
  timestamp: Date
  productName: string
  checks: DietaryCheck[]
}

type ScanState = "idle" | "uploading" | "scanning" | "extracting" | "analyzing" | "complete"

type Corner = {
  x: number
  y: number
}


async function logToSupabase(message: string, step: string) {
  await fetch("https://YOUR_PROJECT_ID.supabase.co/rest/v1/logs", {
    method: "POST",
    headers: {
      apikey: "YOUR_SUPABASE_ANON_KEY",
      Authorization: "Bearer YOUR_SUPABASE_ANON_KEY",
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: JSON.stringify({ message, step })
  });
}

export default function IsItCleanApp() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scanState, setScanState] = useState<ScanState>("idle")
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [extractedText, setExtractedText] = useState("")
  const [currentResult, setCurrentResult] = useState<DietaryCheck[] | null>(null)
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([])
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    if (!file || !scanData) return

    setUploadedImage(URL.createObjectURL(file))
    setIsScanning(true)
    setScanProgress(0)
=======
    if (file) {
      console.log("File selected:", file.name, file.type)
      setScanState("uploading")
      console.log("📤 FileReader initialized");
      const reader = new FileReader()
      reader.onload = async (e) => {
  console.log("✅ FileReader loaded image");
  logToSupabase("FileReader loaded image", "reader.onload")
  logToSupabase("FileReader loaded image", "reader.onload")
  const originalImage = e.target?.result as string;
  if (!originalImage) {
    console.error("❌ No image result found");
    setScanState("idle");
    return;
  }
  console.log("📸 Uploaded image size:", originalImage.length);
  setUploadedImage(originalImage);
        console.log("🧠 Entering onload handler");
        console.log("File read successfully")
        const originalImage = e.target?.result as string
        setUploadedImage(originalImage)

        // Apply automatic enhancement if enabled
        if (enhancementSettings.autoEnhance) {
          setIsEnhancing(true)
          try {
            const enhanced = await autoEnhanceImage(originalImage)
            setEnhancedImage(enhanced)
          } catch (error) {
            console.error("Auto-enhancement failed:", error)
            setEnhancedImage(originalImage)
          } finally {
            setIsEnhancing(false)
          }
        } else {
          setEnhancedImage(originalImage)
        }

        if (autoScan) {
          console.log("🚀 Starting scan");
            await startScanning()
            console.log("✅ Scanning complete")
        } else {
          if (!extractedText.trim()) {
        setExtractedText("No recognizable text found. Try again.");
      }
      if (!extractedText.trim()) {
  console.warn("⚠️ OCR finished but found no usable text.");
  setExtractedText("OCR failed. Try again.");
}
console.log("🧠 Reached end of scanning");
setScanState("extracting"); logToSupabase("🧠 OCR started", "startScanning")
        }
      }
      
      reader.readAsDataURL(file)

      reader.onerror = (error) => {
        console.error("❌ File read error:", error);
        setScanState("extracting"); logToSupabase("🧠 OCR started", "startScanning");
        setExtractedText("Something went wrong loading the image.");
      };

  reader.onerror = (error) => {
    console.error("File read error:", error);
  logToSupabase("File read error", "reader.onerror")
    setScanState("idle");
  };
    } else {
      console.log("No file selected")
    }
  }

  const startScanning = async () => {
  setScanState("scanning");
  setOcrError(null);
  setOcrProgress(0);
  setDetectedLanguage(null);

  const imageToProcess = enhancedImage || uploadedImage;
  if (!imageToProcess) return;

  // Add timeout mechanism
  const OCR_TIMEOUT = 30000; // 30 seconds timeout
  let timeoutId: NodeJS.Timeout | null = null;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error("OCR processing timed out after 30 seconds"));
    }, OCR_TIMEOUT);
  });

  try {
    const optimizedImage = await optimizeImageForOCR(imageToProcess);

    const ocrPromise = (async () => {
      const currentLang = languages[language as keyof typeof languages];
      const primaryLang = currentLang.ocrCode;
      const languagesToTry = [
        primaryLang,
        \`\${primaryLang}+eng\`,
        "eng+ara+spa",
      ];

      let extractedText = "";
      for (let i = 0; i < languagesToTry.length; i++) {
        try {
          if (!worker) worker = await createWorkerInstance();
          await worker.loadLanguage(languagesToTry[i]);
          await worker.initialize(languagesToTry[i]);
          const result = await worker.recognize(optimizedImage);
          extractedText = result.data.text;
          if (extractedText.trim()) break;
        } catch (langErr) {
          console.error("Language OCR failed for", languagesToTry[i], langErr);
        }
      }
      return extractedText;
    })();

    const extractedText = await Promise.race([ocrPromise, timeoutPromise]);
    if (timeoutId) clearTimeout(timeoutId);

    if (!extractedText.trim()) throw new Error("OCR returned no usable text");
    setExtractedText(extractedText);
    setScanState("extracting");

  } catch (error: any) {
    if (timeoutId) clearTimeout(timeoutId);
    console.error("OCR Error:", error);
    if (error.message?.includes("timed out")) {
      setOcrError("OCR processing timed out. Please try a smaller or clearer image.");
    } else {
      setOcrError("Failed to read image. Please try a clearer photo or enter ingredients manually.");
    }
    setExtractedText("");
    setScanState("extracting");
    if (worker) {
      try {
        await worker.terminate();
      } catch (e) {
        console.error("Error terminating worker:", e);
      } finally {
        worker = null;
      }
    }
  }
};
    let scanTimeout = setTimeout(() => {
      console.error("⚠️ OCR timed out");
      setScanState("error");
    }, 15000); // 15 second timeout
    
  try {
    setScanState("scanning")
    setOcrError(null)
    setOcrProgress(0)
    setDetectedLanguage(null)

    const imageToProcess = enhancedImage || uploadedImage
    if (!imageToProcess) return
>>>>>>> Stashed changes

    try {
      // OCR Processing
      const worker = await Tesseract.createWorker("eng")

<<<<<<< Updated upstream
      const {
        data: { text },
      } = await worker.recognize(file, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setScanProgress(Math.round(m.progress * 100))
=======
      // For better accuracy, we'll try the selected language first, then fallback to multi-language
      const languagesToTry = [
        primaryLang, // Primary language based on UI selection
        `${primaryLang}+eng`, // Primary + English fallback
        "eng+ara+spa", // Multi-language as final fallback
      ]

      let extractedText = ""

      for (let i = 0; i < languagesToTry.length; i++) {
        const langCode = languagesToTry[i]

        try {
          setDetectedLanguage(langCode)

          // Initialize Tesseract worker with current language
          worker = await Tesseract.createWorker({
    logger: (m) => {
      if (m.status === "recognizing text") {
        setOcrProgress(Math.round(m.progress * 100));
      }
    },
  })

          // Configure for better ingredient label recognition
          await worker.setParameters({
            tessedit_char_whitelist:
              "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,()-/%أبتثجحخدذذرزسشصضطظعغفقكلمنهويىءآإؤئةÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ",
            tessedit_pageseg_mode: PSM.SINGLE_BLOCK, // Uniform block of text
          })

          // Perform OCR with progress tracking
          const {
            data: { text, confidence },
          } = await await worker.load(); await worker.loadLanguage('eng'); await worker.initialize('eng');
    const result = await imageToProcess);
console.log("🔍 OCR Text:", text);
console.log("📊 Confidence:", confidence);
console.log("🈶 Language:", langCode);

          await worker.terminate()
          worker = null

          // Check if we got good results (confidence > 60 and reasonable text length)
          if (confidence > 60 && text.trim().length > 5) {
            extractedText = text
            break
          } else if (i === languagesToTry.length - 1) {
            // Last attempt, use whatever we got
            extractedText = text
          }
        } catch (langError) {
          console.warn(`OCR failed for language ${langCode}:`, langError)
          if (worker) {
            await worker.terminate()
            worker = null
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
      setIsScanning(false)
      setAppState("results")
    } catch (error) {
      console.error("Scanning failed:", error)
      setIsScanning(false)
      setAppState("home")
=======
      if (!extractedText.trim()) {
        setExtractedText("No recognizable text found. Try again.");
      }
      if (!extractedText.trim()) {
  console.warn("⚠️ OCR finished but found no usable text.");
  setExtractedText("OCR failed. Try again.");
}
console.log("🧠 Reached end of scanning");
setScanState("extracting"); logToSupabase("🧠 OCR started", "startScanning")
      if (!extractedText) {
        setExtractedText("No text detected. Try a clearer image.")
      }
    } catch (error) {
      console.error("OCR Error:", error)
      setOcrError("Failed to read image. Please try a clearer photo or enter ingredients manually.")
      setExtractedText("")
      if (!extractedText.trim()) {
        setExtractedText("No recognizable text found. Try again.");
      }
      if (!extractedText.trim()) {
  console.warn("⚠️ OCR finished but found no usable text.");
  setExtractedText("OCR failed. Try again.");
}
console.log("🧠 Reached end of scanning");
setScanState("extracting"); logToSupabase("🧠 OCR started", "startScanning")
>>>>>>> Stashed changes
    }
  }

  const analyzeMockIngredients = (ingredients: string[], preference: string) => {
    // Mock analysis logic
    const problematicIngredients = ["gelatin", "pork", "alcohol", "milk", "wheat", "gluten"]
    const found = ingredients.filter((ing) => problematicIngredients.some((prob) => ing.toLowerCase().includes(prob)))

<<<<<<< Updated upstream
    if (found.length > 0) {
=======
    // Language-specific cleaning
    if (isRTL) {
      // Arabic text processing
      cleaned = cleaned
        .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\w\s,()-]/g, "") // Keep Arabic characters and common punctuation
        .replace(/\s*،\s*/g, ", ") // Normalize Arabic comma
    } else {
      // Latin script processing
      cleaned = cleaned.replace(/[^\w\s,()%-]/g, "") // Remove special characters except common ones
    }

    return cleaned
  }

 const analyzeIngredients = async () => {
  if (!extractedText.trim()) return;

  // Validation check for preferences
  if (!dietaryChecks.some(check => check.enabled)) {
    setOcrError("Please select at least one dietary preference");
    setScanState("idle");
    return;
  }

  console.log("Selected preferences:", dietaryChecks.filter(c => c.enabled).map(c => c.id));
  if (!extractedText.trim()) return;
    } catch (error) {
    console.error("❌ OCR failed:", error);
    setScanState("idle");
    return;
  }
  setScanState("analyzing");

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ingredients: extractedText }),
    });

    const result = await response.json();

    const results: DietaryCheck[] = dietaryChecks.map((check) => {
      const verdict = result[check.id];
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
      {appState === "scanning" && (
        <div className="min-h-screen bg-[#eff4e0] flex items-center justify-center">
          <Card className="max-w-sm mx-4 shadow-lg border-0 rounded-2xl">
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-20 h-20 mx-auto bg-[#2ECC71] rounded-full flex items-center justify-center">
                <Camera className="h-10 w-10 text-white" />
=======
  {/* ✅ File input is now separate and fully functional */}
  <label htmlFor="file-upload" className="cursor-pointer p-2 bg-slate-200 rounded block text-center w-full">
  Tap to Upload Image
</label>
<input id="file-upload"
    ref={fileInputRef}
    type="file"
    accept="image/*"
    capture="environment"
    onChange={handleFileUpload}
    className="block w-full mt-2"
  />
</div>

              </div>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Advanced OCR technology processes images locally on your device
              </p>
              {!dietaryChecks.some((check) => check.enabled) && (
                <p className="text-xs text-amber-600 font-medium">Please select at least one dietary preference</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Image Preview with Scanning Animation */}
        {uploadedImage && (
          <Card className="relative overflow-hidden">
            <CardContent className="p-0">
              <div className="relative">
                <img
                  src={uploadedImage || "/placeholder.svg"}
                  alt="Uploaded product"
                  className="w-full h-48 object-cover"
                />

                {/* Scanning Animation */}
                {scanState === "scanning" && (
                  <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                    <div className="text-center text-white space-y-4">
                      <div className="relative w-20 h-20 mx-auto">
                        <div className="absolute inset-0 border-4 border-green-400 border-t-transparent rounded-full animate-spin" />
                        <div className="absolute inset-3 flex items-center justify-center">
                          <span className="text-sm font-bold">{ocrProgress}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold text-lg">Analyzing Ingredients</p>
                        <p className="text-sm opacity-90">
                          {detectedLanguage
                            ? `Processing ${detectedLanguage.toUpperCase()} text`
                            : "Advanced OCR in progress"}
                        </p>
                        {ocrProgress > 0 && (
                          <div className="w-40 mx-auto mt-3 bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-green-400 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${ocrProgress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {scanState === "uploading" && (
                  <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto mb-3" />
                      <p className="font-medium">Processing Image</p>
                    </div>
                  </div>
                )}
>>>>>>> Stashed changes
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 font-['Inter']">
                  {isScanning ? "Analyzing Ingredients..." : "Ready to Scan"}
                </h2>

<<<<<<< Updated upstream
                {isScanning && (
=======
        {/* Image Enhancement Section */}
        {uploadedImage && scanState !== "scanning" && scanState !== "uploading" && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">Image Enhancement</h3>
                <Button onClick={() => setShowImageEnhancement(!showImageEnhancement)} variant="outline" size="sm">
                  {showImageEnhancement ? "Hide" : "Show"} Controls
                </Button>
              </div>

              {/* Before/After Preview */}
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Original</p>
                  <img
                    src={uploadedImage || "/placeholder.svg"}
                    alt="Original"
                    className="w-full h-24 object-cover rounded border"
                  />
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Enhanced</p>
                  {isEnhancing ? (
                    <div className="w-full h-24 bg-gray-100 rounded border flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600" />
                    </div>
                  ) : (
                    <img
                      src={enhancedImage || uploadedImage}
                      alt="Enhanced"
                      className="w-full h-24 object-cover rounded border"
                    />
                  )}
                </div>
              </div>

              {/* Perspective Correction Status */}
              {detectedCorners && (
                <div className="p-2 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-xs text-blue-700">
                    ✅ Perspective correction applied for optimal text recognition
                  </p>
                </div>
              )}

              {showImageEnhancement && (
                <div className="space-y-4">
                  {/* Auto Enhancement Toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Auto Enhancement</span>
                    <Switch
                      checked={enhancementSettings.autoEnhance}
                      onCheckedChange={(checked) =>
                        setEnhancementSettings((prev) => ({ ...prev, autoEnhance: checked }))
                      }
                    />
                  </div>

                  {/* Perspective Correction Toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Perspective Correction</span>
                    <Switch
                      checked={enhancementSettings.perspectiveCorrection}
                      onCheckedChange={(checked) =>
                        setEnhancementSettings((prev) => ({ ...prev, perspectiveCorrection: checked }))
                      }
                    />
                  </div>

                  {/* Manual Controls */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Brightness: {enhancementSettings.brightness}
                      </label>
                      <label htmlFor="file-upload" className="cursor-pointer p-2 bg-slate-200 rounded block text-center w-full">
  Tap to Upload Image
</label>
<input id="file-upload"
                        type="range"
                        min="-50"
                        max="50"
                        value={enhancementSettings.brightness}
                        onChange={(e) =>
                          setEnhancementSettings((prev) => ({ ...prev, brightness: Number.parseInt(e.target.value) }))
                        }
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Contrast: {enhancementSettings.contrast}
                      </label>
                      <label htmlFor="file-upload" className="cursor-pointer p-2 bg-slate-200 rounded block text-center w-full">
  Tap to Upload Image
</label>
<input id="file-upload"
                        type="range"
                        min="0"
                        max="100"
                        value={enhancementSettings.contrast}
                        onChange={(e) =>
                          setEnhancementSettings((prev) => ({ ...prev, contrast: Number.parseInt(e.target.value) }))
                        }
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Sharpness: {enhancementSettings.sharpness}
                      </label>
                      <label htmlFor="file-upload" className="cursor-pointer p-2 bg-slate-200 rounded block text-center w-full">
  Tap to Upload Image
</label>
<input id="file-upload"
                        type="range"
                        min="0"
                        max="50"
                        value={enhancementSettings.sharpness}
                        onChange={(e) =>
                          setEnhancementSettings((prev) => ({ ...prev, sharpness: Number.parseInt(e.target.value) }))
                        }
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Grayscale</span>
                      <Switch
                        checked={enhancementSettings.grayscale}
                        onCheckedChange={(checked) =>
                          setEnhancementSettings((prev) => ({ ...prev, grayscale: checked }))
                        }
                      />
                    </div>
                  </div>

                  {/* Apply Enhancement Button */}
                  <div className="flex space-x-2">
                    <Button
                      onClick={applyEnhancements}
                      disabled={isEnhancing}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      size="sm"
                    >
                      {isEnhancing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Enhancing...
                        </>
                      ) : (
                        "Apply Enhancement"
                      )}
                    </Button>

                    <Button
                      onClick={async () => {
                        if (uploadedImage) {
                          const enhanced = await autoEnhanceImage(uploadedImage)
                          setEnhancedImage(enhanced)
                        }
                      }}
                      variant="outline"
                      size="sm"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Auto Enhance
                    </Button>
                  </div>

                  <div className="text-xs text-gray-500 space-y-1">
                    <p>🎯 Optimal settings automatically applied for ingredient label recognition</p>
                    <p>📐 Perspective correction straightens angled photos for better accuracy</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Text Preview Section with Before/After */}
        {(extractedText || ocrError) && scanState !== "scanning" && scanState !== "uploading" && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">Extracted Ingredients</h3>
                <Button onClick={() => setShowBeforeAfter(!showBeforeAfter)} variant="outline" size="sm">
                  {showBeforeAfter ? "Hide" : "Show"} Comparison
                </Button>
              </div>

              {showBeforeAfter && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-2">📸 Original Label</p>
                    <img
                      src={uploadedImage || "/placeholder.svg"}
                      alt="Original label"
                      className="w-full h-32 object-cover rounded border"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-2">🔤 Extracted Text</p>
                    <div className="w-full h-32 p-2 bg-gray-50 rounded border overflow-y-auto text-xs">
                      {highlightProblemIngredients(extractedText)}
                    </div>
                  </div>
                </div>
              )}

              {ocrError && (
  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
    <p className="text-sm text-red-700">{ocrError}</p>
    {ocrError.includes("dietary preference") && (
      <Button 
        onClick={() => {
          resetScan();
          document.querySelector('.dietary-preferences')?.scrollIntoView({ behavior: 'smooth' });
        }} 
        variant="link" 
        size="sm" 
        className="text-red-700"
      >
        Select Preferences
      </Button>
    )}
  </div>

                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700">{ocrError}</p>
                </div>
              )}

              <div className="space-y-2">
                <Textarea
                  value={extractedText}
                  onChange={(e) => setExtractedText(e.target.value)}
                  placeholder="Enter ingredients manually if OCR failed..."
                  className={`min-h-24 ${languages[language as keyof typeof languages]?.rtl ? "text-right" : "text-left"}`}
                  dir={languages[language as keyof typeof languages]?.rtl ? "rtl" : "ltr"}
                />

                {problemIngredients.length > 0 && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded">
                    <p className="text-xs text-red-700 font-medium mb-1">⚠️ Flagged Ingredients:</p>
                    <div className="flex flex-wrap gap-1">
                      {problemIngredients.map((ingredient, index) => (
                        <TooltipProvider key={index}>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="destructive" className="text-xs cursor-help">
                                {ingredient}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">
                                {ingredient === "gelatin" &&
                                  "Typically animal-derived — may not meet dietary standards"}
                                {ingredient === "milk powder" && "Dairy product — not suitable for vegan diets"}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                <p>💡 Ensure ingredient lists are clearly visible and well-lit for optimal recognition</p>
                <p>🌐 OCR Language: {languages[language as keyof typeof languages]?.name}</p>
                <p>✏️ Review and edit extracted text before analysis if needed</p>
              </div>

              <Button
                onClick={analyzeIngredients}
                disabled={scanState === "analyzing" || !extractedText.trim()}
                className="w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 transition-all duration-300"
              >
                {scanState === "analyzing" ? (
>>>>>>> Stashed changes
                  <>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
<<<<<<< Updated upstream
                        className="bg-[#2ECC71] h-3 rounded-full transition-all duration-300"
                        style={{ width: `${scanProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600">{scanProgress}% Complete</p>
                  </>
                )}
=======
                        key={index}
                        className={`p-2 rounded text-sm ${
                          message.role === "user" ? "bg-blue-100 text-blue-800 ml-4" : "bg-white text-gray-800 mr-4"
                        }`}
                      >
                        {message.content}
                      </div>
                    ))
                  )}
                </div>
                <div className="flex space-x-2">
                  <label htmlFor="file-upload" className="cursor-pointer p-2 bg-slate-200 rounded block text-center w-full">
  Tap to Upload Image
</label>
<input id="file-upload"
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleChatSubmit()}
                    placeholder="Ask about ingredients..."
                    className="flex-1 p-2 border rounded text-sm"
                  />
                  <Button onClick={handleChatSubmit} size="sm">
                    Send
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
>>>>>>> Stashed changes

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


const optimizeImageForOCR = async (imageDataUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();

    img.onload = () => {
      const MAX_SIZE = 1200;
      let width = img.width;
      let height = img.height;

      if (width > MAX_SIZE || height > MAX_SIZE) {
        if (width > height) {
          height = Math.round((height * MAX_SIZE) / width);
          width = MAX_SIZE;
        } else {
          width = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };

    img.src = imageDataUrl;
  });
};

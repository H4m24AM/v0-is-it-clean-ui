"use client";

import type React from "react"

import { useState, useRef, useEffect } from "react"
import {
  Camera,
  Upload,
  Settings,
  Share2,
  Info,
  X,
  Check,
  AlertCircle,
  Globe,
  RotateCcw,
  Lightbulb,
  MessageCircle,
  Star,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Tesseract from "tesseract.js"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Checkbox } from "@/components/ui/checkbox"

type DietaryCheck = {
  id: string
  name: string
  icon: string
  status: "pass" | "fail" | "unknown"
  explanation: string
  failReason?: string
  enabled: boolean
}

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

export default function IsItCleanApp() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scanState, setScanState] = useState<ScanState>("idle")
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [extractedText, setExtractedText] = useState("")
  const [currentResult, setCurrentResult] = useState<DietaryCheck[] | null>(null)
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([])
  const [language, setLanguage] = useState("en")
  const [darkMode, setDarkMode] = useState(false)
  const [autoScan, setAutoScan] = useState(true)
  const [organicCheck, setOrganicCheck] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [showFAQ, setShowFAQ] = useState(false)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrError, setOcrError] = useState<string | null>(null)
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null)
  const [ocrLanguages, setOcrLanguages] = useState<string[]>(["eng"])
  const [showImageEnhancement, setShowImageEnhancement] = useState(false)
  const [enhancementSettings, setEnhancementSettings] = useState({
    brightness: 0,
    contrast: 20,
    sharpness: 10,
    grayscale: true,
    autoEnhance: true,
    perspectiveCorrection: true,
  })
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [detectedCorners, setDetectedCorners] = useState<Corner[] | null>(null)
  const [showPerspectiveControls, setShowPerspectiveControls] = useState(false)
  const [manualCorners, setManualCorners] = useState<Corner[] | null>(null)
  const perspectiveCanvasRef = useRef<HTMLCanvasElement>(null)
  const [showBeforeAfter, setShowBeforeAfter] = useState(false)
  const [confidenceLevel, setConfidenceLevel] = useState<"high" | "medium" | "low">("medium")
  const [problemIngredients, setProblemIngredients] = useState<string[]>([])
  const [healthRating, setHealthRating] = useState<number>(0)
  const [showChatbot, setShowChatbot] = useState(false)
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([])
  const [chatInput, setChatInput] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])

  // Add this hook after the existing state declarations
  const [isMobile, setIsMobile] = useState(false)

  const languages = {
    en: { name: "English", flag: "🇺🇸", ocrCode: "eng", rtl: false },
    ar: { name: "العربية", flag: "🇸🇦", ocrCode: "ara", rtl: true },
    es: { name: "Español", flag: "🇪🇸", ocrCode: "spa", rtl: false },
  }

  const [dietaryChecks, setDietaryChecks] = useState<DietaryCheck[]>([
    {
      id: "halal",
      name: "Halal",
      icon: "🕌",
      status: "unknown",
      explanation: "Complies with Islamic dietary laws",
      failReason: "Contains non-halal ingredients",
      enabled: false,
    },
    {
      id: "vegan",
      name: "Vegan",
      icon: "🌱",
      status: "unknown",
      explanation: "Contains only plant-based ingredients",
      failReason: "Contains animal-derived ingredients",
      enabled: false,
    },
    {
      id: "kosher",
      name: "Kosher",
      icon: "✡️",
      status: "unknown",
      explanation: "Meets kosher dietary requirements",
      failReason: "Contains non-kosher ingredients",
      enabled: false,
    },
    {
      id: "organic",
      name: "Organic",
      icon: "🌿",
      status: "unknown",
      explanation: "Certified organic ingredients",
      failReason: "No organic certification found",
      enabled: false,
    },
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
  if (typeof window !== 'undefined') {
    setCurrentUrl(window.location.href);
  }
}, []);



  ])

  // Load scan history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("isItClean_scanHistory")
    if (saved) {
      setScanHistory(JSON.parse(saved))
    }
  }, [])

  // Add device detection useEffect after the existing useEffects
  useEffect(() => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return;

  const checkDevice = () => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    setIsMobile(mobileRegex.test(userAgent) || window.innerWidth <= 768);
  };

  checkDevice();
  window.addEventListener('resize', checkDevice);

  return () => window.removeEventListener('resize', checkDevice);
}, []);


  // Save scan history to localStorage
  const saveScanHistory = (history: ScanResult[]) => {
    localStorage.setItem("isItClean_scanHistory", JSON.stringify(history))
    setScanHistory(history)
  }

  const toggleDietaryCheck = (id: string) => {
    setDietaryChecks((prev) => prev.map((check) => (check.id === id ? { ...check, enabled: !check.enabled } : check)))
  }

  const detectEdges = (imageData: ImageData): ImageData => {
    const data = imageData.data
    const width = imageData.width
    const height = imageData.height
    const output = new ImageData(width, height)
    const outputData = output.data

    // Convert to grayscale first
    const grayscale = new Uint8Array(width * height)
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
      grayscale[i / 4] = gray
    }

    // Apply Gaussian blur to reduce noise
    const blurred = applyGaussianBlur(grayscale, width, height)

    // Sobel edge detection
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1]
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1]

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0
        let gy = 0

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = (y + ky) * width + (x + kx)
            const kernelIdx = (ky + 1) * 3 + (kx + 1)
            gx += blurred[idx] * sobelX[kernelIdx]
            gy += blurred[idx] * sobelY[kernelIdx]
          }
        }

        const magnitude = Math.sqrt(gx * gx + gy * gy)
        const edge = magnitude > 50 ? 255 : 0

        const outputIdx = (y * width + x) * 4
        outputData[outputIdx] = edge
        outputData[outputIdx + 1] = edge
        outputData[outputIdx + 2] = edge
        outputData[outputIdx + 3] = 255
      }
    }

    return output
  }

  const applyGaussianBlur = (data: Uint8Array, width: number, height: number): Uint8Array => {
    const output = new Uint8Array(width * height)
    const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1]
    const kernelSum = 16

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let sum = 0
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = (y + ky) * width + (x + kx)
            const kernelIdx = (ky + 1) * 3 + (kx + 1)
            sum += data[idx] * kernel[kernelIdx]
          }
        }
        output[y * width + x] = sum / kernelSum
      }
    }

    return output
  }

  const detectRectangleCorners = (imageData: ImageData): Corner[] | null => {
    const edges = detectEdges(imageData)
    const width = imageData.width
    const height = imageData.height

    // Find contours by scanning for edge pixels
    const edgePixels: Corner[] = []
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4
        if (edges.data[idx] > 128) {
          edgePixels.push({ x, y })
        }
      }
    }

    if (edgePixels.length < 100) return null

    // Use a simplified approach to find the largest rectangle
    // Find the bounding box of the strongest edge cluster
    const centerX = width / 2
    const centerY = height / 2
    const searchRadius = Math.min(width, height) * 0.4

    // Find edges near the center (likely to be the ingredient label)
    const centralEdges = edgePixels.filter((pixel) => {
      const dx = pixel.x - centerX
      const dy = pixel.y - centerY
      return Math.sqrt(dx * dx + dy * dy) < searchRadius
    })

    if (centralEdges.length < 50) {
      // Fallback: use image corners with slight inset
      const inset = Math.min(width, height) * 0.1
      return [
        { x: inset, y: inset },
        { x: width - inset, y: inset },
        { x: width - inset, y: height - inset },
        { x: inset, y: height - inset },
      ]
    }

    // Find the bounding rectangle of central edges
    const minX = Math.min(...centralEdges.map((p) => p.x))
    const maxX = Math.max(...centralEdges.map((p) => p.x))
    const minY = Math.min(...centralEdges.map((p) => p.y))
    const maxY = Math.max(...centralEdges.map((p) => p.y))

    // Expand the rectangle slightly to ensure we capture the full text area
    const padding = 20
    return [
      { x: Math.max(0, minX - padding), y: Math.max(0, minY - padding) },
      { x: Math.min(width, maxX + padding), y: Math.max(0, minY - padding) },
      { x: Math.min(width, maxX + padding), y: Math.min(height, maxY + padding) },
      { x: Math.max(0, minX - padding), y: Math.min(height, maxY + padding) },
    ]
  }

  const applyPerspectiveCorrection = async (
    imageDataUrl: string,
    corners: Corner[],
    outputWidth = 400,
    outputHeight = 300,
  ): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")!
      const img = new Image()

      img.crossOrigin = "anonymous"
      img.onload = () => {
        canvas.width = outputWidth
        canvas.height = outputHeight

        // Calculate perspective transformation matrix
        const srcCorners = corners
        const dstCorners = [
          { x: 0, y: 0 },
          { x: outputWidth, y: 0 },
          { x: outputWidth, y: outputHeight },
          { x: 0, y: outputHeight },
        ]

        // Apply perspective transformation using transform matrix
        ctx.save()

        // Calculate transformation matrix (simplified approach)
        const transform = calculatePerspectiveTransform(srcCorners, dstCorners, img.width, img.height)

        // Apply the transformation
        ctx.setTransform(transform.a, transform.b, transform.c, transform.d, transform.e, transform.f)

        // Draw the transformed image
        ctx.drawImage(img, 0, 0, img.width, img.height)

        ctx.restore()

        resolve(canvas.toDataURL("image/jpeg", 0.9))
      }

      img.src = imageDataUrl
    })
  }

  const calculatePerspectiveTransform = (
    src: Corner[],
    dst: Corner[],
    imgWidth: number,
    imgHeight: number,
  ): DOMMatrix => {
    // Simplified perspective transform calculation
    // For a more accurate implementation, you would use a full homography calculation

    const scaleX = (dst[1].x - dst[0].x) / (src[1].x - src[0].x)
    const scaleY = (dst[2].y - dst[1].y) / (src[2].y - src[1].y)

    const translateX = dst[0].x - src[0].x * scaleX
    const translateY = dst[0].y - src[0].y * scaleY

    // Calculate skew based on corner positions
    const skewX = ((src[1].y - src[0].y) / (src[1].x - src[0].x)) * 0.1
    const skewY = ((src[3].x - src[0].x) / (src[3].y - src[0].y)) * 0.1

    return new DOMMatrix([scaleX, skewY, skewX, scaleY, translateX, translateY])
  }

  const enhanceImage = async (imageDataUrl: string, settings = enhancementSettings): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")!
      const img = new Image()

      img.crossOrigin = "anonymous"
      img.onload = async () => {
        canvas.width = img.width
        canvas.height = img.height

        // Draw original image
        ctx.drawImage(img, 0, 0)

        let processedImage = imageDataUrl

        // Apply perspective correction first if enabled
        if (settings.perspectiveCorrection) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const corners = detectedCorners || detectRectangleCorners(imageData)

          if (corners) {
            setDetectedCorners(corners)
            processedImage = await applyPerspectiveCorrection(imageDataUrl, corners)

            // Reload the corrected image for further processing
            const correctedImg = new Image()
            correctedImg.crossOrigin = "anonymous"
            await new Promise<void>((resolveImg) => {
              correctedImg.onload = () => {
                canvas.width = correctedImg.width
                canvas.height = correctedImg.height
                ctx.drawImage(correctedImg, 0, 0)
                resolveImg()
              }
              correctedImg.src = processedImage
            })
          }
        }

        // Get image data for processing
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data

        // Apply enhancements
        for (let i = 0; i < data.length; i += 4) {
          let r = data[i]
          let g = data[i + 1]
          let b = data[i + 2]

          // Convert to grayscale if enabled
          if (settings.grayscale) {
            const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
            r = g = b = gray
          }

          // Apply brightness
          r = Math.max(0, Math.min(255, r + settings.brightness))
          g = Math.max(0, Math.min(255, g + settings.brightness))
          b = Math.max(0, Math.min(255, b + settings.brightness))

          // Apply contrast
          const contrastFactor = (259 * (settings.contrast + 255)) / (255 * (259 - settings.contrast))
          r = Math.max(0, Math.min(255, contrastFactor * (r - 128) + 128))
          g = Math.max(0, Math.min(255, contrastFactor * (g - 128) + 128))
          b = Math.max(0, Math.min(255, contrastFactor * (b - 128) + 128))

          data[i] = r
          data[i + 1] = g
          data[i + 2] = b
        }

        // Apply sharpening if enabled
        if (settings.sharpness > 0) {
          const sharpened = applySharpeningFilter(imageData, settings.sharpness / 100)
          ctx.putImageData(sharpened, 0, 0)
        } else {
          ctx.putImageData(imageData, 0, 0)
        }

        // Apply threshold for better text recognition
        if (settings.grayscale) {
          const finalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const finalData = finalImageData.data

          for (let i = 0; i < finalData.length; i += 4) {
            const gray = finalData[i]
            const threshold = gray > 128 ? 255 : 0
            finalData[i] = threshold
            finalData[i + 1] = threshold
            finalData[i + 2] = threshold
          }

          ctx.putImageData(finalImageData, 0, 0)
        }

        resolve(canvas.toDataURL("image/jpeg", 0.9))
      }

      img.src = imageDataUrl
    })
  }

  const applySharpeningFilter = (imageData: ImageData, intensity: number): ImageData => {
    const data = imageData.data
    const width = imageData.width
    const height = imageData.height
    const output = new ImageData(width, height)
    const outputData = output.data

    // Sharpening kernel
    const kernel = [0, -intensity, 0, -intensity, 1 + 4 * intensity, -intensity, 0, -intensity, 0]

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * width + (x + kx)) * 4 + c
              sum += data[idx] * kernel[(ky + 1) * 3 + (kx + 1)]
            }
          }
          const outputIdx = (y * width + x) * 4 + c
          outputData[outputIdx] = Math.max(0, Math.min(255, sum))
        }
        const outputIdx = (y * width + x) * 4 + 3
        outputData[outputIdx] = data[outputIdx] // Alpha channel
      }
    }

    return output
  }

  const autoEnhanceImage = async (imageDataUrl: string): Promise<string> => {
    // Automatic enhancement with optimized settings for ingredient labels
    const autoSettings = {
      brightness: 10,
      contrast: 30,
      sharpness: 15,
      grayscale: true,
      autoEnhance: true,
      perspectiveCorrection: true,
    }

    return enhanceImage(imageDataUrl, autoSettings)
  }

  const applyEnhancements = async () => {
    if (!uploadedImage) return

    setIsEnhancing(true)
    try {
      const enhanced = await enhanceImage(uploadedImage, enhancementSettings)
      setEnhancedImage(enhanced)
    } catch (error) {
      console.error("Enhancement failed:", error)
    } finally {
      setIsEnhancing(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("File upload triggered", event.target.files)
    const file = event.target.files?.[0]
    if (file) {
      console.log("File selected:", file.name, file.type)
      setScanState("uploading")
      const reader = new FileReader()
      reader.onload = async (e) => {
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
          startScanning()
        } else {
          setScanState("extracting")
        }
      }
      reader.onerror = (error) => {
        console.error("File read error:", error)
        setScanState("idle")
      }
      reader.readAsDataURL(file)
    } else {
      console.log("No file selected")
    }
  }

  const startScanning = async () => {
    setScanState("scanning")
    setOcrError(null)
    setOcrProgress(0)
    setDetectedLanguage(null)

    const imageToProcess = enhancedImage || uploadedImage
    if (!imageToProcess) return

    try {
      // Determine OCR languages based on UI language selection
      const currentLang = languages[language as keyof typeof languages]
      const primaryLang = currentLang.ocrCode

      // For better accuracy, we'll try the selected language first, then fallback to multi-language
      const languagesToTry = [
        primaryLang, // Primary language based on UI selection
        `${primaryLang}+eng`, // Primary + English fallback
        "eng+ara+spa", // Multi-language as final fallback
      ]

      let extractedText = ""
      let worker: Tesseract.Worker | null = null

      for (let i = 0; i < languagesToTry.length; i++) {
        const langCode = languagesToTry[i]

        try {
          setDetectedLanguage(langCode)

          // Initialize Tesseract worker with current language
          worker = await Tesseract.createWorker(langCode)

          // Configure for better ingredient label recognition
          await worker.setParameters({
            tessedit_char_whitelist:
              "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,()-/%أبتثجحخدذذرزسشصضطظعغفقكلمنهويىءآإؤئةÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ",
            tessedit_pageseg_mode: "6", // Uniform block of text
          })

          // Perform OCR with progress tracking
          const {
            data: { text, confidence },
          } = await worker.recognize(imageToProcess, {
            logger: (m) => {
              if (m.status === "recognizing text") {
                setOcrProgress(Math.round(m.progress * 100))
              }
            },
          })

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
          }

          if (i === languagesToTry.length - 1) {
            throw langError
          }
        }
      }

      // Clean up the extracted text based on detected language
      const cleanedText = cleanExtractedText(extractedText, currentLang.rtl)

      if (cleanedText.length < 5) {
        setExtractedText("Limited text detected. Please verify and edit the ingredients below, or try a clearer image.")
      } else {
        setExtractedText(cleanedText)
      }

      setScanState("extracting")
    } catch (error) {
      console.error("OCR Error:", error)
      setOcrError("Failed to read image. Please try a clearer photo or enter ingredients manually.")
      setExtractedText("")
      setScanState("extracting")
    }
  }

  const cleanExtractedText = (text: string, isRTL: boolean) => {
    // Basic text cleaning
    let cleaned = text.replace(/\n/g, ", ").replace(/\s+/g, " ").trim()

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
      return {
        ...check,
        status: verdict?.status === "Compliant" ? "pass" : "fail",
        explanation: verdict?.status === "Compliant" ? check.explanation : verdict?.reason || check.failReason,
      };
    });

    setCurrentResult(results);
    setScanState("complete");

    // Add to scan history
    const newScan: ScanResult = {
      id: Date.now().toString(),
      timestamp: new Date(),
      productName: "Product Analysis",
      checks: results,
    };

    const updatedHistory = [newScan, ...scanHistory].slice(0, 5);
    saveScanHistory(updatedHistory);
  } catch (error) {
    console.error("GPT API Error:", error);
    setScanState("idle");
  }
};

  const shareResults = async () => {
    if (!currentResult) return

    const passCount = currentResult.filter((c) => c.status === "pass").length
    const summary = `Is It Clean? Results: ${passCount}/4 dietary standards met ✅`

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Is It Clean? Scan Results",
          text: summary,
          url: typeof window !== 'undefined' ? window.location.href : '',

        })
      } catch (err) {
        // Fallback to clipboard
        navigator.clipboard.writeText(summary)
      }
    } else {
      navigator.clipboard.writeText(summary)
    }
  }

  const clearHistory = () => {
    localStorage.removeItem("isItClean_scanHistory")
    setScanHistory([])
  }

  const resetScan = () => {
    setScanState("idle")
    setUploadedImage(null)
    setExtractedText("")
    setCurrentResult(null)
    setOcrProgress(0)
    setOcrError(null)
    setEnhancedImage(null)
    setIsEnhancing(false)
    setShowImageEnhancement(false)
    setDetectedCorners(null)
    setManualCorners(null)
    setShowPerspectiveControls(false)
  }

  const highlightProblemIngredients = (text: string): React.ReactNode => {
    if (problemIngredients.length === 0) return text

    let highlightedText = text
    problemIngredients.forEach((ingredient) => {
      const regex = new RegExp(`(${ingredient})`, "gi")
      highlightedText = highlightedText.replace(regex, `<mark class="bg-red-200 text-red-800 px-1 rounded">$1</mark>`)
    })

    return <div dangerouslySetInnerHTML={{ __html: highlightedText }} />
  }

  const ConfidenceMeter = ({ level }: { level: "high" | "medium" | "low" }) => {
    const config = {
      high: { color: "bg-green-500", text: "High Confidence", icon: "🔵" },
      medium: { color: "bg-yellow-500", text: "Medium Confidence", icon: "🟡" },
      low: { color: "bg-red-500", text: "Low Confidence", icon: "🔴" },
    }

    const current = config[level]

    return (
      <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
        <div className={`w-3 h-3 rounded-full ${current.color}`} />
        <span className="text-sm font-medium">
          {current.icon} {current.text}
        </span>
      </div>
    )
  }

  const handleChatSubmit = () => {
    if (!chatInput.trim()) return

    const newMessages = [
      ...chatMessages,
      { role: "user" as const, content: chatInput },
      {
        role: "assistant" as const,
        content:
          "Gelatin is typically derived from animal collagen, often from pork or beef bones and skin. This makes it non-halal, non-kosher, and non-vegan. Look for products with 'plant-based gelatin' or 'agar' as alternatives.",
      },
    ]

    setChatMessages(newMessages)
    setChatInput("")
  }

  // Replace the entire return statement with this phone frame wrapper:
  if (!isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-8">
        <div className="flex flex-col items-center space-y-8 max-w-6xl">
          {/* Phone Frame */}
          <div className="relative">
            <div className="w-[375px] h-[812px] bg-black rounded-[3rem] p-2 shadow-2xl">
              <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
                {/* Phone Notch */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-10"></div>

                {/* App Content */}
                <div className="h-full overflow-y-auto">
                  <div className={`min-h-full ${darkMode ? "dark bg-gray-900" : "bg-white"}`}>
                    <div className="max-w-md mx-auto p-4 space-y-6">
                      {/* Header */}
                      <header className="flex items-center justify-between pt-6">
                        <div className="flex-1" />
                        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">Is It Clean?</h1>
                        <div className="flex-1 flex justify-end">
                          <Select value={language} onValueChange={setLanguage}>
                            <SelectTrigger className="w-12 h-8 border-none">
                              <SelectValue>
                                <Globe className="h-4 w-4" />
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(languages).map(([code, lang]) => (
                                <SelectItem key={code} value={code}>
                                  {lang.flag} {lang.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </header>

                      {/* Dietary Preferences Selection */}
                      <Card>
                        <CardContent className="p-4 space-y-4">
                          <h3 className="font-semibold text-gray-900 dark:text-white">Select Dietary Preferences</h3>
                          <div className="grid grid-cols-2 gap-3">
                            {dietaryChecks.map((check) => (
                              <div
                                key={check.id}
                                className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                  check.enabled
                                    ? "border-green-500 bg-green-50"
                                    : "border-gray-200 hover:border-gray-300"
                                }`}
                                onClick={() => toggleDietaryCheck(check.id)}
                              >
                                <div className="flex items-center space-x-2">
                                  <Checkbox checked={check.enabled} readOnly />
                                  <div className="text-lg">{check.icon}</div>
                                  <span className="font-medium text-sm">{check.name}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Demo Upload Section */}
                      <Card className="border-2 border-dashed border-green-200">
                        <CardContent className="p-8 text-center space-y-4">
                          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                            <Camera className="h-8 w-8 text-green-600" />
                          </div>
                          <div>
                            <Button className="bg-green-600 hover:bg-green-700 text-white" size="lg" disabled>
                              <Upload className="mr-2 h-5 w-5" />
                              Scan Product Label
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500 max-w-xs mx-auto">
                            Advanced OCR technology processes images locally on your device
                          </p>
                        </CardContent>
                      </Card>

                      {/* Demo Results */}
                      <Card>
                        <CardContent className="p-4 space-y-4">
                          <h3 className="font-semibold text-gray-900 dark:text-white">Analysis Results</h3>
                          <div className="grid grid-cols-2 gap-3">
                            {dietaryChecks.map((check, index) => (
                              <Card
                                key={check.id}
                                className={`border-2 ${
                                  check.enabled
                                    ? index < 2
                                      ? "border-green-200 bg-green-50"
                                      : "border-red-200 bg-red-50"
                                    : "border-gray-200 bg-gray-50 opacity-50"
                                }`}
                              >
                                <CardContent className="p-3 text-center space-y-2">
                                  <div className="text-2xl">{check.icon}</div>
                                  <div className="flex items-center justify-center space-x-1">
                                    {check.enabled ? (
                                      index < 2 ? (
                                        <Check className="h-4 w-4 text-green-600" />
                                      ) : (
                                        <X className="h-4 w-4 text-red-600" />
                                      )
                                    ) : (
                                      <AlertCircle className="h-4 w-4 text-gray-400" />
                                    )}
                                    <span className="font-medium text-sm">{check.name}</span>
                                  </div>
                                  <p className="text-xs text-gray-600">
                                    {check.enabled
                                      ? index < 2
                                        ? check.explanation
                                        : check.failReason
                                      : "Not selected"}
                                  </p>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Instructions */}
          <div className="max-w-4xl text-center space-y-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-slate-800">Optimized for Mobile Experience</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Is It Clean? leverages advanced camera technology and real-time processing for instant ingredient
                analysis. Access the full experience on your mobile device.
              </p>
            </div>

            {/* QR Code */}
            <div className="bg-white p-8 rounded-2xl shadow-lg inline-block">
              <div className="w-48 h-48 bg-slate-100 rounded-xl flex items-center justify-center mb-4">
                <div className="text-center">
                  <div className="w-32 h-32 bg-black mx-auto mb-3 rounded-lg flex items-center justify-center">
                    <div className="grid grid-cols-8 gap-1">
                      {Array.from({ length: 64 }, (_, i) => (
                        <div key={i} className={`w-1 h-1 ${Math.random() > 0.5 ? "bg-white" : "bg-black"}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 font-medium">QR Code</p>
                </div>
              </div>
              <p className="text-base font-semibold text-slate-800">Scan with your mobile camera</p>
              <p className="text-sm text-slate-500 mt-1">Opens directly in your browser</p>
            </div>

            {/* Feature Grid */}
            <div className="grid md:grid-cols-2 gap-6 mt-8">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-4 text-lg">Mobile Features</h3>
                <div className="space-y-3 text-left">
                  <div className="flex items-center space-x-3">
                    <Camera className="h-5 w-5 text-green-600" />
                    <span className="text-slate-600">Real-time camera scanning</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Globe className="h-5 w-5 text-blue-600" />
                    <span className="text-slate-600">Multi-language OCR support</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-slate-600">Instant dietary verification</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Share2 className="h-5 w-5 text-purple-600" />
                    <span className="text-slate-600">Native sharing capabilities</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-4 text-lg">Alternative Access</h3>
                <div className="space-y-3 text-left">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-slate-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-slate-600 text-sm">
                        Copy URL: <code className="bg-slate-100 px-2 py-1 rounded text-xs">{window.location.href}</code>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-slate-400 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-slate-600 text-sm">Email the link to yourself</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-slate-400 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-slate-600 text-sm">Add to home screen for app-like experience</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Keep the original mobile return statement for mobile devices
  return (
    <div className={`min-h-screen ${darkMode ? "dark bg-gray-900" : "bg-white"}`}>
      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex-1" />
          <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">Is It Clean?</h1>
          <div className="flex-1 flex justify-end">
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-12 h-8 border-none">
                <SelectValue>
                  <Globe className="h-4 w-4" />
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(languages).map(([code, lang]) => (
                  <SelectItem key={code} value={code}>
                    {lang.flag} {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </header>

        {/* Dietary Preferences Selection */}
        {scanState === "idle" && !uploadedImage && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Select Dietary Preferences</h3>
              <p className="text-sm text-gray-600">Choose which dietary standards to verify</p>
              <div className="grid grid-cols-2 gap-3">
                {dietaryChecks.map((check) => (
                  <div
                    key={check.id}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      check.enabled ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => toggleDietaryCheck(check.id)}
                  >
                    <div className="flex items-center space-x-2">
                      <Checkbox checked={check.enabled} readOnly />
                      <div className="text-lg">{check.icon}</div>
                      <span className="font-medium text-sm">{check.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Section */}
        {scanState === "idle" && !uploadedImage && (
          <Card className="border-2 border-dashed border-green-200">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <Camera className="h-8 w-8 text-green-600" />
              </div>
              <div>
            <div className="text-center space-y-4">
  <Button
    onClick={() => {
      console.log("Upload button clicked");
      if (fileInputRef.current) {
        console.log("File input is ready, clicking...");
        fileInputRef.current.click();
      } else {
        console.log("File input ref is null.");
      }
    }}
    className="bg-green-600 hover:bg-green-700 text-white"
    size="lg"
    disabled={!dietaryChecks.some((check) => check.enabled)}
  >
    <Upload className="mr-2 h-5 w-5" />
    Scan Product Label
  </Button>

  {/* ✅ File input is now separate and fully functional */}
  <input
    ref={fileInputRef}
    type="file"
    accept="image/*"
    capture="environment"
    onChange={handleFileUpload}
    className="hidden"
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
              </div>

              {scanState !== "scanning" && scanState !== "uploading" && (
                <div className="p-4">
                  <Button onClick={resetScan} variant="outline" size="sm" className="w-full">
                    <X className="mr-2 h-4 w-4" />
                    Scan Different Product
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
                      <input
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
                      <input
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
                      <input
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
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Analyzing Ingredients...
                  </>
                ) : (
                  "Analyze Ingredients"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Results Section with Enhanced Features */}
        {currentResult && scanState === "complete" && (
          <div className="space-y-4">
            {/* Confidence Meter */}
            <Card className="animate-fade-in">
              <CardContent className="p-4">
                <ConfidenceMeter level={confidenceLevel} />
              </CardContent>
            </Card>

            {/* Health Rating */}
            <Card className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Health Rating</h4>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${star <= healthRating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                      />
                    ))}
                    <span className="text-sm text-gray-600 ml-2">
                      {healthRating === 5 && "Excellent"}
                      {healthRating === 4 && "Good"}
                      {healthRating === 3 && "Fair"}
                      {healthRating === 2 && "Poor"}
                      {healthRating === 1 && "Very Poor"}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Based on processed additives and artificial ingredients</p>
              </CardContent>
            </Card>

            {/* Dietary Check Results */}
            <Card className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Analysis Results</h3>
                  <Button onClick={shareResults} variant="outline" size="sm">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {currentResult.map((check, index) => (
                    <Card
                      key={check.id}
                      className={`border-2 transition-all duration-500 animate-bounce-in ${
                        !check.enabled
                          ? "border-gray-200 bg-gray-50 opacity-50"
                          : check.status === "pass"
                            ? "border-green-200 bg-green-50"
                            : check.status === "fail"
                              ? "border-red-200 bg-red-50"
                              : "border-gray-200"
                      }`}
                      style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                    >
                      <CardContent className="p-3 text-center space-y-2">
                        <div className="text-2xl">{check.icon}</div>
                        <div className="flex items-center justify-center space-x-1">
                          {!check.enabled ? (
                            <AlertCircle className="h-4 w-4 text-gray-400" />
                          ) : check.status === "pass" ? (
                            <Check className="h-4 w-4 text-green-600 animate-pulse" />
                          ) : check.status === "fail" ? (
                            <X className="h-4 w-4 text-red-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="font-medium text-sm">{check.name}</span>
                        </div>
                        <p className="text-xs text-gray-600">
                          {!check.enabled
                            ? "Not selected"
                            : check.status === "pass"
                              ? check.explanation
                              : check.failReason}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Smart Suggestions */}
            {suggestions.length > 0 && currentResult.some((c) => c.status === "fail") && (
              <Card className="animate-fade-in" style={{ animationDelay: "0.4s" }}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    <h4 className="font-semibold text-gray-900 dark:text-white">Recommended Alternatives</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    This product doesn't meet some selected dietary standards. Consider these alternatives:
                  </p>
                  <div className="space-y-2">
                    {suggestions.map((suggestion, index) => (
                      <div key={index} className="p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                        <p className="text-sm text-blue-800">💡 {suggestion}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Scan History */}
        {scanHistory.length > 0 && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">Recent Scans</h3>
                <Button onClick={clearHistory} variant="outline" size="sm">
                  Clear History
                </Button>
              </div>

              <div className="space-y-2">
                {scanHistory.map((scan) => {
                  const passCount = scan.checks.filter((c) => c.status === "pass").length
                  const totalEnabled = scan.checks.filter((c) => c.enabled).length
                  return (
                    <div
                      key={scan.id}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                    >
                      <div>
                        <p className="font-medium text-sm">{scan.productName}</p>
                        <p className="text-xs text-gray-500">{scan.timestamp.toLocaleDateString()}</p>
                      </div>
                      <div className="text-sm font-medium">
                        {passCount}/{totalEnabled} ✅
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Settings and Help */}
        <div className="flex justify-center space-x-4">
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Dark Mode</span>
                  <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                </div>
                <div className="flex items-center justify-between">
                  <span>Auto-scan after upload</span>
                  <Switch checked={autoScan} onCheckedChange={setAutoScan} />
                </div>
                <div className="flex items-center justify-between">
                  <span>Show comparison by default</span>
                  <Switch checked={showBeforeAfter} onCheckedChange={setShowBeforeAfter} />
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* AI Chatbot */}
          <Dialog open={showChatbot} onOpenChange={setShowChatbot}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <MessageCircle className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>🤖 Dietary Assistant</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="h-64 overflow-y-auto space-y-2 p-2 bg-gray-50 rounded">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-gray-500 text-sm">
                      <p>👋 Hi! I can help explain dietary restrictions and ingredients.</p>
                      <p className="mt-2">Try asking:</p>
                      <ul className="text-xs mt-1 space-y-1">
                        <li>"Why isn't gelatin halal?"</li>
                        <li>"What makes something kosher?"</li>
                        <li>"Is this ingredient vegan?"</li>
                      </ul>
                    </div>
                  ) : (
                    chatMessages.map((message, index) => (
                      <div
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
                  <input
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

          <Dialog open={showFAQ} onOpenChange={setShowFAQ}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Info className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dietary Standards</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold">Halal</h4>
                  <p className="text-gray-600">Food permissible according to Islamic dietary laws</p>
                </div>
                <div>
                  <h4 className="font-semibold">Vegan</h4>
                  <p className="text-gray-600">Contains no animal products or by-products</p>
                </div>
                <div>
                  <h4 className="font-semibold">Kosher</h4>
                  <p className="text-gray-600">Complies with Jewish dietary requirements</p>
                </div>
                <div>
                  <h4 className="font-semibold">Organic</h4>
                  <p className="text-gray-600">Produced without synthetic pesticides, fertilizers, or GMOs</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}

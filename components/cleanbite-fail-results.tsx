"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, Copy, Share2, RotateCcw, Edit, History, AlertTriangle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface FlaggedIngredient {
  name: string
  level: "fail" | "caution" | "pass"
  reason?: string
}

interface FailResultsProps {
  dietaryPreference: string
  reasons: string[]
  flaggedIngredients: FlaggedIngredient[]
  confidence: "high" | "medium" | "low"
  onScanAnother: () => void
  onEditIngredients: () => void
  onShare?: () => void
  onShowHistory?: () => void
}

export default function CleanBiteFailResults({
  dietaryPreference,
  reasons,
  flaggedIngredients,
  confidence,
  onScanAnother,
  onEditIngredients,
  onShare,
  onShowHistory,
}: FailResultsProps) {
  const [copiedReasons, setCopiedReasons] = useState(false)

  const handleCopyReasons = async () => {
    try {
      await navigator.clipboard.writeText(reasons.join("\n"))
      setCopiedReasons(true)
      toast({
        title: "Copied!",
        description: "Reasons copied to clipboard",
      })
      setTimeout(() => setCopiedReasons(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const confidenceConfig = {
    high: { color: "bg-[#E74C3C]", text: "High Confidence", width: "w-full" },
    medium: { color: "bg-yellow-500", text: "Medium Confidence", width: "w-3/4" },
    low: { color: "bg-orange-500", text: "Low Confidence", width: "w-1/2" },
  }

  const currentConfidence = confidenceConfig[confidence]

  const getBadgeStyle = (level: string) => {
    switch (level) {
      case "fail":
        return "bg-[#E74C3C] text-white"
      case "caution":
        return "bg-yellow-500 text-white"
      default:
        return "bg-[#2b583a] text-white"
    }
  }

  const getBadgeIcon = (level: string) => {
    switch (level) {
      case "fail":
        return "❌"
      case "caution":
        return "⚠️"
      default:
        return "✅"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#E74C3C] text-white p-4 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-center">
          <img
            src="https://storage.googleapis.com/msgsndr/mXs7sMoRhQI3BHZ8olaS/media/688e95df4f59c8177261ef8e.svg"
            alt="CleanBite Logo"
            className="h-6 w-auto filter brightness-0 invert"
          />
        </div>
      </header>

      <div className="max-w-md mx-auto p-6 space-y-6">
        {/* Main Result */}
        <Card className="shadow-lg border-0 rounded-2xl bg-white">
          <CardContent className="p-8 text-center space-y-4">
            <div className="animate-bounce-in">
              <div className="w-20 h-20 bg-[#E74C3C] rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="h-10 w-10 text-white" strokeWidth={3} />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-800 font-sans">Not suitable for your preference</h2>
              <p className="text-lg text-[#E74C3C] font-medium capitalize">
                ❌ Not {dietaryPreference.replace("-", " ")} Compliant
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Reasons Box */}
        <Card className="shadow-lg border-0 rounded-2xl">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 font-sans flex items-center">
                <AlertTriangle className="h-5 w-5 text-[#E74C3C] mr-2" />
                Why It Failed
              </h3>
              <Button
                onClick={handleCopyReasons}
                variant="outline"
                size="sm"
                className="rounded-xl border-[#E74C3C] text-[#E74C3C] hover:bg-[#E74C3C] hover:text-white bg-transparent"
              >
                <Copy className="h-4 w-4 mr-1" />
                {copiedReasons ? "Copied!" : "Copy"}
              </Button>
            </div>

            <div className="max-h-40 overflow-y-auto bg-red-50 rounded-xl p-4 space-y-2">
              {reasons.map((reason, index) => (
                <div key={index} className="flex items-start space-x-2 text-sm">
                  <span className="text-[#E74C3C] font-bold">•</span>
                  <span className="text-gray-700 leading-relaxed">{reason}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Flagged Ingredients */}
        {flaggedIngredients.length > 0 && (
          <Card className="shadow-lg border-0 rounded-2xl">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 font-sans">Ingredient Analysis</h3>

              <div className="flex flex-wrap gap-2">
                <TooltipProvider>
                  {flaggedIngredients.map((ingredient, index) => (
                    <Tooltip key={index}>
                      <TooltipTrigger>
                        <Badge
                          className={`${getBadgeStyle(ingredient.level)} rounded-full px-3 py-1 text-xs font-medium cursor-help animate-fade-in`}
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          {getBadgeIcon(ingredient.level)} {ingredient.name}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs max-w-48">
                          {ingredient.reason || `${ingredient.name} - ${ingredient.level} level concern`}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </TooltipProvider>
              </div>

              <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                <p>
                  <strong>Legend:</strong>
                </p>
                <p>
                  ❌ <span className="text-[#E74C3C]">Fail</span> - Violates dietary restriction
                </p>
                <p>
                  ⚠️ <span className="text-yellow-600">Caution</span> - May contain traces or unclear
                </p>
                <p>
                  ✅ <span className="text-[#2b583a]">Pass</span> - Compliant ingredient
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Confidence Meter */}
        <Card className="shadow-lg border-0 rounded-2xl">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Analysis Confidence</span>
                <span className="text-sm font-semibold text-gray-800">{currentConfidence.text}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`${currentConfidence.color} h-2 rounded-full transition-all duration-1000 ${currentConfidence.width}`}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={onScanAnother}
            className="w-full h-14 text-lg font-semibold rounded-2xl bg-[#2b583a] hover:bg-[#1e3f2a] transition-all duration-200 shadow-lg"
          >
            <RotateCcw className="mr-3 h-5 w-5" />
            Scan Another Item
          </Button>

          <div className="flex space-x-3">
            <Button
              onClick={onEditIngredients}
              variant="outline"
              className="flex-1 h-12 rounded-xl border-2 border-gray-300 text-gray-700 hover:border-gray-400 bg-transparent"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Ingredients
            </Button>

            {onShare && (
              <Button
                onClick={onShare}
                variant="outline"
                className="flex-1 h-12 rounded-xl border-2 border-[#E74C3C] text-[#E74C3C] hover:bg-[#E74C3C] hover:text-white bg-transparent"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share Result
              </Button>
            )}
          </div>

          {onShowHistory && (
            <Button onClick={onShowHistory} variant="ghost" className="w-full text-[#2b583a] font-medium">
              <History className="mr-2 h-4 w-4" />
              View Recent Scans
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

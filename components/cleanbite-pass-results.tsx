"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Copy, Share2, RotateCcw, Edit } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface PassResultsProps {
  dietaryPreference: string
  ingredients: string[]
  approvedIngredients: string[]
  confidence: "high" | "medium" | "low"
  onScanAnother: () => void
  onEditIngredients: () => void
  onShare?: () => void
}

export default function CleanBitePassResults({
  dietaryPreference,
  ingredients,
  approvedIngredients,
  confidence,
  onScanAnother,
  onEditIngredients,
  onShare,
}: PassResultsProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyIngredients = async () => {
    try {
      await navigator.clipboard.writeText(ingredients.join(", "))
      setCopied(true)
      toast({
        title: "Copied!",
        description: "Ingredients copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const confidenceConfig = {
    high: { color: "bg-[#2b583a]", text: "High Confidence", width: "w-full" },
    medium: { color: "bg-yellow-500", text: "Medium Confidence", width: "w-3/4" },
    low: { color: "bg-orange-500", text: "Low Confidence", width: "w-1/2" },
  }

  const currentConfidence = confidenceConfig[confidence]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#2b583a] text-white p-4 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-center">
          <img
            src="https://storage.googleapis.com/msgsndr/mXs7sMoRhQI3BHZ8olaS/media/688e95df4f59c8177261ef8e.svg"
            alt="CleanBite Logo"
            className="h-6 w-auto"
          />
        </div>
      </header>

      <div className="max-w-md mx-auto p-6 space-y-6">
        {/* Main Result */}
        <Card className="shadow-lg border-0 rounded-2xl bg-white">
          <CardContent className="p-8 text-center space-y-4">
            <div className="animate-bounce-in">
              <div className="w-20 h-20 bg-[#2b583a] rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-10 w-10 text-white" strokeWidth={3} />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-800 font-sans">This product meets your dietary needs</h2>
              <p className="text-lg text-[#2b583a] font-medium capitalize">
                ✅ {dietaryPreference.replace("-", " ")} Compliant
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Ingredient Details */}
        <Card className="shadow-lg border-0 rounded-2xl">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 font-sans">Ingredient Analysis</h3>
              <Button
                onClick={handleCopyIngredients}
                variant="outline"
                size="sm"
                className="rounded-xl border-[#2b583a] text-[#2b583a] hover:bg-[#2b583a] hover:text-white bg-transparent"
              >
                <Copy className="h-4 w-4 mr-1" />
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>

            <div className="max-h-40 overflow-y-auto bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed">
              {ingredients.join(", ")}
            </div>

            {/* Approved Ingredient Chips */}
            {approvedIngredients.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Key Approved Ingredients:</p>
                <div className="flex flex-wrap gap-2">
                  {approvedIngredients.map((ingredient, index) => (
                    <Badge
                      key={index}
                      className="bg-[#2b583a] text-white rounded-full px-3 py-1 text-xs font-medium animate-fade-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      ✓ {ingredient}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

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
                className="flex-1 h-12 rounded-xl border-2 border-[#2b583a] text-[#2b583a] hover:bg-[#2b583a] hover:text-white bg-transparent"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share Result
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

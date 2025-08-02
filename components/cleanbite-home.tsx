"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown } from "lucide-react"

interface CleanBiteHomeProps {
  onScanStart: (preference: string, customRestriction?: string) => void
  onShowHistory: () => void
  language: string
  onLanguageChange: (lang: string) => void
}

const dietaryOptions = [
  { value: "halal", label: "Halal" },
  { value: "kosher", label: "Kosher" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "gluten-free", label: "Gluten-Free" },
  { value: "dairy-free", label: "Dairy-Free" },
  { value: "other", label: "Other" },
]

export default function CleanBiteHome({ onScanStart, onShowHistory, language, onLanguageChange }: CleanBiteHomeProps) {
  const [selectedPreference, setSelectedPreference] = useState<string>("halal")
  const [customRestriction, setCustomRestriction] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)

  const handleScanClick = () => {
    if (selectedPreference) {
      onScanStart(selectedPreference, selectedPreference === "other" ? customRestriction : undefined)
    }
  }

  const handleOptionSelect = (value: string) => {
    setSelectedPreference(value)
    setShowDropdown(false)
  }

  const selectedOption = dietaryOptions.find((opt) => opt.value === selectedPreference)

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-[#2b583a] text-white py-6 px-6">
        <div className="max-w-md mx-auto flex items-center justify-center">
          <img
            src="https://storage.googleapis.com/msgsndr/mXs7sMoRhQI3BHZ8olaS/media/688e95df4f59c8177261ef8e.svg"
            alt="CleanBite Logo"
            className="h-8 w-auto"
          />
        </div>
      </header>

      <div className="max-w-md mx-auto px-6 pt-12 pb-8 space-y-8">
        {/* Main Question */}
        <div className="text-center">
          <h2 className="text-4xl font-bold text-black leading-tight">
            What are your
            <br />
            dietary preferences?
          </h2>
        </div>

        {/* Dropdown Selector */}
        <div className="space-y-4">
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full h-14 px-4 border-2 border-[#2b583a] rounded-lg bg-white flex items-center justify-between text-lg font-medium text-black"
            >
              <span>{selectedOption?.label}</span>
              <ChevronDown className="h-5 w-5 text-gray-600" />
            </button>

            {/* Dropdown Options */}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                {dietaryOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleOptionSelect(option.value)}
                    className={`w-full px-4 py-4 text-left text-lg font-medium border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
                      selectedPreference === option.value ? "bg-[#2b583a] text-white hover:bg-[#2b583a]" : "text-black"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Options List (Always Visible) */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {dietaryOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedPreference(option.value)}
                className={`w-full px-4 py-4 text-left text-lg font-medium border-b border-gray-100 last:border-b-0 transition-colors ${
                  selectedPreference === option.value ? "bg-[#2b583a] text-white" : "text-black hover:bg-gray-50"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Custom Restriction Input */}
          {selectedPreference === "other" && (
            <div className="animate-fade-in">
              <Input
                placeholder="Enter custom restriction"
                value={customRestriction}
                onChange={(e) => setCustomRestriction(e.target.value)}
                className="h-14 text-lg rounded-lg border-2 border-gray-300 focus:border-[#2b583a] placeholder:text-gray-400"
              />
            </div>
          )}
        </div>

        {/* Scan Button */}
        <div className="pt-4">
          <Button
            onClick={handleScanClick}
            className="w-full h-16 text-xl font-semibold rounded-2xl bg-[#2b583a] hover:bg-[#23442c] text-white transition-all duration-200 shadow-lg"
          >
            Scan Now
          </Button>
        </div>
      </div>
    </div>
  )
}

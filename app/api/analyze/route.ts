import { type NextRequest, NextResponse } from "next/server"
import Tesseract from "tesseract.js"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    const { image, preference, customRestriction } = await request.json()

    if (!image || !preference) {
      return NextResponse.json({ error: "Missing required fields: image and preference" }, { status: 400 })
    }

    // Convert base64 to buffer for OCR processing
    const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, "")
    const buffer = Buffer.from(base64Data, "base64")

    // Step 1: Extract text from image using Tesseract OCR
    console.log("Starting OCR processing...")
    const worker = await Tesseract.createWorker("eng")

    const {
      data: { text },
    } = await worker.recognize(buffer)

    await worker.terminate()
    console.log("OCR completed. Extracted text:", text.substring(0, 200) + "...")

    // Step 2: Parse ingredients from extracted text
    const ingredients = parseIngredients(text)
    console.log("Parsed ingredients:", ingredients)

    if (ingredients.length === 0) {
      return NextResponse.json(
        {
          error: "No ingredients found in the image. Please ensure the ingredient list is clearly visible.",
        },
        { status: 400 },
      )
    }

    // Step 3: AI-powered dietary compliance analysis
    console.log("Starting AI analysis...")
    const analysisResult = await analyzeDietaryComplianceWithAI(ingredients, preference, customRestriction)
    console.log("AI analysis completed:", analysisResult)

    return NextResponse.json({
      ingredients,
      ...analysisResult,
    })
  } catch (error) {
    console.error("Analysis API error:", error)
    return NextResponse.json(
      {
        error: "Internal server error during analysis. Please try again.",
      },
      { status: 500 },
    )
  }
}

function parseIngredients(text: string): string[] {
  // Clean and normalize the text
  const cleanText = text.replace(/\n/g, " ").replace(/\s+/g, " ").trim()

  // Look for ingredient list patterns
  const ingredientPatterns = [
    /ingredients?:?\s*(.+?)(?:\.|nutritional|nutrition|allergen|contains|may contain|$)/i,
    /ingrédients?:?\s*(.+?)(?:\.|nutritional|nutrition|allergen|contains|may contain|$)/i,
    /مكونات:?\s*(.+?)(?:\.|معلومات غذائية|قد يحتوي|$)/i,
  ]

  let ingredientText = ""
  for (const pattern of ingredientPatterns) {
    const match = cleanText.match(pattern)
    if (match && match[1]) {
      ingredientText = match[1]
      break
    }
  }

  // If no pattern found, use the entire text
  if (!ingredientText) {
    ingredientText = cleanText
  }

  // Split ingredients by common separators
  const ingredients = ingredientText
    .split(/[,;،؛]/)
    .map((ingredient) => ingredient.trim())
    .filter((ingredient) => {
      // Filter out empty strings and common non-ingredients
      return (
        ingredient.length > 1 &&
        !ingredient.match(/^\d+%?$/) &&
        !ingredient.match(/^[()[\]]+$/) &&
        ingredient.length < 100 // Avoid parsing entire sentences as ingredients
      )
    })
    .slice(0, 50) // Limit to reasonable number of ingredients

  return ingredients
}

async function analyzeDietaryComplianceWithAI(ingredients: string[], preference: string, customRestriction?: string) {
  try {
    const dietaryRules = {
      halal: "Halal dietary laws prohibit pork, alcohol, and non-halal meat. Gelatin must be from halal sources.",
      kosher: "Kosher dietary laws prohibit pork, shellfish, mixing meat with dairy, and non-kosher meat.",
      vegan:
        "Vegan diet excludes all animal products including meat, dairy, eggs, honey, and animal-derived ingredients.",
      vegetarian:
        "Vegetarian diet excludes meat, poultry, fish, and meat-derived ingredients but allows dairy and eggs.",
      "gluten-free": "Gluten-free diet excludes wheat, barley, rye, malt, and any gluten-containing ingredients.",
      "dairy-free": "Dairy-free diet excludes milk, butter, cheese, whey, casein, lactose, and all dairy derivatives.",
    }

    const rules =
      preference === "other" && customRestriction
        ? `Custom restriction: avoid ${customRestriction}`
        : dietaryRules[preference as keyof typeof dietaryRules] || `${preference} dietary restrictions`

    const prompt = `
You are a dietary compliance expert. Analyze the following ingredients for ${preference} dietary compliance.

DIETARY RULES: ${rules}

INGREDIENTS TO ANALYZE: ${ingredients.join(", ")}

Please provide a JSON response with the following structure:
{
  "result": "pass" or "fail",
  "confidence": "high", "medium", or "low",
  "reasons": ["reason 1", "reason 2"],
  "flaggedIngredients": [
    {
      "name": "ingredient name",
      "level": "fail", "caution", or "pass",
      "reason": "explanation"
    }
  ]
}

Rules for analysis:
- "fail" means the ingredient clearly violates the dietary restriction
- "caution" means the ingredient might be problematic or unclear
- "pass" means the ingredient is compliant
- Be conservative - if unsure, mark as "caution"
- Provide clear, specific reasons
- Consider ingredient derivatives and processing aids
`

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.1, // Low temperature for consistent results
    })

    // Parse the AI response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Invalid AI response format")
    }

    const analysis = JSON.parse(jsonMatch[0])

    // Validate the response structure
    if (!analysis.result || !analysis.confidence || !analysis.reasons) {
      throw new Error("Incomplete AI analysis response")
    }

    return {
      result: analysis.result,
      confidence: analysis.confidence,
      reasons: analysis.reasons,
      flaggedIngredients: analysis.flaggedIngredients || [],
    }
  } catch (error) {
    console.error("AI analysis error:", error)

    // Fallback to rule-based analysis if AI fails
    console.log("Falling back to rule-based analysis...")
    return fallbackAnalysis(ingredients, preference, customRestriction)
  }
}

function fallbackAnalysis(ingredients: string[], preference: string, customRestriction?: string) {
  const problematicIngredients: { [key: string]: string[] } = {
    halal: ["pork", "alcohol", "wine", "beer", "gelatin", "lard", "bacon", "ham", "pepperoni"],
    kosher: ["pork", "shellfish", "crab", "lobster", "shrimp", "milk with meat", "gelatin", "lard"],
    vegan: ["milk", "eggs", "honey", "gelatin", "whey", "casein", "butter", "cheese", "meat", "chicken", "beef"],
    vegetarian: ["meat", "fish", "chicken", "beef", "pork", "poultry", "gelatin", "lard"],
    "gluten-free": ["wheat", "barley", "rye", "malt", "gluten", "flour", "bread"],
    "dairy-free": ["milk", "butter", "cheese", "whey", "casein", "lactose", "cream", "yogurt"],
  }

  const restrictions = problematicIngredients[preference] || []
  const found: string[] = []

  // Check each ingredient against restrictions
  ingredients.forEach((ingredient) => {
    const lowerIngredient = ingredient.toLowerCase()
    restrictions.forEach((restriction) => {
      if (lowerIngredient.includes(restriction.toLowerCase())) {
        found.push(ingredient)
      }
    })
  })

  // Check custom restriction
  if (customRestriction && preference === "other") {
    ingredients.forEach((ingredient) => {
      if (ingredient.toLowerCase().includes(customRestriction.toLowerCase())) {
        found.push(ingredient)
      }
    })
  }

  if (found.length > 0) {
    return {
      result: "fail" as const,
      confidence: "medium" as const,
      reasons: [
        `Contains ${found[0]} which violates ${preference} dietary restrictions`,
        found.length > 1 ? "Multiple restricted ingredients found" : "Please verify ingredient sources",
      ],
      flaggedIngredients: found.map((ing) => ({
        name: ing,
        level: "fail" as const,
        reason: `${ing} is not suitable for ${preference} diet`,
      })),
    }
  }

  return {
    result: "pass" as const,
    confidence: "medium" as const,
    reasons: [`No obvious violations of ${preference} dietary restrictions found`],
    flaggedIngredients: [],
  }
}

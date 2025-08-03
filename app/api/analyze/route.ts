import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    const { image, preference, customRestriction } = await request.json()

    if (!image || !preference) {
      return NextResponse.json({ error: "Missing required fields: image and preference" }, { status: 400 })
    }

    console.log("Starting analysis for preference:", preference)

    // Step 1: Extract text from image using OpenAI Vision
    console.log("Starting OCR with OpenAI Vision...")
    const extractedText = await extractTextWithOpenAIVision(image)
    console.log("OCR completed. Raw text length:", extractedText.length)
    console.log("OCR text preview:", extractedText.substring(0, 300) + "...")

    // Step 2: Parse ingredients from extracted text
    const ingredients = parseIngredients(extractedText)
    console.log("Parsed ingredients:", ingredients)

    if (ingredients.length === 0) {
      console.log("No ingredients found, trying fallback parsing...")
      // Fallback: try to extract any text that might be ingredients
      const fallbackIngredients = extractedText
        .split(/[,;\n]/)
        .map((item) => item.trim())
        .filter((item) => item.length > 2 && item.length < 50)
        .slice(0, 20)

      if (fallbackIngredients.length === 0) {
        return NextResponse.json(
          {
            error:
              "No ingredients could be extracted from the image. Please ensure the ingredient list is clearly visible and try again.",
            extractedText: extractedText.substring(0, 200), // Return some text for debugging
          },
          { status: 400 },
        )
      }

      ingredients.push(...fallbackIngredients)
    }

    // Step 3: AI-powered dietary compliance analysis
    console.log("Starting AI analysis with", ingredients.length, "ingredients...")
    const analysisResult = await analyzeDietaryComplianceWithAI(ingredients, preference, customRestriction)
    console.log("AI analysis completed:", analysisResult.result)

    return NextResponse.json({
      ingredients,
      extractedText: extractedText.substring(0, 500), // Include for debugging
      ...analysisResult,
    })
  } catch (error) {
    console.error("Analysis API error:", error)
    return NextResponse.json(
      {
        error: "Internal server error during analysis. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function extractTextWithOpenAIVision(base64Image: string): Promise<string> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured")
    }

    console.log("Calling OpenAI Vision API...")

    const { text } = await generateText({
      model: openai("gpt-4o"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Please extract ALL text from this food label image. Focus especially on:
              1. Ingredient lists (usually starts with "Ingredients:" or similar)
              2. Nutritional information
              3. Any text that might contain ingredient names
              4. Product names and descriptions
              
              Return the extracted text exactly as it appears, preserving formatting and punctuation. If you see ingredient lists in multiple languages, include all of them.`,
            },
            {
              type: "image",
              image: base64Image,
            },
          ],
        },
      ],
      temperature: 0.1,
    })

    console.log("OpenAI Vision extraction successful")
    return text
  } catch (error) {
    console.error("OpenAI Vision error:", error)
    throw new Error("Failed to extract text from image using OCR service")
  }
}

function parseIngredients(text: string): string[] {
  console.log("Parsing ingredients from text...")

  // Clean and normalize the text
  const cleanText = text.replace(/\n/g, " ").replace(/\s+/g, " ").trim()

  // Multiple patterns to find ingredient lists
  const ingredientPatterns = [
    // English patterns
    /ingredients?:?\s*(.+?)(?:\.|nutritional|nutrition|allergen|contains|may contain|net weight|serving|calories|$)/i,
    /ingrédients?:?\s*(.+?)(?:\.|nutritional|nutrition|allergen|contains|may contain|net weight|serving|calories|$)/i,
    // Arabic patterns
    /مكونات:?\s*(.+?)(?:\.|معلومات غذائية|قد يحتوي|الوزن الصافي|$)/i,
    // Spanish patterns
    /ingredientes:?\s*(.+?)(?:\.|información nutricional|puede contener|peso neto|$)/i,
    // German patterns
    /zutaten:?\s*(.+?)(?:\.|nährwerte|kann enthalten|nettogewicht|$)/i,
    // French patterns
    /ingrédients?:?\s*(.+?)(?:\.|valeurs nutritionnelles|peut contenir|poids net|$)/i,
    // Italian patterns
    /ingredienti:?\s*(.+?)(?:\.|valori nutrizionali|può contenere|peso netto|$)/i,
    // Look for lists that start with common ingredients
    /(water|sugar|salt|flour|oil|milk|wheat|corn|rice|soy|egg|butter|cheese|meat|chicken|beef|pork|fish|tomato|onion|garlic|spices|natural flavors|artificial flavors|preservatives|vitamins|minerals|citric acid|sodium|potassium|calcium|iron|vitamin|protein|carbohydrate|fat|fiber).+/i,
  ]

  let ingredientText = ""
  for (const pattern of ingredientPatterns) {
    const match = cleanText.match(pattern)
    if (match && match[1]) {
      ingredientText = match[1]
      console.log("Found ingredients using pattern:", pattern.source.substring(0, 50) + "...")
      break
    }
  }

  // If no pattern found, try to find a list-like structure
  if (!ingredientText) {
    console.log("No pattern matched, looking for list structure...")
    const lines = cleanText.split(/[.\n]/)
    for (const line of lines) {
      if (line.includes(",") && line.length > 20) {
        ingredientText = line
        console.log("Found potential ingredient line:", line.substring(0, 100) + "...")
        break
      }
    }
  }

  // If still nothing, use the entire text as fallback
  if (!ingredientText) {
    console.log("Using entire text as fallback")
    ingredientText = cleanText
  }

  // Split ingredients by common separators
  const ingredients = ingredientText
    .split(/[,;،؛]/)
    .map((ingredient) => {
      // Clean up each ingredient
      return ingredient
        .trim()
        .replace(/^\d+\.?\s*/, "") // Remove leading numbers
        .replace(/$$[^)]*$$/g, "") // Remove parentheses content
        .replace(/\[[^\]]*\]/g, "") // Remove bracket content
        .trim()
    })
    .filter((ingredient) => {
      // Filter out invalid ingredients
      return (
        ingredient.length > 1 &&
        ingredient.length < 100 &&
        !ingredient.match(/^\d+%?$/) &&
        !ingredient.match(/^[()[\]]+$/) &&
        !ingredient.match(/^(and|or|with|contains|may contain|allergen|warning|note|see|www|http|\.com)$/i)
      )
    })
    .slice(0, 50) // Limit to reasonable number

  console.log("Final parsed ingredients count:", ingredients.length)
  return ingredients
}

async function analyzeDietaryComplianceWithAI(ingredients: string[], preference: string, customRestriction?: string) {
  try {
    console.log("Starting AI analysis...")

    if (!process.env.OPENAI_API_KEY) {
      console.log("No OpenAI API key found, using fallback analysis")
      return fallbackAnalysis(ingredients, preference, customRestriction)
    }

    const dietaryRules = {
      halal:
        "Halal dietary laws prohibit pork, alcohol, and non-halal meat. Gelatin must be from halal sources. Enzymes and emulsifiers must be halal.",
      kosher:
        "Kosher dietary laws prohibit pork, shellfish, mixing meat with dairy, and non-kosher meat. Gelatin must be from kosher sources.",
      vegan:
        "Vegan diet excludes all animal products including meat, dairy, eggs, honey, gelatin, and any animal-derived ingredients.",
      vegetarian:
        "Vegetarian diet excludes meat, poultry, fish, and meat-derived ingredients but allows dairy and eggs.",
      "gluten-free":
        "Gluten-free diet excludes wheat, barley, rye, malt, and any gluten-containing ingredients or cross-contaminated products.",
      "dairy-free": "Dairy-free diet excludes milk, butter, cheese, whey, casein, lactose, and all dairy derivatives.",
    }

    const rules =
      preference === "other" && customRestriction
        ? `Custom restriction: avoid ${customRestriction}`
        : dietaryRules[preference as keyof typeof dietaryRules] || `${preference} dietary restrictions`

    const prompt = `You are a dietary compliance expert. Analyze these ingredients for ${preference} dietary compliance.

DIETARY RULES: ${rules}

INGREDIENTS: ${ingredients.join(", ")}

Provide a JSON response with this exact structure:
{
  "result": "pass" or "fail",
  "confidence": "high", "medium", or "low", 
  "reasons": ["specific reason 1", "specific reason 2"],
  "flaggedIngredients": [
    {
      "name": "exact ingredient name from list",
      "level": "fail", "caution", or "pass",
      "reason": "specific explanation why this ingredient is problematic"
    }
  ]
}

Analysis rules:
- "fail" = ingredient clearly violates dietary restriction
- "caution" = ingredient might be problematic or source unclear  
- "pass" = ingredient is compliant
- Be thorough but conservative
- Consider hidden animal products, processing aids, and cross-contamination
- Provide specific, actionable reasons`

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.1,
    })

    console.log("AI response received:", text.substring(0, 200) + "...")

    // Parse the AI response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.log("Invalid AI response format, using fallback")
      return fallbackAnalysis(ingredients, preference, customRestriction)
    }

    const analysis = JSON.parse(jsonMatch[0])

    // Validate the response structure
    if (!analysis.result || !analysis.confidence || !analysis.reasons) {
      console.log("Incomplete AI response, using fallback")
      return fallbackAnalysis(ingredients, preference, customRestriction)
    }

    console.log("AI analysis successful:", analysis.result)
    return {
      result: analysis.result,
      confidence: analysis.confidence,
      reasons: analysis.reasons,
      flaggedIngredients: analysis.flaggedIngredients || [],
    }
  } catch (error) {
    console.error("AI analysis error:", error)
    console.log("Falling back to rule-based analysis...")
    return fallbackAnalysis(ingredients, preference, customRestriction)
  }
}

function fallbackAnalysis(ingredients: string[], preference: string, customRestriction?: string) {
  console.log("Using fallback analysis for", ingredients.length, "ingredients")

  const problematicIngredients: { [key: string]: string[] } = {
    halal: ["pork", "alcohol", "wine", "beer", "gelatin", "lard", "bacon", "ham", "pepperoni", "prosciutto"],
    kosher: ["pork", "shellfish", "crab", "lobster", "shrimp", "clam", "oyster", "mussel", "gelatin", "lard"],
    vegan: [
      "milk",
      "eggs",
      "honey",
      "gelatin",
      "whey",
      "casein",
      "butter",
      "cheese",
      "cream",
      "yogurt",
      "meat",
      "chicken",
      "beef",
      "pork",
      "fish",
      "seafood",
      "shellfish",
      "lard",
    ],
    vegetarian: ["meat", "fish", "chicken", "beef", "pork", "poultry", "gelatin", "lard", "tallow", "suet"],
    "gluten-free": ["wheat", "barley", "rye", "malt", "gluten", "flour", "bread", "pasta", "cereal"],
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

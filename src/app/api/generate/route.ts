import { GoogleGenAI } from "@google/genai";
import { NextRequest } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

function buildPrompt(slideTexts: string[], slideIndex: number): string {
  const text = slideTexts[slideIndex];
  const position = slideIndex + 1;
  const total = slideTexts.length;

  return `You are the senior Art Director for Scuffers, a premium streetwear brand from Madrid.

CRITICAL RULES (never break these):
- Use EXACTLY this photo of the model as the visual base. Keep 100% of their face, hair, expression, pose, clothing, lighting, and background. Do NOT alter the person in any way.
- Create a professional Instagram carousel slide (square 1:1 format).
- Style: minimal luxury streetwear. Color palette: deep black #111, pure white, sand beige. Clean, elegant, high contrast.
- Typography: bold modern sans-serif (like Neue Haas Grotesk or Satoshi). All text in pure white #FFFFFF with subtle shadow for readability.
- This is slide ${position} of ${total} in a carousel.

TEXT TO PLACE ON THIS SLIDE:
"${text}"

Layout guidelines:
- Place text with perfect hierarchy and elegant spacing
- Use generous negative space
- Optional: add subtle premium details like thin white lines or minimal scribble accents
- The result must look like a real production-ready Instagram ad for a luxury streetwear brand

Output: ONE high-quality square image, production ready, no watermarks, no typos.`;
}

export async function POST(req: NextRequest) {
  try {
    const { modelImage, styleImage, slides } = await req.json();

    if (!slides || slides.length === 0) {
      return Response.json(
        { success: false, error: "No slides provided" },
        { status: 400 }
      );
    }

    const generatedImages: string[] = [];

    // Build the reference images array
    const referenceImages: Array<{ inlineData: { data: string; mimeType: string } }> = [];

    // Model photo (required)
    if (modelImage) {
      const base64Data = modelImage.includes(",")
        ? modelImage.split(",")[1]
        : modelImage;
      referenceImages.push({
        inlineData: { data: base64Data, mimeType: "image/jpeg" },
      });
    }

    // Style reference (optional - the PSD screenshot)
    if (styleImage) {
      const base64Data = styleImage.includes(",")
        ? styleImage.split(",")[1]
        : styleImage;
      referenceImages.push({
        inlineData: { data: base64Data, mimeType: "image/jpeg" },
      });
    }

    // Generate each slide individually (Gemini works best this way)
    for (let i = 0; i < slides.length; i++) {
      const prompt = buildPrompt(slides, i);

      // Add style context if style image is provided
      const fullPrompt = styleImage
        ? prompt +
          "\n\nIMPORTANT: The second reference image shows the exact visual style and layout to follow. Match its aesthetic precisely."
        : prompt;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: [
          {
            role: "user",
            parts: [
              { text: fullPrompt },
              ...referenceImages,
            ],
          },
        ],
        config: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      });

      // Extract generated image from response
      const candidate = response.candidates?.[0];
      if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData?.data) {
            generatedImages.push(
              `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`
            );
            break; // Take only the first image per slide
          }
        }
      }
    }

    return Response.json({ success: true, images: generatedImages });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Gemini API error:", message);
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}

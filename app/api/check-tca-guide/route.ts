import { type NextRequest, NextResponse } from "next/server"
import { checkTCAGuide } from "@/lib/tca-scraper" // Importa la función de scraping

export async function POST(request: NextRequest) {
  try {
    const { prefix, suffix } = await request.json()

    // Llama a la función de scraping real
    const result = await checkTCAGuide(prefix, suffix)

    if (result.success) {
      return NextResponse.json({ success: true, data: result.data })
    } else {
      // Si hay un error, devuelve el mensaje de error específico
      return NextResponse.json({ success: false, error: result.error })
    }
  } catch (error) {
    console.error("Error en la API Route /api/check-tca-guide:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor al procesar la solicitud.",
      },
      { status: 500 },
    )
  }
}

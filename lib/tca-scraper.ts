import puppeteer from "puppeteer"

export interface TCAGuideData {
  operacion: string
  docIngreso: string
  responsableManifiesto: string
  estado: string
  numeroTransporte: string
  fechaTransporte: string
  responsableTransporte: string
  bultos: number
  kilos: number
}

export interface TCAScrapingResult {
  success: boolean
  error?: string
  data?: TCAGuideData
  screenshot?: Buffer // Opcional, si quieres guardar capturas
}

export class TCAPortalScraper {
  private browser: puppeteer.Browser | null = null
  private readonly portalUrl = "http://portal.tca.aero/gestion_web/tca-guias-aereas-web/guia.html"

  async init() {
    // Para Vercel u otros entornos serverless, podrías necesitar:
    // const chromium = require('@sparticuz/chromium');
    // this.browser = await puppeteer.launch({
    //   args: chromium.args,
    //   defaultViewport: chromium.defaultViewport,
    //   executablePath: await chromium.executablePath(),
    //   headless: chromium.headless,
    // });

    // Para desarrollo local, usa headless: true para que no abra una ventana de navegador
    this.browser = await puppeteer.launch({
      headless: true, // Cambia a false para ver el navegador en acción (solo local)
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })
  }

  async checkGuide(prefix: string, suffix: string): Promise<TCAScrapingResult> {
    if (!this.browser) {
      await this.init()
    }

    const page = await this.browser!.newPage()
    await page.setViewport({ width: 1280, height: 800 }) // Tamaño de ventana para simular un navegador

    try {
      console.log(`[Scraper] Navegando a ${this.portalUrl}`)
      await page.goto(this.portalUrl, { waitUntil: "networkidle2", timeout: 30000 }) // Espera a que la red esté inactiva

      // Esperar a que los campos de entrada estén disponibles
      await page.waitForSelector('input[name="prefijo"]', { timeout: 10000 })
      await page.waitForSelector('input[name="numero"]', { timeout: 10000 })

      // Ingresar los datos de la guía
      console.log(`[Scraper] Ingresando prefijo: ${prefix}, número: ${suffix}`)
      await page.type('input[name="prefijo"]', prefix)
      await page.type('input[name="numero"]', suffix)

      // Hacer clic en el botón de consulta
      console.log("[Scraper] Haciendo clic en el botón de consulta")
      await page.click('input[type="submit"], button[type="submit"]') // Busca input o button con type submit

      // Esperar un tiempo prudencial o un selector que indique que la página cargó
      // Podrías esperar por un elemento específico que aparece solo si la guía es encontrada
      // o un mensaje de error si no lo es.
      await page.waitForTimeout(3000) // Espera 3 segundos para que la página procese

      // --- Lógica de detección de estado basada en las imágenes ---

      // 1. Detectar "ERROR GUIA NO ENCONTRADA"
      const errorText = await page.evaluate(() => {
        const errorElement = document.querySelector("body") // Busca en todo el body
        return errorElement ? errorElement.textContent?.includes("ERROR GUIA NO ENCONTRADA") : false
      })

      if (errorText) {
        console.log("[Scraper] Guía no encontrada detectada.")
        return {
          success: false,
          error: "GUIA NO ENCONTRADA",
        }
      }

      // 2. Si no hay error, intentar extraer los datos (implica que la guía está "Lista")
      console.log("[Scraper] Intentando extraer datos de la guía...")
      const guideData = await this.extractGuideData(page)

      if (guideData && guideData.operacion) {
        // Verificar si se extrajo algún dato significativo
        console.log("[Scraper] Datos de guía extraídos exitosamente.")
        // Opcional: Tomar screenshot de la página de confirmación
        // const screenshot = await page.screenshot({ type: "png", fullPage: true });
        return {
          success: true,
          data: guideData,
          // screenshot,
        }
      } else {
        // Si no se encontró el error y tampoco se pudieron extraer datos, algo salió mal
        console.log("[Scraper] No se detectó error, pero tampoco se pudieron extraer datos.")
        return {
          success: false,
          error: "No se pudo determinar el estado de la guía o extraer datos.",
        }
      }
    } catch (error: any) {
      console.error(`[Scraper] Error al verificar guía ${prefix}-${suffix}:`, error.message)
      return {
        success: false,
        error: `Error de scraping: ${error.message}`,
      }
    } finally {
      await page.close()
    }
  }

  private async extractGuideData(page: puppeteer.Page): Promise<TCAGuideData> {
    // Extraer datos específicos de la tabla TCA
    const data = await page.evaluate(() => {
      const getText = (selector: string) => {
        const element = document.evaluate(
          `//td[contains(., "${selector}")]/following-sibling::td[1]`,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null,
        ).singleNodeValue as HTMLElement
        return element ? element.textContent?.trim() || "" : ""
      }

      // Usar XPath para mayor robustez si los selectores CSS cambian
      return {
        operacion: getText("Operación:") || "",
        docIngreso: getText("Doc. ing.:") || "",
        responsableManifiesto: getText("Resp. manif.:") || "",
        estado: getText("Estado:") || "",
        numeroTransporte: getText("Número:") || "",
        fechaTransporte: getText("Fecha:") || "",
        responsableTransporte: getText("Responsable:") || "",
        bultos: Number.parseInt(getText("Bultos:")) || 0,
        kilos: Number.parseFloat(getText("Kilos:")) || 0,
      }
    })

    return data
  }

  async close() {
    if (this.browser) {
      await this.browser.close()
      this.browser = null // Resetear para permitir una nueva inicialización si es necesario
    }
  }
}

// Instancia global del scraper para reutilizar el navegador
let scraperInstance: TCAPortalScraper | null = null

export async function checkTCAGuide(prefix: string, suffix: string): Promise<TCAScrapingResult> {
  if (!scraperInstance) {
    scraperInstance = new TCAPortalScraper()
    await scraperInstance.init()
  }
  return scraperInstance.checkGuide(prefix, suffix)
}

// Opcional: Función para cerrar el navegador cuando la aplicación se apaga
process.on("exit", async () => {
  if (scraperInstance) {
    await scraperInstance.close()
  }
})
process.on("SIGINT", async () => {
  if (scraperInstance) {
    await scraperInstance.close()
  }
  process.exit()
})

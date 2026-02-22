import { createWorker } from "tesseract.js"

/**
 * Utility class to manage Tesseract OCR Engine wrapper
 */
export class OCREngine {
  private worker: Tesseract.Worker | null = null;
  private isReady = false;

  async init() {
    if (this.isReady) return;
    try {
      this.worker = await createWorker("eng")
      this.isReady = true;
    } catch (e) {
      console.error("Failed to initialize Tesseract worker", e)
      throw e
    }
  }

  async recognizeImage(imageSource: string | HTMLImageElement | HTMLCanvasElement): Promise<string> {
    if (!this.isReady || !this.worker) {
      await this.init()
    }
    
    if (!this.worker) throw new Error("Worker failed to start")

    try {
      const { data: { text } } = await this.worker.recognize(imageSource)
      return text
    } catch (e) {
      console.error("OCR recognition error", e)
      return ""
    }
  }

  async terminate() {
    if (this.worker) {
      await this.worker.terminate()
      this.worker = null
      this.isReady = false
    }
  }
}

export const ocr = new OCREngine()

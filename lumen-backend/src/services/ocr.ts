/**
 * OCR using Google Cloud Vision API.
 * PRD: >98% accuracy, <2.5s latency.
 */

let visionClient: import('@google-cloud/vision').ImageAnnotatorClient | null = null;

async function getVision(): Promise<import('@google-cloud/vision').ImageAnnotatorClient> {
  if (!visionClient) {
    const { ImageAnnotatorClient } = await import('@google-cloud/vision');
    visionClient = new ImageAnnotatorClient();
  }
  return visionClient;
}

export const ocrService = {
  async extractText(imageBuffer: Buffer): Promise<string> {
    const client = await getVision();
    const [result] = await client.textDetection({ image: { content: imageBuffer.toString('base64') } });
    const annotations = result.textAnnotations;
    if (!annotations?.length) return '';
    // First annotation is full text; rest are per-word/per-line
    return annotations[0].description ?? '';
  },
};

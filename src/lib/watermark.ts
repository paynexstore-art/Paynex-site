// src/lib/watermark.ts
import sharp from 'sharp'

export async function processDocument(params: {
  imageBuffer: Buffer
  gpsLat: number
  gpsLng: number
  supervisorName: string
  orderId: string
}): Promise<Buffer> {
  const { imageBuffer, gpsLat, gpsLng, supervisorName, orderId } = params
  const timestamp = new Date().toLocaleString('ar-EG', {
    timeZone: 'Africa/Cairo',
  })

  // ضغط الصورة
  const compressed = await sharp(imageBuffer)
    .resize({ width: 1200, withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer()

  const metadata = await sharp(compressed).metadata()
  const width = metadata.width || 1200

  const watermarkText =
    `Paynix | ${timestamp} | GPS: ${gpsLat.toFixed(4)},${gpsLng.toFixed(4)} | Order: ${orderId.slice(0,8)}`

  const watermarkSvg = `
    <svg width="${width}" height="50">
      <rect width="${width}" height="50"
        fill="rgba(10,22,40,0.85)" rx="0"/>
      <text x="${width / 2}" y="32"
        font-family="Arial, sans-serif"
        font-size="16"
        fill="#C9A84C"
        text-anchor="middle">
        ${watermarkText}
      </text>
    </svg>
  `

  return await sharp(compressed)
    .composite([{
      input: Buffer.from(watermarkSvg),
      gravity: 'south',
    }])
    .toBuffer()
}

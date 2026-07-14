import { env } from '../../config/env'
import { ValidationError } from '../../lib/errors'

export type FaceAnalyzeMode = 'enroll' | 'verify'

export interface FaceQualityResult {
  score: number
  faceCount: number
  brightness?: number
  blurScore?: number
  poseOk?: boolean
  faceSizeOk?: boolean
  obstruction?: {
    status: 'clear' | 'suspected' | 'blocked'
    reason: string | null
  }
  eyewear?: {
    type: 'none' | 'clear_glasses' | 'dark_glasses' | 'suspected' | 'unknown'
    confidence: number
    eyeVisibilityScore: number
    blocksEyes: boolean
  }
}

export interface FaceAnalyzeResult {
  ok: true
  embedding: number[]
  model: string
  embeddingDim: number
  quality: FaceQualityResult
}

interface FaceAnalyzeReject {
  ok: false
  reason?: string
  code?: string
}

type FaceAnalyzeResponse = FaceAnalyzeResult | FaceAnalyzeReject

export function faceServiceConfigured(): boolean {
  return Boolean(env.FACE_SERVICE_URL)
}

export async function analyzeFaceImage(
  imageBase64: string,
  mode: FaceAnalyzeMode,
): Promise<FaceAnalyzeResult> {
  if (!faceServiceConfigured()) {
    throw new ValidationError(
      'Layanan verifikasi wajah belum dikonfigurasi. Coba lagi setelah server siap.',
    )
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), env.FACE_SERVICE_TIMEOUT_MS)

  try {
    const headers: Record<string, string> = { 'content-type': 'application/json' }
    if (env.FACE_SERVICE_API_KEY) {
      headers['x-internal-api-key'] = env.FACE_SERVICE_API_KEY
    }

    const response = await fetch(`${env.FACE_SERVICE_URL}/v1/face/analyze`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ imageBase64, mode }),
      signal: controller.signal,
    })

    const payload = (await response.json().catch(() => null)) as FaceAnalyzeResponse | null

    if (!response.ok || payload == null) {
      throw new ValidationError('Layanan verifikasi wajah tidak merespons dengan benar.')
    }

    if (!payload.ok) {
      throw new ValidationError(payload.reason ?? 'Wajah tidak dapat diverifikasi.', {
        code: payload.code,
      })
    }

    if (!Array.isArray(payload.embedding) || payload.embedding.length === 0) {
      throw new ValidationError('Embedding wajah tidak valid.')
    }

    if (payload.quality.score < env.FACE_QUALITY_MIN_SCORE) {
      throw new ValidationError('Kualitas foto wajah kurang jelas. Coba lagi di tempat terang.')
    }

    return payload
  } catch (err) {
    if (err instanceof ValidationError) throw err
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ValidationError('Verifikasi wajah terlalu lama. Coba lagi.')
    }
    throw new ValidationError('Layanan verifikasi wajah sedang bermasalah. Coba lagi.')
  } finally {
    clearTimeout(timeout)
  }
}

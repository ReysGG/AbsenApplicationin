export interface FaceMatchMetrics {
  matched: boolean
  similarity: number
  distance: number
  minSimilarity: number
  maxDistance: number
}

function normalized(vector: number[]): number[] {
  if (vector.length === 0 || vector.some((value) => !Number.isFinite(value))) {
    throw new Error('Face embedding is empty or invalid.')
  }

  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0))
  if (norm <= 0) throw new Error('Face embedding has zero magnitude.')
  return vector.map((value) => value / norm)
}

/**
 * Compare two ArcFace embeddings and expose both similarity and distance.
 *
 * This follows face_recognition's useful "show distance" pattern while
 * retaining InsightFace's embedding model. For unit vectors, Euclidean
 * distance and cosine similarity are equivalent:
 * distance = sqrt(2 - 2 * similarity).
 */
export function compareFaceEmbeddings(
  enrolled: number[],
  candidate: number[],
  minSimilarity: number,
): FaceMatchMetrics {
  if (enrolled.length !== candidate.length) {
    throw new Error('Face embedding dimensions do not match.')
  }
  if (!Number.isFinite(minSimilarity) || minSimilarity < -1 || minSimilarity > 1) {
    throw new Error('Face similarity threshold is invalid.')
  }

  const known = normalized(enrolled)
  const live = normalized(candidate)
  let similarity = 0
  let squaredDistance = 0
  for (let index = 0; index < known.length; index++) {
    similarity += known[index] * live[index]
    const delta = known[index] - live[index]
    squaredDistance += delta * delta
  }

  similarity = Math.max(-1, Math.min(1, similarity))
  const distance = Math.sqrt(Math.max(0, squaredDistance))
  const maxDistance = Math.sqrt(Math.max(0, 2 - 2 * minSimilarity))

  return {
    matched: similarity >= minSimilarity,
    similarity,
    distance,
    minSimilarity,
    maxDistance,
  }
}

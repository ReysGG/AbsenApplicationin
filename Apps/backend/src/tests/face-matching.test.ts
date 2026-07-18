import { describe, expect, it } from 'vitest'

import { compareFaceEmbeddings } from '../modules/mobile/face-matching'

describe('compareFaceEmbeddings', () => {
  it('matches identical embeddings with zero distance', () => {
    const result = compareFaceEmbeddings([1, 0, 0], [1, 0, 0], 0.6)

    expect(result.matched).toBe(true)
    expect(result.similarity).toBeCloseTo(1)
    expect(result.distance).toBeCloseTo(0)
  })

  it('normalizes scaled embeddings before comparing them', () => {
    const result = compareFaceEmbeddings([2, 0, 0], [8, 0, 0], 0.6)

    expect(result.matched).toBe(true)
    expect(result.similarity).toBeCloseTo(1)
  })

  it('rejects clearly different embeddings', () => {
    const result = compareFaceEmbeddings([1, 0, 0], [0, 1, 0], 0.6)

    expect(result.matched).toBe(false)
    expect(result.similarity).toBeCloseTo(0)
    expect(result.distance).toBeCloseTo(Math.sqrt(2))
  })

  it('derives an equivalent maximum distance from the similarity threshold', () => {
    const result = compareFaceEmbeddings([1, 0], [1, 0], 0.6)

    expect(result.maxDistance).toBeCloseTo(Math.sqrt(0.8))
  })

  it('rejects incompatible embedding dimensions', () => {
    expect(() => compareFaceEmbeddings([1, 0], [1, 0, 0], 0.6)).toThrow(
      'dimensions do not match',
    )
  })
})

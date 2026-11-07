import { describe, it, expect } from 'vitest'
import { SET_FACE_CODE_OVERRIDES, toSetFaceCode } from '../set-face-code'
import { resolvePtcgSetCodeCandidates } from '../ptcg-set-code-aliases'

describe('toSetFaceCode', () => {
  it('maps a disambiguated externalId to its printed face code', () => {
    expect(toSetFaceCode('MG-MEGA')).toBe('MG')
  })

  it('matches case-insensitively', () => {
    expect(toSetFaceCode('mg-mega')).toBe('MG')
  })

  it('returns the externalId unchanged when not overridden', () => {
    expect(toSetFaceCode('MG')).toBe('MG')
    expect(toSetFaceCode('sv3')).toBe('sv3')
    expect(toSetFaceCode('OP16')).toBe('OP16')
  })
})

describe('SET_FACE_CODE_OVERRIDES ↔ PTCG JA search candidates', () => {
  it('every overridden externalId is reachable by searching its face code', () => {
    for (const [externalId, face] of Object.entries(SET_FACE_CODE_OVERRIDES)) {
      const candidates = resolvePtcgSetCodeCandidates(face, 'PTCG', 'JA')
      expect(candidates).toContain(face.toLowerCase())
      expect(candidates).toContain(externalId.toLowerCase())
    }
  })
})

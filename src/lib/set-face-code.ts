/**
 * DB `CardSet.externalId` → printed face code, for sets whose externalId had to be
 * disambiguated because another product (usually from an older generation) prints the
 * same face code.
 *
 * Single source of truth shared by:
 * - display (`toSetFaceCode`): show what is printed on the card, not the internal id;
 * - search (`ptcg-set-code-aliases.ts`): a face code expands to every externalId sharing it.
 *
 * Zero dependencies on purpose — imported by client components.
 * Keys are matched case-insensitively.
 */
export const SET_FACE_CODE_OVERRIDES: Readonly<Record<string, string>> = {
  'MG-MEGA': 'MG',
}

const OVERRIDES_LOWER = new Map(
  Object.entries(SET_FACE_CODE_OVERRIDES).map(([id, face]) => [id.toLowerCase(), face]),
)

/** Face code to display for a set; falls back to the externalId itself. */
export function toSetFaceCode(externalId: string): string {
  return OVERRIDES_LOWER.get(externalId.toLowerCase()) ?? externalId
}

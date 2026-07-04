import {z} from 'zod'

// Player fields validated by the new-game form. Pure and Vue-agnostic — reusable for the
// create-game payload or a future backend. Messages are CODES; the UI maps them to i18n,
// keeping this layer translation-free.
const playersSchema = z
  .object({
    playerWhiteName: z.string().trim().min(1, 'required'),
    playerBlackName: z.string().trim().min(1, 'required'),
    playerWhiteAvatar: z.string(),
    playerBlackAvatar: z.string(),
  })
  .refine(d => d.playerWhiteName !== d.playerBlackName, {
    path: ['playerBlackName'],
    message: 'sameName',
  })
  .refine(d => d.playerWhiteAvatar !== d.playerBlackAvatar, {
    path: ['playerBlackAvatar'],
    message: 'sameImage',
  })

export interface NewGamePlayersInput {
  playerWhiteName: string
  playerBlackName: string
  playerWhiteAvatar: string
  playerBlackAvatar: string
}

export type NewGamePlayersErrors = Partial<Record<keyof NewGamePlayersInput, string>>

// First error code per field; {} when valid. Names compared trimmed (see schema).
export function validateNewGamePlayers(input: NewGamePlayersInput): NewGamePlayersErrors {
  const result = playersSchema.safeParse(input)
  if (result.success) {
    return {}
  }

  const errors: NewGamePlayersErrors = {}
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof NewGamePlayersInput | undefined
    if (field && !errors[field]) {
      errors[field] = issue.message
    }
  }

  return errors
}

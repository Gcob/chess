import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CreateGamePayload, GameSession } from '@/types/chess'
import { createGameSession } from '@/composables/factories/gameFactory'

export const useGamesStore = defineStore('games', () => {
  const sessions = ref<GameSession[]>([])
  let _nextId = 1

  // Creates a session from a payload and registers it.
  // The id is assigned here for now — will come from the backend response eventually.
  function open(payload: CreateGamePayload): GameSession {
    const session = createGameSession(payload, _nextId++)
    sessions.value.push(session)
    return session
  }

  function close(id: number): void {
    sessions.value = sessions.value.filter(s => s.id !== id)
  }

  function get(id: number): GameSession | undefined {
    return sessions.value.find(s => s.id === id)
  }

  // Convenience accessor — the currently active session (max 1 for now)
  const active = computed<GameSession | undefined>(() => sessions.value[0])

  return { sessions, open, close, get, active }
})

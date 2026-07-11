import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import type { CreateGamePayload, GameSession } from '@/types/chess'
import { createGameSession } from '@/composables/factories/gameFactory'
import { generateUlid } from '@/utils/ulid'

export const useGamesStore = defineStore('games', () => {
  const sessions = ref<GameSession[]>([])

  // Creates a session from a payload and registers it.
  // The ULID is simulated here for now — will come from the backend response eventually.
  function open(payload: CreateGamePayload): GameSession {
    // Wrapped in reactive() at birth so the returned reference IS the proxy the store holds —
    // mutating the session from anywhere (engine, tests, future websocket) triggers reactivity.
    const session = reactive(createGameSession(payload, generateUlid()))
    sessions.value.push(session)
    return session
  }

  function close(id: string): void {
    sessions.value = sessions.value.filter(s => s.id !== id)
  }

  function get(id: string): GameSession | undefined {
    return sessions.value.find(s => s.id === id)
  }

  // Convenience accessor — the currently active session (max 1 for now)
  const active = computed<GameSession | undefined>(() => sessions.value[0])

  return { sessions, open, close, get, active }
})

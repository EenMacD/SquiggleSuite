import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Play, CreatePlayRequest } from '../types/play'

export const usePlaysStore = defineStore('plays', () => {
  const plays = ref<Play[]>([])

  // Load from local storage on initialization (survives refresh/reopen)
  const loadPlays = () => {
    try {
      const stored = localStorage.getItem('squiggle_plays')
      if (stored) {
        const parsed = JSON.parse(stored)
        plays.value = Array.isArray(parsed)
          ? parsed.map((play: Play) => ({
              ...play,
              ballEvents: Array.isArray(play.ballEvents) ? play.ballEvents : []
            }))
          : []
      }
    } catch (error) {
      console.error('Failed to load plays from local storage:', error)
      plays.value = []
    }
  }

  // Save to local storage
  const savePlays = () => {
    try {
      localStorage.setItem('squiggle_plays', JSON.stringify(plays.value))
    } catch (error) {
      throw error
    }
  }

  // Create play (persist to durable storage; do not tie to session TTL)
  const createPlay = (playData: CreatePlayRequest): Play => {
    const newPlay: Play = {
      id: `play_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: playData.name,
      createdAt: new Date().toISOString(),
      playerStates: playData.playerStates,
      ballEvents: playData.ballEvents
    }

    // Attempt to write without mutating state first (avoid partial updates on quota error)
    const candidate = [...plays.value, newPlay]
    const payload = JSON.stringify(candidate)
    try {
      localStorage.setItem('squiggle_plays', payload)
      plays.value = candidate
      return newPlay
    } catch (err: any) {
      // Surface a specific error marker for quota issues
      const name = err?.name || ''
      if (name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED' || name === 'SecurityError') {
        throw new Error('STORAGE_QUOTA_EXCEEDED')
      }
      throw err instanceof Error ? err : new Error('Failed to save play')
    }
  }

  // List plays (unaffected by session TTL)
  const listPlays = (): Play[] => {
    return plays.value
  }

  // Get play
  const getPlay = (id: string): Play | null => {
    return plays.value.find(play => play.id === id) || null
  }

  // Delete play
  const deletePlay = (id: string): void => {
    const index = plays.value.findIndex(play => play.id === id)
    if (index !== -1) {
      plays.value.splice(index, 1)
      try {
        savePlays()
      } catch (err) {
        // If deletion fails due to storage issues, we at least updated RAM state; log quietly
        console.error('Failed to persist deletion:', err)
      }
    }
  }

  // Clear all plays
  const clearPlays = () => {
    plays.value = []
    localStorage.removeItem('squiggle_plays')
  }

  // Initialize store
  loadPlays()

  return {
    plays,
    createPlay,
    listPlays,
    getPlay,
    deletePlay,
    clearPlays
  }
}) 

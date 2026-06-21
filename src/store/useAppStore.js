import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAppStore = create(
  persist(
    (set, get) => ({
      // Navigation
      currentScene: 'intro', // 'intro' | 'galaxy' | 'world'
      currentWorld: null,    // null | 1-5
      isWarping: false,
      warpTarget: null,

      // Progress
      completedWorlds: [],
      worldProgress: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, // 0-100

      // UI
      showConfirmModal: false,
      hudVisible: true,
      audioEnabled: false,

      // Actions
      setScene: (scene) => set({ currentScene: scene }),
      setCurrentWorld: (world) => set({ currentWorld: world }),
      setIsWarping: (val) => set({ isWarping: val }),
      setWarpTarget: (target) => set({ warpTarget: target }),

      startWarp: (target) => {
        set({ isWarping: true, warpTarget: target })
        setTimeout(() => {
          if (typeof target === 'number') {
            set({ currentScene: 'world', currentWorld: target, isWarping: false, warpTarget: null })
          } else {
            set({ currentScene: target, currentWorld: null, isWarping: false, warpTarget: null })
          }
        }, 1500)
      },

      completeWorld: (worldId) => {
        const { completedWorlds } = get()
        if (!completedWorlds.includes(worldId)) {
          set({ completedWorlds: [...completedWorlds, worldId] })
        }
        set((s) => ({ worldProgress: { ...s.worldProgress, [worldId]: 100 } }))
      },

      setWorldProgress: (worldId, progress) =>
        set((s) => ({ worldProgress: { ...s.worldProgress, [worldId]: Math.max(s.worldProgress[worldId], progress) } })),

      setShowConfirmModal: (val) => set({ showConfirmModal: val }),
      setHudVisible: (val) => set({ hudVisible: val }),
      toggleAudio: () => set((s) => ({ audioEnabled: !s.audioEnabled })),

      getCompletedCount: () => get().completedWorlds.length,
      isWorldCompleted: (id) => get().completedWorlds.includes(id),
    }),
    {
      name: 'automata-progress',
      partialize: (s) => ({ completedWorlds: s.completedWorlds, worldProgress: s.worldProgress }),
    }
  )
)

export default useAppStore

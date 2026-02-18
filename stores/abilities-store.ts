import { create } from 'zustand';

import type { Abilities } from '@/types/permissions';

interface AbilitiesState {
  abilities: Abilities;
  isLoaded: boolean;
  setAbilities: (abilities: Abilities) => void;
  reset: () => void;
}

export const useAbilitiesStore = create<AbilitiesState>(set => ({
  abilities: [],
  isLoaded: false,
  setAbilities: abilities => set({ abilities, isLoaded: true }),
  reset: () => set({ abilities: [], isLoaded: false }),
}));

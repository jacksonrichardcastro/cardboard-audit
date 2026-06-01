import { create } from 'zustand';

interface FiltersState {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const useFiltersStore = create<FiltersState>((set) => ({
  isOpen: false,
  setIsOpen: (isOpen) => set({ isOpen }),
}));

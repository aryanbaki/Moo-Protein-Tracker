import { create } from 'zustand';

/** Whether the "+" menu is open. Shared so the tab bar button can open the sheet that Home owns. */
export const useAddSheet = create<{ open: boolean; setOpen: (open: boolean) => void }>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));

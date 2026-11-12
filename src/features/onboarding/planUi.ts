import { create } from 'zustand';

import type { GoalField } from '../goals';

/** Transient UI state shared by the plan and reality-check screens. Not persisted. */
interface PlanUiState {
  /** Field whose edit sheet should reopen when the plan screen regains focus. */
  reopenField: GoalField | null;
  setReopenField: (field: GoalField | null) => void;
}

export const usePlanUi = create<PlanUiState>()((set) => ({
  reopenField: null,
  setReopenField: (reopenField) => set({ reopenField }),
}));

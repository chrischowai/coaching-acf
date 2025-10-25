import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { CoachingStage, SessionType, CheckInData, StartingPointData, ConnectData, FinishData, CheckOutData } from '@/types/coaching';

interface SessionState {
  // Session metadata
  sessionId: string | null;
  sessionType: SessionType | null;
  currentStage: CoachingStage;
  isComplete: boolean;
  
  // Stage data
  checkInData: Partial<CheckInData>;
  startingPointData: Partial<StartingPointData>;
  connectData: Partial<ConnectData>;
  finishData: Partial<FinishData>;
  checkOutData: Partial<CheckOutData>;
  
  // UI state
  isSaving: boolean;
  lastSaved: Date | null;
  
  // Actions
  setSessionId: (id: string) => void;
  setSessionType: (type: SessionType) => void;
  setCurrentStage: (stage: CoachingStage) => void;
  setCheckInData: (data: Partial<CheckInData>) => void;
  setStartingPointData: (data: Partial<StartingPointData>) => void;
  setConnectData: (data: Partial<ConnectData>) => void;
  setFinishData: (data: Partial<FinishData>) => void;
  setCheckOutData: (data: Partial<CheckOutData>) => void;
  setIsSaving: (saving: boolean) => void;
  markSaved: () => void;
  completeSession: () => void;
  resetSession: () => void;
}

export const useSessionStore = create<SessionState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        sessionId: null,
        sessionType: null,
        currentStage: 1,
        isComplete: false,
        
        checkInData: {},
        startingPointData: {},
        connectData: {},
        finishData: {},
        checkOutData: {},
        
        isSaving: false,
        lastSaved: null,
        
        // Actions
        setSessionId: (id) => set({ sessionId: id }),
        
        setSessionType: (type) => set({ sessionType: type }),
        
        setCurrentStage: (stage) => set({ currentStage: stage }),
        
        setCheckInData: (data) => set((state) => ({
          checkInData: { ...state.checkInData, ...data }
        })),
        
        setStartingPointData: (data) => set((state) => ({
          startingPointData: { ...state.startingPointData, ...data }
        })),
        
        setConnectData: (data) => set((state) => ({
          connectData: { ...state.connectData, ...data }
        })),
        
        setFinishData: (data) => set((state) => ({
          finishData: { ...state.finishData, ...data }
        })),
        
        setCheckOutData: (data) => set((state) => ({
          checkOutData: { ...state.checkOutData, ...data }
        })),
        
        setIsSaving: (saving) => set({ isSaving: saving }),
        
        markSaved: () => set({ lastSaved: new Date() }),
        
        completeSession: () => set({ isComplete: true, currentStage: 5 }),
        
        resetSession: () => set({
          sessionId: null,
          sessionType: null,
          currentStage: 1,
          isComplete: false,
          checkInData: {},
          startingPointData: {},
          connectData: {},
          finishData: {},
          checkOutData: {},
          isSaving: false,
          lastSaved: null,
        }),
      }),
      {
        name: 'acf-coaching-session',
      }
    )
  )
);

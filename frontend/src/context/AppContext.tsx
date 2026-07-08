import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export type Screen = 'voice-cloning' | 'studio-recorder' | 'library';

interface AppContextType {
  activeScreen: Screen;
  setActiveScreen: (screen: Screen) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeScreen, setActiveScreen] = useState<Screen>('voice-cloning');

  return (
    <AppContext.Provider value={{ activeScreen, setActiveScreen }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}

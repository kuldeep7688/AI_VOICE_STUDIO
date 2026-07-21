import { AppProvider, useAppContext } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar } from './components/Sidebar';
import { TopAppBar } from './components/TopAppBar';
import { AppFooter } from './components/AppFooter';
import { VoiceCloningScreen } from './components/VoiceCloning/VoiceCloningScreen';
import { StudioRecorderScreen } from './components/StudioRecorder/StudioRecorderScreen';
import { LibraryScreen } from './components/Library/LibraryScreen';
import './globals.css';

const SCREEN_TITLES: Record<string, string> = {
  'voice-cloning': 'Voice Cloning Workshop',
  'studio-recorder': 'Studio Recorder',
  'library': 'Asset Library',
};

function AppContent() {
  const { activeScreen } = useAppContext();

  return (
    <div className="h-screen flex bg-bg text-on-surface font-sans overflow-hidden">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <TopAppBar title={SCREEN_TITLES[activeScreen]} />
        <main className="flex-1 overflow-y-auto p-6 pb-10">
          {activeScreen === 'voice-cloning' && <VoiceCloningScreen />}
          {activeScreen === 'studio-recorder' && <StudioRecorderScreen />}
          {activeScreen === 'library' && <LibraryScreen />}
        </main>
        <AppFooter />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ThemeProvider>
  );
}

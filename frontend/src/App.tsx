import { AppProvider, useAppContext } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { VoiceCloningScreen } from './components/VoiceCloning/VoiceCloningScreen';
import { StudioRecorderScreen } from './components/StudioRecorder/StudioRecorderScreen';
import { LibraryScreen } from './components/Library/LibraryScreen';
import './globals.css';

function AppContent() {
  const { activeScreen } = useAppContext();

  return (
    <div className="h-screen flex bg-[--bg] font-sans text-[--text] overflow-hidden">
      <Sidebar />
      <main className="flex-1 ml-[220px] p-8 overflow-y-auto">
        {activeScreen === 'voice-cloning' && <VoiceCloningScreen />}
        {activeScreen === 'studio-recorder' && <StudioRecorderScreen />}
        {activeScreen === 'library' && <LibraryScreen />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

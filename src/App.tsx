import React, { useState, useEffect, createContext, useContext } from 'react';
import { auth, db, onAuthStateChanged, signInWithPopup, googleProvider, signOut, collection, query, where, orderBy, onSnapshot, handleFirestoreError, OperationType } from './firebase';
import { User } from 'firebase/auth';
import Home from './components/Home';
import LectureResults from './components/LectureResults';
import Quiz from './components/Quiz';
import Recording from './components/Recording';
import { motion, AnimatePresence } from 'motion/react';

// Auth Context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Navigation
type Screen = 'home' | 'record' | 'lecture' | 'quiz' | 'settings';

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { user, loading, signIn } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-dim flex items-center justify-center">
        <div className="animate-pulse text-cyan-400 font-headline tracking-widest uppercase">Initializing Synapse...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-surface-dim flex flex-col items-center justify-center p-6 text-center">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary-container/5 blur-[100px] rounded-full"></div>
        <h1 className="font-headline text-6xl font-black tracking-tighter text-on-surface mb-4">SYNAPSE</h1>
        <p className="font-label text-xs uppercase tracking-[0.3em] text-cyan-400/60 mb-10">Neural Transcription Engine</p>
        <button 
          onClick={signIn}
          className="bg-primary-container text-on-primary px-8 py-3 font-headline font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:scale-105 transition-all"
        >
          Initialize Neural Link
        </button>
      </div>
    );
  }

  const navigateTo = (screen: Screen, sessionId?: string) => {
    if (sessionId) setSelectedSessionId(sessionId);
    setCurrentScreen(screen);
  };

  return (
    <div className="min-h-screen bg-surface-dim text-on-surface font-body selection:bg-primary-container selection:text-on-primary overflow-x-hidden">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-zinc-950/80 backdrop-blur-xl border-b-[0.5px] border-cyan-500/20 flex items-center justify-between px-6 h-16 shadow-[0_0_20px_rgba(0,240,255,0.05)]">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigateTo('home')}>
          <span className="material-symbols-outlined text-cyan-400">sensors</span>
          <h1 className="font-headline tracking-tight font-black uppercase text-cyan-400 tracking-widest text-lg">SYNAPSE AI</h1>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-cyan-400 hover:text-cyan-300 transition-colors active:scale-95">
            <span className="material-symbols-outlined">cloud_sync</span>
          </button>
        </div>
      </header>

      <main className="pt-24 pb-32 px-6 max-w-5xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {currentScreen === 'home' && <Home onNavigate={navigateTo} />}
            {currentScreen === 'record' && <Recording onNavigate={navigateTo} />}
            {currentScreen === 'lecture' && selectedSessionId && (
              <LectureResults sessionId={selectedSessionId} onNavigate={navigateTo} />
            )}
            {currentScreen === 'quiz' && selectedSessionId && (
              <Quiz sessionId={selectedSessionId} onNavigate={navigateTo} />
            )}
            {currentScreen === 'settings' && (
              <div className="text-center py-20">
                <h2 className="text-2xl font-headline mb-4">System Settings</h2>
                <button 
                  onClick={() => auth.signOut()}
                  className="bg-error-container text-on-error-container px-6 py-2 rounded-lg"
                >
                  Terminate Neural Link
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 w-full z-50 bg-zinc-950/90 backdrop-blur-2xl border-t-[0.5px] border-cyan-500/30 flex justify-around items-center h-20 pb-safe px-4 shadow-[0_-4px_24px_rgba(0,240,255,0.1)]">
        <NavButton active={currentScreen === 'home'} icon="home" label="HOME" onClick={() => navigateTo('home')} />
        <NavButton active={currentScreen === 'record'} icon="mic_none" label="REC" onClick={() => navigateTo('record')} />
        <NavButton active={currentScreen === 'lecture'} icon="folder_open" label="VAULT" onClick={() => navigateTo('lecture')} />
        <NavButton active={currentScreen === 'quiz'} icon="quiz" label="ANALYZE" onClick={() => navigateTo('quiz')} />
        <NavButton active={currentScreen === 'settings'} icon="settings" label="SYSTEM" onClick={() => navigateTo('settings')} />
      </nav>
    </div>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean; icon: string; label: string; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(0,240,255,0.8)] scale-110' : 'text-zinc-600 hover:text-cyan-200'} active:scale-90 duration-200 ease-out`}
    >
      <span className="material-symbols-outlined">{icon}</span>
      <span className="font-headline text-[10px] uppercase tracking-wider">{label}</span>
    </button>
  );
}

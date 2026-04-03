import React, { useState, useEffect } from 'react';
import { db, collection, query, where, orderBy, onSnapshot, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../App';
import { motion } from 'motion/react';

interface Session {
  id: string;
  title: string;
  lecturer: string;
  topic: string;
  duration: number;
  wordCount: number;
  confidence: number;
  createdAt: any;
}

export default function Home({ onNavigate }: { onNavigate: (screen: any, id?: string) => void }) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'sessions'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessionData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Session[];
      setSessions(sessionData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'sessions');
    });

    return unsubscribe;
  }, [user]);

  return (
    <div className="space-y-12">
      <section className="relative text-center">
        <h2 className="font-headline text-5xl md:text-7xl font-black tracking-tighter text-on-surface mb-4">
          SYNAPSE
        </h2>
        <p className="font-label text-xs uppercase tracking-[0.3em] text-cyan-400/60 mb-10">Neural Transcription Engine v2.4</p>
        
        <div className="w-full max-w-xl mx-auto relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-cyan-500/50">terminal</span>
          </div>
          <input 
            className="w-full bg-surface-container-lowest border-l-[0.5px] border-cyan-400 py-4 pl-12 pr-4 text-on-surface placeholder:text-zinc-600 focus:ring-0 focus:outline-none focus:bg-surface-container-low transition-all font-label tracking-wide" 
            placeholder="SEARCH ARCHIVES_" 
            type="text"
          />
        </div>
      </section>

      <section className="flex flex-col items-center justify-center py-8">
        <div className="relative group">
          <div className="absolute inset-0 bg-primary-container/20 rounded-full animate-ping opacity-20"></div>
          <div className="absolute inset-0 bg-primary-container/10 rounded-full scale-125 opacity-10 blur-xl"></div>
          <button 
            onClick={() => onNavigate('record')}
            className="relative w-32 h-32 md:w-40 md:h-40 bg-primary-container rounded-full flex flex-col items-center justify-center shadow-[0_0_40px_rgba(0,240,255,0.4)] hover:shadow-[0_0_60px_rgba(0,240,255,0.6)] transition-all active:scale-90 group"
          >
            <span className="material-symbols-outlined text-on-primary text-4xl md:text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>mic</span>
            <span className="font-label text-[10px] font-bold text-on-primary tracking-widest mt-2">REC</span>
          </button>
        </div>
        <p className="mt-6 font-label text-[10px] uppercase tracking-widest text-zinc-500 animate-pulse">Ready for capture_</p>
      </section>

      <section>
        <div className="flex justify-between items-end mb-8">
          <div>
            <h3 className="font-headline text-2xl font-bold tracking-tight text-on-surface">Recent Sessions</h3>
            <div className="h-1 w-12 bg-primary-container mt-2"></div>
          </div>
          <button className="text-cyan-400 font-label text-xs tracking-widest uppercase hover:underline">View all_</button>
        </div>

        {loading ? (
          <div className="text-center py-10 text-zinc-500 uppercase tracking-widest text-xs">Accessing Neural Vault...</div>
        ) : sessions.length === 0 ? (
          <div className="bg-surface-container-low ghost-border p-10 text-center text-zinc-500 uppercase tracking-widest text-xs">
            No neural logs found. Start a new capture.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.slice(0, 4).map((session, index) => (
              <SessionCard key={session.id} session={session} onNavigate={onNavigate} isWide={index === 2 && sessions.length > 2} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SessionCard({ session, onNavigate, isWide }: { session: Session; onNavigate: (screen: any, id: string) => void; isWide?: boolean }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.01 }}
      onClick={() => onNavigate('lecture', session.id)}
      className={`group relative bg-surface-container-low ghost-border p-6 hover:bg-surface-container transition-all flex flex-col justify-between min-h-[160px] overflow-hidden cursor-pointer ${isWide ? 'md:col-span-2' : ''}`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container/5 blur-3xl group-hover:bg-primary-container/10 transition-all"></div>
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="font-label text-[10px] uppercase tracking-widest text-cyan-400/60 mb-1">Session ID: {session.id.slice(0, 8)}</p>
          <h4 className="font-headline text-xl font-bold text-on-surface">{session.title}</h4>
          <p className="font-body text-sm text-zinc-400 mt-1">{session.lecturer} • {session.topic}</p>
        </div>
        <div className="bg-primary-container/10 border border-primary-container/20 px-2 py-1 rounded-sm">
          <span className="font-label text-[10px] font-bold text-cyan-400">{session.confidence}% CONF</span>
        </div>
      </div>
      <div className="flex items-center justify-between mt-6 relative z-10">
        <div className="flex items-center gap-3">
          <span className="font-label text-xs text-zinc-500 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">schedule</span>
            {session.duration} MIN
          </span>
          <span className="font-label text-xs text-zinc-500 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">description</span>
            {(session.wordCount / 1000).toFixed(1)}K WORDS
          </span>
        </div>
        <button className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-cyan-400 hover:bg-primary-container hover:text-on-primary transition-all">
          <span className="material-symbols-outlined text-lg">arrow_forward</span>
        </button>
      </div>
    </motion.div>
  );
}

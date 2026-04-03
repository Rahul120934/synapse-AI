import React, { useState, useEffect } from 'react';
import { db, doc, getDoc, handleFirestoreError, OperationType } from '../firebase';
import Markdown from 'react-markdown';
import { motion } from 'motion/react';

interface Takeaway {
  title: string;
  description: string;
  icon: string;
}

interface Session {
  id: string;
  title: string;
  lecturer: string;
  topic: string;
  duration: number;
  wordCount: number;
  confidence: number;
  summary: string;
  takeaways: Takeaway[];
  transcript: string;
  createdAt: any;
}

export default function LectureResults({ sessionId, onNavigate }: { sessionId: string; onNavigate: (screen: any, id?: string) => void }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'takeaways' | 'transcript'>('summary');

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const docRef = doc(db, 'sessions', sessionId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSession({ id: docSnap.id, ...docSnap.data() } as Session);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `sessions/${sessionId}`);
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [sessionId]);

  if (loading) return <div className="text-center py-20 animate-pulse uppercase tracking-widest text-cyan-400">Decoding Neural Log...</div>;
  if (!session) return <div className="text-center py-20">Session not found.</div>;

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="font-label text-secondary text-[10px] uppercase tracking-[0.2em]">SYNAPTIC PROCESSING COMPLETE</span>
          <h2 className="font-headline text-4xl md:text-5xl font-bold text-primary tracking-tight leading-none uppercase">Lecture: {session.title}</h2>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2 bg-primary-container/10 px-4 py-1.5 rounded-full border border-primary-container/30">
              <span className="material-symbols-outlined text-primary-container text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              <span className="font-label text-primary-container text-xs font-bold tracking-wider uppercase">{session.confidence}% AI CONFIDENCE</span>
            </div>
            <span className="font-label text-surface-variant text-[10px] uppercase">
              {new Date(session.createdAt?.toDate()).toLocaleDateString()} • {session.duration} MINS
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-secondary-container text-secondary px-6 py-3 font-label text-xs font-bold uppercase tracking-widest transition-all hover:brightness-110 active:scale-95 shadow-[0_0_15px_rgba(124,4,188,0.3)]">
            <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
            EXPORT PDF
          </button>
          <button 
            onClick={() => onNavigate('quiz', session.id)}
            className="flex items-center gap-2 glass-border text-primary-container px-6 py-3 font-label text-xs font-bold uppercase tracking-widest transition-all hover:bg-primary-container/5 active:scale-95"
          >
            <span className="material-symbols-outlined text-sm">quiz</span>
            GENERATE QUIZ
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex gap-2 overflow-x-auto no-scrollbar border-b border-surface-container-highest/50">
            <TabButton active={activeTab === 'summary'} label="SUMMARY" onClick={() => setActiveTab('summary')} />
            <TabButton active={activeTab === 'takeaways'} label="TAKEAWAYS" onClick={() => setActiveTab('takeaways')} />
            <TabButton active={activeTab === 'transcript'} label="TRANSCRIPT" onClick={() => setActiveTab('transcript')} />
          </div>

          <div className="bg-surface-container-low p-8 glass-border relative overflow-hidden min-h-[400px]">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-container/5 blur-[80px] rounded-full"></div>
            <div className="relative z-10">
              {activeTab === 'summary' && (
                <div className="markdown-body text-on-surface/90 text-lg leading-relaxed font-body">
                  <Markdown>{session.summary}</Markdown>
                </div>
              )}
              {activeTab === 'takeaways' && (
                <div className="space-y-6">
                  {session.takeaways.map((t, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-surface-container-lowest border-l-2 border-secondary">
                      <span className="material-symbols-outlined text-secondary-fixed-dim mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>{t.icon}</span>
                      <div>
                        <h4 className="font-headline text-sm font-bold text-on-surface uppercase mb-1">{t.title}</h4>
                        <p className="text-sm text-surface-variant font-body">{t.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === 'transcript' && (
                <div className="text-zinc-400 text-sm leading-relaxed font-mono whitespace-pre-wrap">
                  {session.transcript}
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container p-6 ghost-border flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <span className="font-label text-[10px] text-surface-variant tracking-[0.2em] uppercase">SYNAPTIC MAP</span>
              <span className="material-symbols-outlined text-primary-container text-lg">hub</span>
            </div>
            <div className="h-48 w-full bg-surface-container-lowest relative flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #00f0ff 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
              <img 
                className="w-full h-full object-cover mix-blend-screen opacity-60" 
                src="https://picsum.photos/seed/neural/400/300"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-4 left-4 bg-zinc-950/90 p-2 border border-primary-container/20">
                <span className="font-label text-[9px] text-primary-container">NODE COUNT: 14.2K</span>
              </div>
            </div>
            <div className="space-y-4">
              <StatRow label="AI MODEL" value="SYNAPSE-V4.2" />
              <StatRow label="TOKENS PROCESSED" value={session.wordCount * 1.5} />
              <StatRow label="PROCESSING TIME" value="1.4S" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`pb-4 px-6 font-label text-xs font-bold tracking-[0.15em] uppercase whitespace-nowrap transition-all ${active ? 'text-primary border-b-2 border-primary-container' : 'text-surface-variant hover:text-on-surface'}`}
    >
      {label}
    </button>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center border-b border-surface-container-highest pb-2 last:border-0">
      <span className="font-label text-[10px] text-surface-variant uppercase">{label}</span>
      <span className="font-label text-[10px] text-on-surface uppercase">{value}</span>
    </div>
  );
}

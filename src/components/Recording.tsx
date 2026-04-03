import React, { useState, useEffect, useRef } from 'react';
import { db, collection, addDoc, Timestamp, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../App';
import { generateSummaryAndTakeaways } from '../lib/gemini';
import { motion } from 'motion/react';

const MOCK_TRANSCRIPT = `Welcome to today's lecture on Neural Networks and Deep Learning. Today we'll be discussing the fundamental architecture of neural networks, drawing parallels between biological synapses and artificial perceptrons. 

The primary function of backpropagation in neural networks is to calculate the gradient of the loss function with respect to the weights to update them. This is essential for the learning process, as it allows the network to minimize errors over time.

We'll also look at the evolution from simple feed-forward models to complex transformer architectures. Attention mechanisms have revolutionized natural language processing by allowing models to weight the significance of different parts of input data dynamically, mimicking cognitive focus patterns.

In conclusion, neural networks are powerful tools for modeling complex non-linear relationships in data. Understanding the underlying mathematical frameworks like backpropagation and activation functions is key to building effective models.`;

export default function Recording({ onNavigate }: { onNavigate: (screen: any, id?: string) => void }) {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const timerRef = useRef<any>(null);

  const startRecording = () => {
    setIsRecording(true);
    timerRef.current = setInterval(() => {
      setDuration(d => d + 1);
    }, 1000);
  };

  const stopRecording = async () => {
    setIsRecording(false);
    clearInterval(timerRef.current);
    setIsProcessing(true);

    try {
      if (!user) return;

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

      const analysis = await generateSummaryAndTakeaways(MOCK_TRANSCRIPT);
      
      const newSession = {
        title: "Neural Networks & Deep Learning",
        lecturer: "Dr. Aris",
        topic: "Neural Architectures",
        duration: Math.ceil(duration / 60) || 1,
        wordCount: MOCK_TRANSCRIPT.split(' ').length,
        confidence: analysis.confidence || 95,
        summary: analysis.summary,
        takeaways: analysis.takeaways,
        transcript: MOCK_TRANSCRIPT,
        uid: user.uid,
        createdAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'sessions'), newSession);
      onNavigate('lecture', docRef.id);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'sessions');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-8">
        <div className="relative">
          <div className="w-32 h-32 border-4 border-primary-container/20 border-t-primary-container rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary-container text-4xl animate-pulse">psychology</span>
          </div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="font-headline text-2xl font-bold text-primary">SYNAPTIC PROCESSING</h2>
          <p className="font-label text-xs uppercase tracking-widest text-zinc-500">Decoding neural patterns and generating insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-12">
      <div className="text-center space-y-2">
        <h2 className="font-headline text-4xl font-black text-on-surface">NEURAL CAPTURE</h2>
        <p className="font-label text-xs uppercase tracking-widest text-cyan-400/60">Session ID: {Math.random().toString(36).substring(7).toUpperCase()}</p>
      </div>

      <div className="relative flex flex-col items-center">
        <div className={`absolute inset-0 bg-primary-container/20 rounded-full transition-all duration-1000 ${isRecording ? 'animate-ping opacity-20' : 'opacity-0'}`}></div>
        <div className={`w-64 h-64 rounded-full border-[0.5px] border-cyan-400/20 flex flex-col items-center justify-center space-y-4 transition-all ${isRecording ? 'bg-primary-container/5 shadow-[0_0_50px_rgba(0,240,255,0.1)]' : 'bg-surface-container-lowest'}`}>
          <span className="font-headline text-5xl font-black text-on-surface tracking-tighter">
            {formatTime(duration)}
          </span>
          <div className="flex gap-1">
            {[...Array(12)].map((_, i) => (
              <div 
                key={i} 
                className={`w-1 bg-primary-container transition-all duration-150 ${isRecording ? 'animate-bounce' : 'h-1 opacity-20'}`}
                style={{ height: isRecording ? `${Math.random() * 20 + 5}px` : '4px', animationDelay: `${i * 0.1}s` }}
              ></div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center space-y-6">
        {!isRecording ? (
          <button 
            onClick={startRecording}
            className="px-12 py-4 bg-primary-container text-on-primary font-headline font-bold uppercase tracking-widest shadow-[0_0_30px_rgba(0,240,255,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
          >
            <span className="material-symbols-outlined">mic</span>
            Start Capture
          </button>
        ) : (
          <button 
            onClick={stopRecording}
            className="px-12 py-4 bg-error-container text-on-error-container font-headline font-bold uppercase tracking-widest shadow-[0_0_30px_rgba(147,0,10,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
          >
            <span className="material-symbols-outlined">stop</span>
            End Capture
          </button>
        )}
        <p className="font-label text-[10px] uppercase tracking-widest text-zinc-500">
          {isRecording ? 'Neural link active. Capturing audio stream...' : 'Ready to initialize neural link.'}
        </p>
      </div>
    </div>
  );
}

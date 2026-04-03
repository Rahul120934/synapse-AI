import React, { useState, useEffect } from 'react';
import { db, collection, addDoc, query, where, getDocs, Timestamp, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../App';
import { generateQuiz } from '../lib/gemini';
import { motion, AnimatePresence } from 'motion/react';

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface QuizData {
  id?: string;
  sessionId: string;
  questions: Question[];
  score: number;
  totalQuestions: number;
  uid: string;
  createdAt: any;
}

export default function Quiz({ sessionId, onNavigate }: { sessionId: string; onNavigate: (screen: any, id?: string) => void }) {
  const { user } = useAuth();
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, 'quizzes'), where('sessionId', '==', sessionId), where('uid', '==', user.uid));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          setQuiz({ id: doc.id, ...doc.data() } as QuizData);
        } else {
          // Generate new quiz
          const sessionSnap = await getDocs(query(collection(db, 'sessions'), where('__name__', '==', sessionId)));
          if (!sessionSnap.empty) {
            const sessionData = sessionSnap.docs[0].data();
            const generated = await generateQuiz(sessionData.transcript);
            const newQuiz: QuizData = {
              sessionId,
              questions: generated.questions,
              score: 0,
              totalQuestions: generated.questions.length,
              uid: user.uid,
              createdAt: Timestamp.now()
            };
            const docRef = await addDoc(collection(db, 'quizzes'), newQuiz);
            setQuiz({ id: docRef.id, ...newQuiz });
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'quizzes');
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [sessionId, user]);

  const handleOptionSelect = (option: string) => {
    if (showExplanation) return;
    setSelectedOption(option);
  };

  const handleSubmitAnswer = () => {
    if (!selectedOption || !quiz) return;
    
    const isCorrect = selectedOption === quiz.questions[currentQuestionIndex].correctAnswer;
    if (isCorrect) setScore(s => s + 1);
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (!quiz) return;
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(i => i + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      setIsFinished(true);
    }
  };

  if (loading) return <div className="text-center py-20 animate-pulse uppercase tracking-widest text-cyan-400">Synthesizing Neural Test...</div>;
  if (!quiz) return <div className="text-center py-20">Quiz generation failed.</div>;

  if (isFinished) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-8 py-12">
        <h2 className="font-headline text-4xl font-bold text-primary">NEURAL EVALUATION COMPLETE</h2>
        <div className="bg-surface-container-low p-10 ghost-border inline-block">
          <p className="font-label text-xs uppercase tracking-widest text-zinc-500 mb-2">Final Accuracy</p>
          <p className="font-headline text-6xl font-black text-secondary-fixed-dim">{score} / {quiz.totalQuestions}</p>
        </div>
        <div className="flex justify-center gap-4">
          <button 
            onClick={() => onNavigate('lecture', sessionId)}
            className="px-8 py-3 glass-border text-primary-container font-headline text-sm font-bold tracking-widest uppercase"
          >
            Review Lecture
          </button>
          <button 
            onClick={() => onNavigate('home')}
            className="px-8 py-3 bg-primary-container text-on-primary font-headline text-sm font-bold tracking-widest uppercase"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];

  return (
    <div className="max-w-3xl mx-auto space-y-12">
      <div className="space-y-6">
        <div className="w-full h-[2px] bg-surface-container-highest relative">
          <div 
            className="absolute top-0 left-0 h-full bg-primary-container shadow-[0_0_12px_rgba(0,240,255,0.8)] transition-all duration-500"
            style={{ width: `${((currentQuestionIndex + 1) / quiz.totalQuestions) * 100}%` }}
          ></div>
        </div>
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <span className="inline-flex px-3 py-1 rounded-full bg-primary-container/10 border border-primary-container/30 text-[10px] font-headline tracking-[0.2em] text-primary-container uppercase">
              Question {currentQuestionIndex + 1} of {quiz.totalQuestions}
            </span>
            <h2 className="font-headline text-2xl md:text-3xl font-bold tracking-tight text-on-background max-w-2xl">
              {currentQuestion.question}
            </h2>
          </div>
          <div className="text-right">
            <p className="font-label text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Current Accuracy</p>
            <p className="font-headline text-2xl font-bold text-secondary-fixed-dim">Score: {score}/{currentQuestionIndex}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {currentQuestion.options.map((option, index) => {
          const isSelected = selectedOption === option;
          const isCorrect = option === currentQuestion.correctAnswer;
          const showResult = showExplanation;
          
          return (
            <button 
              key={index}
              onClick={() => handleOptionSelect(option)}
              disabled={showExplanation}
              className={`group relative flex items-center p-6 transition-all text-left ${
                showResult 
                  ? isCorrect 
                    ? 'bg-primary-container/10 border-primary-container border-[0.5px]' 
                    : isSelected ? 'bg-error-container/10 border-error border-[0.5px]' : 'bg-surface-container-low ghost-border opacity-50'
                  : isSelected 
                    ? 'bg-secondary-container/10 border-secondary-fixed-dim border-[0.5px] shadow-[0_0_30px_rgba(124,4,188,0.15)]' 
                    : 'bg-surface-container-low ghost-border hover:bg-surface-container'
              }`}
            >
              <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center font-headline text-sm transition-all ${
                showResult && isCorrect 
                  ? 'bg-primary-container text-on-primary' 
                  : isSelected 
                    ? 'bg-secondary-container text-secondary-fixed' 
                    : 'border border-primary/20 text-primary/60'
              }`}>
                {String.fromCharCode(65 + index)}
              </div>
              <div className="ml-6">
                <p className={`font-body ${isSelected || (showResult && isCorrect) ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                  {option}
                </p>
              </div>
              {showResult && isCorrect && (
                <div className="absolute right-6">
                  <span className="material-symbols-outlined text-primary-container scale-110" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {showExplanation && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-6 bg-surface-container-lowest border-l-2 border-primary-container/40"
          >
            <div className="flex items-start gap-4">
              <span className="material-symbols-outlined text-primary-container text-xl">lightbulb</span>
              <div>
                <h4 className="font-label text-[10px] uppercase tracking-widest text-primary-container mb-1">AI Context Hint</h4>
                <p className="font-body text-sm text-zinc-400 italic">{currentQuestion.explanation}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between pt-8 border-t border-white/5">
        <button 
          onClick={() => onNavigate('lecture', sessionId)}
          className="flex items-center gap-2 px-6 py-3 font-headline text-sm tracking-wider uppercase text-zinc-500 hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Abort
        </button>
        {showExplanation ? (
          <button 
            onClick={handleNextQuestion}
            className="px-10 py-3 bg-secondary-container text-secondary font-headline text-sm font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(124,4,188,0.3)] hover:scale-[1.02] active:scale-95 transition-all"
          >
            Next Question
          </button>
        ) : (
          <button 
            onClick={handleSubmitAnswer}
            disabled={!selectedOption}
            className={`px-10 py-3 font-headline text-sm font-bold tracking-widest uppercase transition-all ${
              selectedOption 
                ? 'bg-primary-container text-on-primary shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:scale-[1.02] active:scale-95' 
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            }`}
          >
            Submit Answer
          </button>
        )}
      </div>
    </div>
  );
}

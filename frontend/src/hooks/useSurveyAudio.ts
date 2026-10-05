import { useState, useRef, useEffect, useCallback } from 'react';
import type { IQuestion } from '../types';

export function useSurveyAudio(globalVolume: number = 1) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeAudio, setActiveAudio] = useState<'A' | 'B' | 'C' | 'D' | 'E'>('A');

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceARef = useRef<AudioBufferSourceNode | null>(null);
  const sourceBRef = useRef<AudioBufferSourceNode | null>(null);
  const sourceCRef = useRef<AudioBufferSourceNode | null>(null);
  const sourceDRef = useRef<AudioBufferSourceNode | null>(null);
  const sourceERef = useRef<AudioBufferSourceNode | null>(null);
  
  const masterGainRef = useRef<GainNode | null>(null);
  const gainARef = useRef<GainNode | null>(null);
  const gainBRef = useRef<GainNode | null>(null);
  const gainCRef = useRef<GainNode | null>(null);
  const gainDRef = useRef<GainNode | null>(null);
  const gainERef = useRef<GainNode | null>(null);
  
  const bufferARef = useRef<AudioBuffer | null>(null);
  const bufferBRef = useRef<AudioBuffer | null>(null);
  const bufferCRef = useRef<AudioBuffer | null>(null);
  const bufferDRef = useRef<AudioBuffer | null>(null);
  const bufferERef = useRef<AudioBuffer | null>(null);
  
  const startTimeRef = useRef<number>(0);
  const offsetTimeRef = useRef<number>(0);
  const animationRef = useRef<number>(0);
  const preloadedBuffersRef = useRef<Record<number, { bufferA: AudioBuffer; bufferB: AudioBuffer | null; bufferC: AudioBuffer | null; bufferD: AudioBuffer | null; bufferE: AudioBuffer | null }>>({});

  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setValueAtTime(globalVolume, audioCtxRef.current.currentTime);
    }
  }, [globalVolume]);

  const loadAudioBuffers = async (ctx: AudioContext, urlA?: string, urlB?: string, urlC?: string, urlD?: string, urlE?: string) => {
    const fetchBuffer = async (url?: string) => {
      if (!url) return null;
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      return ctx.decodeAudioData(arrayBuffer);
    };
    const [bufferA, bufferB, bufferC, bufferD, bufferE] = await Promise.all([
      fetchBuffer(urlA),
      fetchBuffer(urlB),
      fetchBuffer(urlC),
      fetchBuffer(urlD),
      fetchBuffer(urlE)
    ]);
    return { bufferA: bufferA as AudioBuffer, bufferB, bufferC, bufferD, bufferE };
  };

  const preloadNext = async (index: number, questions: IQuestion[]) => {
    if (index >= questions.length) return;
    const q = questions[index];
    if (q.type && !q.type.startsWith('AUDIO')) {
      preloadNext(index + 1, questions);
      return;
    }
    if (!audioCtxRef.current) return;
    if (preloadedBuffersRef.current[index]) return;
    
    try {
      const buffers = await loadAudioBuffers(audioCtxRef.current, q.audioUrlA, q.audioUrlB, q.audioUrlC, q.audioUrlD, q.audioUrlE);
      preloadedBuffersRef.current[index] = buffers;
    } catch (e) {
      console.error("Failed to preload", e);
    }
  };

  const setupQuestionAudio = async (index: number, questions: IQuestion[]) => {
    const q = questions[index];
    if (!q || !q.type.startsWith('AUDIO')) {
      stopAudioNodes();
      setLoading(false);
      preloadNext(index + 1, questions);
      return;
    }

    setLoading(true);
    setIsPlaying(false);
    
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
    }

    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioCtxRef.current = ctx;

    let buffers;
    if (preloadedBuffersRef.current[index]) {
      buffers = preloadedBuffersRef.current[index];
    } else {
      try {
        buffers = await loadAudioBuffers(ctx, q.audioUrlA, q.audioUrlB, q.audioUrlC, q.audioUrlD, q.audioUrlE);
      } catch (err) {
        console.error("Audio Load Error:", err);
        setLoading(false);
        throw new Error('Failed to load audio');
      }
    }

    bufferARef.current = buffers.bufferA;
    bufferBRef.current = buffers.bufferB;
    bufferCRef.current = buffers.bufferC;
    bufferDRef.current = buffers.bufferD;
    bufferERef.current = buffers.bufferE;
    
    if (buffers.bufferA) {
      setDuration(buffers.bufferA.duration);
    }
    setCurrentTime(0);
    offsetTimeRef.current = 0;

    const masterGain = ctx.createGain();
    masterGain.gain.value = globalVolume;
    masterGain.connect(ctx.destination);
    masterGainRef.current = masterGain;

    const gainA = ctx.createGain();
    const gainB = ctx.createGain();
    const gainC = ctx.createGain();
    const gainD = ctx.createGain();
    const gainE = ctx.createGain();
    gainA.gain.value = 1;
    gainB.gain.value = 0;
    gainC.gain.value = 0;
    gainD.gain.value = 0;
    gainE.gain.value = 0;
    
    gainA.connect(masterGain);
    gainB.connect(masterGain);
    gainC.connect(masterGain);
    gainD.connect(masterGain);
    gainE.connect(masterGain);
    
    gainARef.current = gainA;
    gainBRef.current = gainB;
    gainCRef.current = gainC;
    gainDRef.current = gainD;
    gainERef.current = gainE;

    setActiveAudio('A');
    setLoading(false);

    // GC: Clear old buffers to prevent memory leaks
    Object.keys(preloadedBuffersRef.current).forEach(key => {
      const k = parseInt(key);
      if (k < index - 1 || k > index + 2) {
        delete preloadedBuffersRef.current[k];
      }
    });

    preloadNext(index + 1, questions);
  };

  const updateProgress = useCallback(() => {
    if (!audioCtxRef.current || !bufferARef.current) return;
    const elapsed = Math.max(0, audioCtxRef.current.currentTime - startTimeRef.current);
    const newTime = (offsetTimeRef.current + elapsed) % bufferARef.current.duration;
    setCurrentTime(newTime);
    animationRef.current = requestAnimationFrame(updateProgress);
  }, []);

  const startAudioNodes = (offset: number) => {
    if (!audioCtxRef.current || !bufferARef.current) return;
    const ctx = audioCtxRef.current;

    sourceARef.current?.disconnect();
    sourceBRef.current?.disconnect();
    sourceCRef.current?.disconnect();
    sourceDRef.current?.disconnect();
    sourceERef.current?.disconnect();

    const sourceA = ctx.createBufferSource();
    sourceA.buffer = bufferARef.current;
    sourceA.loop = true;
    if (gainARef.current) sourceA.connect(gainARef.current);
    sourceA.start(0, offset);
    sourceARef.current = sourceA;

    if (bufferBRef.current) {
      const sourceB = ctx.createBufferSource();
      sourceB.buffer = bufferBRef.current;
      sourceB.loop = true;
      if (gainBRef.current) sourceB.connect(gainBRef.current);
      sourceB.start(0, offset);
      sourceBRef.current = sourceB;
    }

    if (bufferCRef.current) {
      const sourceC = ctx.createBufferSource();
      sourceC.buffer = bufferCRef.current;
      sourceC.loop = true;
      if (gainCRef.current) sourceC.connect(gainCRef.current);
      sourceC.start(0, offset);
      sourceCRef.current = sourceC;
    }

    if (bufferDRef.current) {
      const sourceD = ctx.createBufferSource();
      sourceD.buffer = bufferDRef.current;
      sourceD.loop = true;
      if (gainDRef.current) sourceD.connect(gainDRef.current);
      sourceD.start(0, offset);
      sourceDRef.current = sourceD;
    }

    if (bufferERef.current) {
      const sourceE = ctx.createBufferSource();
      sourceE.buffer = bufferERef.current;
      sourceE.loop = true;
      if (gainERef.current) sourceE.connect(gainERef.current);
      sourceE.start(0, offset);
      sourceERef.current = sourceE;
    }

    startTimeRef.current = ctx.currentTime;
    
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(updateProgress);
  };

  const stopAudioNodes = useCallback(() => {
    try { sourceARef.current?.stop(); } catch(e){}
    try { sourceBRef.current?.stop(); } catch(e){}
    try { sourceCRef.current?.stop(); } catch(e){}
    try { sourceDRef.current?.stop(); } catch(e){}
    try { sourceERef.current?.stop(); } catch(e){}
    sourceARef.current?.disconnect();
    sourceBRef.current?.disconnect();
    sourceCRef.current?.disconnect();
    sourceDRef.current?.disconnect();
    sourceERef.current?.disconnect();
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
  }, []);

  const togglePlay = () => {
    if (!audioCtxRef.current || !bufferARef.current) return;
    
    if (!isPlaying) {
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      startAudioNodes(offsetTimeRef.current);
      setIsPlaying(true);
    } else {
      const elapsed = audioCtxRef.current.currentTime - startTimeRef.current;
      offsetTimeRef.current = (offsetTimeRef.current + elapsed) % bufferARef.current.duration;
      stopAudioNodes();
      setIsPlaying(false);
    }
  };

  const switchAudio = (target: 'A' | 'B' | 'C' | 'D' | 'E') => {
    if (!audioCtxRef.current) return;
    if (activeAudio === target) return;

    const now = audioCtxRef.current.currentTime;
    const fadeTime = 0.05; // 50ms crossfade
    
    gainARef.current?.gain.cancelScheduledValues(now);
    gainARef.current?.gain.setValueAtTime(gainARef.current.gain.value, now);
    gainARef.current?.gain.linearRampToValueAtTime(target === 'A' ? 1 : 0, now + fadeTime);

    gainBRef.current?.gain.cancelScheduledValues(now);
    gainBRef.current?.gain.setValueAtTime(gainBRef.current.gain.value, now);
    gainBRef.current?.gain.linearRampToValueAtTime(target === 'B' ? 1 : 0, now + fadeTime);

    if (gainCRef.current) {
      gainCRef.current.gain.cancelScheduledValues(now);
      gainCRef.current.gain.setValueAtTime(gainCRef.current.gain.value, now);
      gainCRef.current.gain.linearRampToValueAtTime(target === 'C' ? 1 : 0, now + fadeTime);
    }

    if (gainDRef.current) {
      gainDRef.current.gain.cancelScheduledValues(now);
      gainDRef.current.gain.setValueAtTime(gainDRef.current.gain.value, now);
      gainDRef.current.gain.linearRampToValueAtTime(target === 'D' ? 1 : 0, now + fadeTime);
    }

    if (gainERef.current) {
      gainERef.current.gain.cancelScheduledValues(now);
      gainERef.current.gain.setValueAtTime(gainERef.current.gain.value, now);
      gainERef.current.gain.linearRampToValueAtTime(target === 'E' ? 1 : 0, now + fadeTime);
    }

    setActiveAudio(target);
  };

  const seek = (time: number) => {
    offsetTimeRef.current = time;
    setCurrentTime(time);
    if (isPlaying) {
      stopAudioNodes();
      startAudioNodes(time);
    }
  };

  useEffect(() => {
    return () => {
      stopAudioNodes();
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, [stopAudioNodes]);

  return {
    isPlaying,
    currentTime,
    duration,
    loading,
    activeAudio,
    setupQuestionAudio,
    togglePlay,
    switchAudio,
    seek,
    setCurrentTime // to handle manual dragging UI state without audio seeking
  };
}

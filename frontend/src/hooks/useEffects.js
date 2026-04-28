import { useState, useEffect, useRef } from 'react';

/**
 * useTypewriter — streams text character by character
 * Gives the "AI is typing" effect for agent messages
 */
export function useTypewriter(text, speed = 15, enabled = true) {
  const [displayed, setDisplayed] = useState('');
  const [isDone, setIsDone] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    if (!text || !enabled || text === 'thinking') {
      setDisplayed(text || '');
      setIsDone(!text || text === 'thinking');
      return;
    }

    setDisplayed('');
    setIsDone(false);
    indexRef.current = 0;

    const interval = setInterval(() => {
      indexRef.current += 1;
      // Type 2-3 chars at a time for faster but still visible effect
      const charsPerTick = Math.ceil(Math.random() * 2) + 1;
      const nextIndex = Math.min(indexRef.current * charsPerTick, text.length);
      setDisplayed(text.slice(0, nextIndex));

      if (nextIndex >= text.length) {
        setIsDone(true);
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, enabled]);

  return { displayed, isDone };
}

/**
 * useAnimatedNumber — smoothly animates number changes
 */
export function useAnimatedNumber(target, duration = 600) {
  const [current, setCurrent] = useState(target);
  const frameRef = useRef(null);
  const startRef = useRef(current);
  const startTimeRef = useRef(null);

  useEffect(() => {
    startRef.current = current;
    startTimeRef.current = performance.now();

    const animate = (now) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = startRef.current + (target - startRef.current) * eased;

      setCurrent(Math.round(value));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return current;
}

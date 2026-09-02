import { useEffect, useState } from 'react';

/**
 * Reveals `text` one character at a time.
 *
 * Returns the visible slice plus whether it is still typing, so the caller can
 * show a caret only while the text is in motion. Pass `instant` to skip the
 * effect entirely — used when the system asks for reduced motion.
 */
export function useTypewriter(text: string, speed = 38, startDelay = 500, instant = false) {
  const [count, setCount] = useState(instant ? text.length : 0);

  useEffect(() => {
    if (instant) {
      setCount(text.length);
      return;
    }

    setCount(0);
    let index = 0;
    let interval: ReturnType<typeof setInterval>;

    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        index += 1;
        setCount(index);
        if (index >= text.length) clearInterval(interval);
      }, speed);
    }, startDelay);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [instant, speed, startDelay, text]);

  return { visible: text.slice(0, count), typing: count < text.length };
}

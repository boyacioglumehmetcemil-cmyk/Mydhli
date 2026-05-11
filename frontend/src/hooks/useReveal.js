import { useEffect, useRef, useState } from "react";

/** Animate a numeric value from 0 to `end` when element scrolls into view. */
export const useCountUp = (end, duration = 1400) => {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started.current) {
            started.current = true;
            const start = performance.now();
            const step = (now) => {
              const elapsed = now - start;
              const progress = Math.min(elapsed / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              setValue(end * eased);
              if (progress < 1) requestAnimationFrame(step);
              else setValue(end);
            };
            requestAnimationFrame(step);
          }
        });
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [end, duration]);

  return { ref, value };
};

/** Toggle a class on the element when it scrolls into view. */
export const useReveal = (delay = 0) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => setVisible(true), delay);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);
  return { ref, visible };
};

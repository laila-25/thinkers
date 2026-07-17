import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import { useLocation } from 'react-router';

export default function PageLoadingTransition() {
  const { pathname } = useLocation();
  const reduceMotion = useReducedMotion();
  const firstLoad = useRef(true);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const duration = reduceMotion ? 120 : firstLoad.current ? 1050 : 620;
    firstLoad.current = false;
    const timeout = window.setTimeout(() => setVisible(false), duration);
    return () => window.clearTimeout(timeout);
  }, [pathname, reduceMotion]);

  return (
    <AnimatePresence>
      {visible && (
        <m.div
          key={pathname}
          className="fixed inset-0 z-[100] grid place-items-center bg-[#fbfcfe]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.08 : 0.3, ease: 'easeOut' }}
          role="status"
          aria-live="polite"
          aria-label="Loading Thinkers"
        >
          <div className="flex flex-col items-center">
            <div className="relative grid h-32 w-32 place-items-center sm:h-36 sm:w-36">
              <m.div
                aria-hidden="true"
                className="absolute inset-1 rounded-full bg-[radial-gradient(circle,rgba(245,197,66,0.42)_0%,rgba(245,197,66,0.13)_42%,transparent_72%)] blur-xl"
                initial={reduceMotion ? false : { opacity: 0, scale: 0.55 }}
                animate={reduceMotion ? { opacity: 0.35 } : { opacity: [0, 0.2, 0.58], scale: [0.55, 0.8, 1.08] }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              />
              <m.img
                src="/favicon.png"
                alt=""
                className="relative z-10 h-24 w-24 object-contain sm:h-28 sm:w-28"
                initial={reduceMotion ? false : { opacity: 0.7, scale: 0.92, filter: 'brightness(0.34) saturate(0.55)' }}
                animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, filter: 'brightness(1) saturate(1) drop-shadow(0 0 12px rgba(245,197,66,0.38))' }}
                transition={{ duration: 0.68, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <div className="mt-3 overflow-hidden px-3 py-1">
              <m.span
                className="block text-2xl font-extrabold tracking-[0.24em] text-[#0B132B] sm:text-3xl"
                initial={reduceMotion ? false : { opacity: 0, y: 14, letterSpacing: '0.34em' }}
                animate={{ opacity: 1, y: 0, letterSpacing: '0.24em' }}
                transition={{ duration: 0.5, delay: reduceMotion ? 0 : 0.36, ease: [0.22, 1, 0.36, 1] }}
              >
                THINKERS
              </m.span>
            </div>
            <m.div
              aria-hidden="true"
              className="mt-4 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent"
              initial={reduceMotion ? { width: 64, opacity: 0.6 } : { width: 0, opacity: 0 }}
              animate={{ width: 96, opacity: 0.7 }}
              transition={{ duration: 0.45, delay: reduceMotion ? 0 : 0.48 }}
            />
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

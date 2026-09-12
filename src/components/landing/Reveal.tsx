import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'left' | 'right';
}

export const Reveal = ({ children, className, delay = 0, direction = 'up' }: RevealProps) => {
  const reduceMotion = useReducedMotion();
  const disableMotion = reduceMotion || typeof IntersectionObserver === 'undefined';
  const offset = direction === 'left' ? { x: -20 } : direction === 'right' ? { x: 20 } : { y: 18 };

  return (
    <motion.div
      className={className}
      initial={disableMotion ? false : { opacity: 0, ...offset }}
      whileInView={disableMotion ? undefined : { opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

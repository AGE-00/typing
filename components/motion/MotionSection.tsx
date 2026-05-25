'use client';

import { createContext, useContext, useSyncExternalStore, type AriaRole, type CSSProperties, type ReactNode } from 'react';
import { motion, type Transition, type Variants } from 'motion/react';
import { getMotionConfig, MOTION_PREFERENCE_EVENT, type MotionLevel } from '@/lib/motion';

const DEFAULT_LEVEL: MotionLevel = 'minimal';
const STANDARD_OFFSET = 8;
const MotionGroupContext = createContext(false);

function readDocumentMotionLevel(): MotionLevel {
  if (typeof document === 'undefined') return DEFAULT_LEVEL;
  const level = document.documentElement.dataset.motion;
  return level === 'off' || level === 'minimal' || level === 'standard' ? level : DEFAULT_LEVEL;
}

function subscribeToMotionLevelChange(onStoreChange: () => void) {
  if (typeof window === 'undefined') return () => undefined;

  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });

  window.addEventListener(MOTION_PREFERENCE_EVENT, onStoreChange);
  return () => {
    observer.disconnect();
    window.removeEventListener(MOTION_PREFERENCE_EVENT, onStoreChange);
  };
}

export function useDocumentMotionLevel() {
  return useSyncExternalStore(subscribeToMotionLevelChange, readDocumentMotionLevel, () => DEFAULT_LEVEL);
}

function sectionVariants(level: MotionLevel): Variants {
  if (level === 'off') {
    return {
      hidden: { opacity: 1, y: 0 },
      show: { opacity: 1, y: 0 },
    };
  }
  if (level === 'minimal') {
    return {
      hidden: { opacity: 0 },
      show: { opacity: 1 },
    };
  }
  return {
    hidden: { opacity: 0, y: STANDARD_OFFSET },
    show: { opacity: 1, y: 0 },
  };
}

function groupVariants(level: MotionLevel): Variants {
  const config = getMotionConfig(level);
  return {
    hidden: {},
    show: {
      transition: {
        staggerChildren: level === 'standard' ? 0.055 : level === 'minimal' ? 0.025 : 0,
        delayChildren: level === 'standard' ? 0.025 : 0,
        when: 'beforeChildren',
        duration: config.duration,
      },
    },
  };
}

function transitionFor(level: MotionLevel, delay = 0) {
  const config = getMotionConfig(level);
  return {
    duration: config.duration,
    delay: config.enabled ? delay : 0,
    ease: 'easeOut',
  } satisfies Transition;
}

type ElementName = 'div' | 'section' | 'header' | 'footer' | 'article' | 'aside';

type MotionElementProps = {
  'aria-label'?: string;
  className?: string;
  id?: string;
  role?: AriaRole;
  style?: CSSProperties;
};

type MotionSectionProps = MotionElementProps & {
  as?: ElementName;
  children: ReactNode;
  delay?: number;
};

export function MotionSection({ as = 'div', children, className, delay = 0, ...props }: MotionSectionProps) {
  const level = useDocumentMotionLevel();
  const isGrouped = useContext(MotionGroupContext);
  const Component = motion[as];
  const standaloneMotionProps = isGrouped ? {} : {
    initial: level === 'off' ? false : 'hidden',
    animate: 'show',
    transition: transitionFor(level, delay),
  };

  return <Component
    {...props}
    {...standaloneMotionProps}
    className={className}
    variants={sectionVariants(level)}
  >
    {children}
  </Component>;
}

type MotionGroupProps = MotionElementProps & {
  as?: ElementName;
  children: ReactNode;
};

export function MotionGroup({ as = 'div', children, className, ...props }: MotionGroupProps) {
  const level = useDocumentMotionLevel();
  const Component = motion[as];

  return <Component
    {...props}
    className={className}
    variants={groupVariants(level)}
    initial={level === 'off' ? false : 'hidden'}
    animate="show"
  >
    <MotionGroupContext.Provider value>
      {children}
    </MotionGroupContext.Provider>
  </Component>;
}

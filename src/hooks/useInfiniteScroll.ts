'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const BATCH_SIZE = 20;

export function useInfiniteScroll(data: any[]) {
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting) {
        setVisibleCount(prevCount => {
          if (prevCount < data.length) {
            return Math.min(prevCount + BATCH_SIZE, data.length);
          }
          return prevCount;
        });
      }
    },
    [data.length]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '200px',
      threshold: 0.1,
    });

    const sentinel = sentinelRef.current;
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => {
      observer.disconnect();
    };
  }, [handleObserver]);

  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [data]);

  return { visibleCount, sentinelRef };
}

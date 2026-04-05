'use client';

import { useEffect, useState } from 'react';

interface LiveRegionProps {
  message: string;
  assertive?: boolean;
}

export function LiveRegion({ message, assertive = false }: LiveRegionProps) {
  const [announced, setAnnounced] = useState('');

  useEffect(() => {
    if (!message) return;
    const clearTimer = setTimeout(() => setAnnounced(''), 0);
    const announceTimer = setTimeout(() => setAnnounced(message), 100);
    return () => {
      clearTimeout(clearTimer);
      clearTimeout(announceTimer);
    };
  }, [message]);

  return (
    <div
      role="status"
      aria-live={assertive ? 'assertive' : 'polite'}
      aria-atomic="true"
      className="sr-only"
    >
      {announced}
    </div>
  );
}

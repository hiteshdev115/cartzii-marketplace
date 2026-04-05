'use client';

import { useEffect, useState } from 'react';

interface LiveRegionProps {
  message: string;
  assertive?: boolean;
}

export function LiveRegion({ message, assertive = false }: LiveRegionProps) {
  const [announced, setAnnounced] = useState('');

  useEffect(() => {
    if (message) {
      setAnnounced('');
      const timer = setTimeout(() => setAnnounced(message), 100);
      return () => clearTimeout(timer);
    }
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

import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { localDay } from '../../lib/date';

/** Today's local day, kept fresh across midnight and when the app comes back to the foreground. */
export function useToday(): string {
  const [today, setToday] = useState(() => localDay());
  useEffect(() => {
    const refresh = () => setToday(localDay());
    const id = setInterval(refresh, 30_000);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') refresh();
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, []);
  return today;
}

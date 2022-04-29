import { useEffect, useMemo, useState } from 'react';

export default function Countdown({ to }: { to: Date }) {
  const [secondsRemaining, setSecondsRemaining] = useState(Math.trunc(Math.max(to.getTime() - Date.now(), 0) / 1000));

  useEffect(() => {
    setSecondsRemaining(Math.trunc(Math.max(to.getTime() - Date.now(), 0) / 1000));
  }, [to]);

  useEffect(() => {
    const interval = setInterval(() => setSecondsRemaining(until => Math.max(until - 1, 0)), 1000);

    return () => clearInterval(interval);
  }, []);

  const hour = useMemo(() => Math.floor(secondsRemaining / 3600) % 24, [secondsRemaining]);
  const minutes = useMemo(() => Math.floor(secondsRemaining / 60) % 60, [secondsRemaining]);
  const seconds = useMemo(() => secondsRemaining % 60, [secondsRemaining]);
  return (
    <time dateTime={to.toISOString()}>
      {hour.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
    </time>
  );
}

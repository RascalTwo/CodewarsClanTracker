import { useState, useEffect, useMemo } from 'react';

export default function Countup({ from }: { from: Date }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(Math.trunc(Math.max(Date.now() - from.getTime(), 0) / 1000));

  useEffect(() => {
    setElapsedSeconds(Math.trunc(Math.max(Date.now() - from.getTime(), 0) / 1000));
  }, [from]);

  useEffect(() => {
    const interval = setInterval(() => setElapsedSeconds(elapsed => elapsed + 1), 1000);

    return () => clearInterval(interval);
  }, []);

  const days = useMemo(() => Math.floor(elapsedSeconds / 86400), [elapsedSeconds]);
  const hour = useMemo(() => Math.floor(elapsedSeconds / 3600) % 24, [elapsedSeconds]);
  const minutes = useMemo(() => Math.floor(elapsedSeconds / 60) % 60, [elapsedSeconds]);
  const seconds = useMemo(() => elapsedSeconds % 60, [elapsedSeconds]);
  return (
    <time dateTime={from.toISOString()}>
      {days.toString().padStart(2, '0')}:{hour.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:
      {seconds.toString().padStart(2, '0')}
    </time>
  );
}

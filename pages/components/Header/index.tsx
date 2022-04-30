import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import Countdown from '../Countdown';

export default function Header() {
  const [nextDownload, setNextDownload] = useState(0);

  useEffect(() => {
    fetch('/api/next-data')
      .then(response => response.json())
      .then(setNextDownload);
  }, []);
  return (
    <header>
      <nav>
        <ul>
          <li>
            <Link href="/">Calendar</Link>
          </li>
          <li>
            <Link href="/leaderboard">Leaderboard</Link>
          </li>
          <li>
            <Link href="/lookup">Lookup</Link>
          </li>
        </ul>
      </nav>
      <h1>#100Devs Codewars Clan Tracker</h1>
      <p>
        Tracking the leaderboard changes of users in the <code>#100Devs - leonnoel.com/twitch</code> Codewars Clan
      </p>
      <aside
        onContextMenu={useCallback((e: React.MouseEvent) => {
          e.preventDefault();
          return fetch('/api/generate-new', { method: 'POST', body: prompt('Generation Password:') })
            .then(response => response.text())
            .then(alert);
        }, [])}
      >
        Time until new data: <Countdown to={new Date(nextDownload || Date.now())} />
      </aside>
    </header>
  );
}

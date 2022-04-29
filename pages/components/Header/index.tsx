import Link from 'next/link';

export default function Header() {
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
    </header>
  );
}

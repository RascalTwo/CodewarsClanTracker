import Head from 'next/head';
import { Leaderboard } from './components/Leaderboard';

export default function LeaderboardPage() {
  return (
    <>
      <Head>
        <title>#100Devs Codewars User Leaderboard</title>
      </Head>
      <main>
        <Leaderboard />
      </main>
    </>
  );
}

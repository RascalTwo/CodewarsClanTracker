import Head from 'next/head';
import Header from '../components/Header';
import Leaderboard from '../components/Leaderboard';

export default function LeaderboardPage() {
  return (
    <>
      <Head>
        <title>#100Devs Codewars Leaderboard</title>
      </Head>

      <Header />
      <main>
        <Leaderboard />
      </main>
    </>
  );
}

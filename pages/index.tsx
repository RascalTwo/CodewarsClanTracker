import fs from 'fs';
import Head from 'next/head';
import Calendar from '../components/Calendar';
import Header from '../components/Header';

export default function HomePage({ start }: { start: number }) {
  return (
    <>
      <Head>
        <title>#100Devs Codewars Leaderboard</title>
      </Head>

      <Header />
      <main>
        <Calendar />
      </main>
    </>
  );
}

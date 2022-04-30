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
        <Calendar defaultStart={new Date(start)} defaultEnd={new Date()} />
      </main>
    </>
  );
}

export async function getStaticProps() {
  return {
    props: {
      start: +(await fs.promises.readdir(process.env.DAILY_CLAN_DIRECTORY!)).sort().slice(1)[0].split('.')[0],
    },
  };
}

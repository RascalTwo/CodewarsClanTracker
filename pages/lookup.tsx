import Head from 'next/head';
import Header from '../components/Header';
import UserLookup from '../components/UserLookup';

export default function LookupPage() {
  return (
    <>
      <Head>
        <title>#100Devs Codewars Lookup</title>
      </Head>

      <Header />
      <main>
        <UserLookup />
      </main>
    </>
  );
}

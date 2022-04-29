import Head from 'next/head';
import { UserLookup } from './components/UserLookup';

export default function LookupPage() {
  return (
    <>
      <Head>
        <title>#100Devs Codewars User Lookup</title>
      </Head>
      <main>
        <UserLookup />
      </main>
    </>
  );
}

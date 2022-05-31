import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/Header';

export default function FAQ() {
  return (
    <>
      <Head>
        <title>#100Devs Codewars FAQ</title>
      </Head>

      <Header />
      <main>
        <h1>FAQ</h1>
        <p>
          This application is designed to track over time the changes of users in the{' '}
          <code>#100Devs - leonnoel.com/twitch</code> Codewars clan.
        </p>
        <p>
          It exists as there is no way to view the entirety of a Codewars Clan leaderboard natively, and viewing the
          allies page of a user who has only joined a single clan only shows an entire clan if the user joined the clan
          as one of the first 500 users.
        </p>
        <details>
          <summary>The leaderboard does not match mine!</summary>

          <p>
            If you are not one of the initial 500 members of a clan, then your Allies list takes time to update - or may
            never update. You can attempt retyping the clan tag manually, leaving and rejoining the clan, logging out
            and back in, etc.
          </p>
        </details>
        <br />
        <details>
          <summary>How do I know if I&apos;m in the clan?</summary>

          <p>
            Aside from seeing your name here, you can <Link href="/lookup">look your name up</Link> to see if your clan
            name is correct
          </p>
        </details>
        <details>
          <summary>How do I join the clan?</summary>

          <p>
            Go to your <code>Account Settings</code>, paste <code>#100Devs - leonnoel.com/twitch</code> into the{' '}
            <code>Clan (Company, School or Organization)</code> field, and click <code>Update</code> at the bottom of
            the page.
          </p>
        </details>
        <details>
          <summary>How can I validate past data accuracy?</summary>

          <p>
            Unfortunately there is no way to do this simply, as the data is not being preserved by anything aside from
            this application. The only way to validate the data accuracy is to run your own copy of the downloading
            scripts yourself, which of course only works for future and not past data.
          </p>
        </details>
        <details>
          <summary>Can I see the data?</summary>

          <p>
            Yes you can! All the original data is downloadable via a{' '}
            <Link href="/api/download">
              <a download="data.zip">.ZIP file</a>
            </Link>
          </p>
        </details>
        <details>
          <summary>What do the diamonds and ribbens mean?</summary>

          <p>
            Diamonds are awarded for being the top of a leaderboard, while ribbens are gained for being in the top ten
            of a leaderboard. The colors reflect the rarity, Gold bring the rarest for Monthly leaderboards, Silver for
            Weekly leaderboards, and finally Bronze for Daily leaderboards!
          </p>
        </details>
        <details>
          <summary>Why can&apos;t my username be looked up?</summary>

          <p>
            If a user cannot be looked up, it&apos;s possible the user has deleted their account or updated their
            username
          </p>
        </details>
      </main>
    </>
  );
}

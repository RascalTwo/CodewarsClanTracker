import Link from 'next/link';

export default function Footer() {
  return (
    <footer>
      <details>
        <summary>FAQ</summary>

        <details>
          <summary>The leaderboard does not match mine!</summary>

          <p>If you are not one of the initial 500 members of a clan, then your Allies list takes time to update</p>
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
      </details>
    </footer>
  );
}

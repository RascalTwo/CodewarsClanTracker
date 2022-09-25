import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useUsernameInput } from '../../hooks';
import { copyAndMutate, dateToYYYYMMDD } from '../../shared';
import type { FailureResponse, PublicScrapedUser, RankInfo, SuccessResponse } from '../../types';
import LoadingIndicator from '../LoadingIndicator';
import RankBadge from '../RankBadge';

interface CodewarsAPIFailure {
  success: false;
  reason: string;
}

interface CodewarsAPIUser {
  /** Username of the user.*/
  username: string;
  /** Name of the user.*/
  name: string;
  /** Total honor points earned by the user.*/
  honor: number;
  /** Name of the clan.*/
  clan: string;
  /** The user's position on the overall leaderboard.*/
  leaderboardPosition: number;
  /**  	Array of skills entered by the user.*/
  skills: string[];
  /** Ranks object with overall and language ranks.*/
  ranks: {
    overall: RankInfo;
    languages: {
      [languageSlug: string]: RankInfo;
    };
  };

  /** Object with fields totalAuthored and totalCompleted for the number of authored and completed kata respectively.*/
  codeChallenges: {
    totalAuthored: number;
    totalCompleted: number;
  };
}

function getAchievementAttributes(achievement: PublicScrapedUser['achievements'][number]) {
  const color = achievement.period === 'days' ? 'bronze' : achievement.period === 'weeks' ? 'silver' : 'gold';
  const type = achievement.placedIndex === 0 ? 'diamond.webp' : 'ribben.png';

  const startStr = dateToYYYYMMDD(new Date(achievement.when));
  const endStr = dateToYYYYMMDD(copyAndMutate(new Date(achievement.when), achievement.period === 'days' ? date => date.setUTCDate(date.getUTCDate() + 1) : achievement.period === 'weeks' ? date => date.setUTCDate(date.getUTCDate() + 6) : date => date.setUTCMonth(date.getUTCMonth() + 1)));
  return {
    src: '/' + color + '-' + type,
    style: achievement.placedIndex === 0 ? {fontSize: 75 + 'px', flex: 1} : { flex: 1 },
    alt: `${achievement.placedIndex + 1} place in ${achievement.period} from ${startStr} to ${endStr}`,
    title: `${achievement.placedIndex + 1} place in ${achievement.period} from ${startStr} to ${endStr}`,
  };
}

export default function UserLookup() {
  const [username, setUsername, usernameInput] = useUsernameInput('Username to Lookup');
  const [user, setUser] = useState<(CodewarsAPIUser & PublicScrapedUser) | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setUser(null);

    if (!username) return;
    setLoading(true);
    (async () => {
      const data: CodewarsAPIUser | CodewarsAPIFailure = await fetch(
        'https://www.codewars.com/api/v1/users/' + username,
      ).then(response => response.json());
      if ('success' in data) return alert(data.reason);

      const myData: SuccessResponse<PublicScrapedUser> | FailureResponse = await fetch(
        '/api/user?username=' + username,
      ).then(response => response.json());
      if (!myData.success) return alert(myData.message);

      setUser({ ...data, ...myData.data });
    })()
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [username]);

  const inCorrectClan = useMemo(() => user?.clan === '#100Devs - leonnoel.com/twitch', [user]);

  const achievedCounts = user?.achievements.reduce(
    (res, ach) => {
      // @ts-ignore
      if (res[ach.type][ach.period][ach.placedIndex] === undefined) res[ach.type][ach.period][ach.placedIndex] = 0;
      // @ts-ignore
      res[ach.type][ach.period][ach.placedIndex]++;
      return res;
    },
    { honor: { days: {}, weeks: {}, months: {} }, change: { days: {}, weeks: {}, months: {} } },
  ) || { honor: {}, change: {} };

  const changeAchievements = Object.entries(achievedCounts!.change).reduce(
    (imgCounts, [period, counts]) => {
      let diamonds = 0;
      let ribbens = 0;
      for (const key in counts) {
        // @ts-ignore
        if (key === '0') diamonds += counts[key];
        // @ts-ignore
        else ribbens += counts[key];
      }
      // @ts-ignore
      imgCounts[period === 'days' ? 'bronze' : period === 'weeks' ? 'silver' : 'gold'] = { diamonds, ribbens };
      return imgCounts;
    },
    { bronze: { diamonds: 0, ribbens: 0 }, silver: { diamonds: 0, ribbens: 0 }, gold: { diamonds: 0, ribbens: 0 } },
  );
  const highestAchievements = Object.entries(achievedCounts!.honor).reduce(
    (imgCounts, [period, counts]) => {
      let diamonds = 0;
      let ribbens = 0;
      for (const key in counts) {
        // @ts-ignore
        if (key === '0') diamonds += counts[key];
        // @ts-ignore
        else ribbens += counts[key];
      }
      // @ts-ignore
      imgCounts[period === 'days' ? 'bronze' : period === 'weeks' ? 'silver' : 'gold'] = { diamonds, ribbens };
      return imgCounts;
    },
    { bronze: { diamonds: 0, ribbens: 0 }, silver: { diamonds: 0, ribbens: 0 }, gold: { diamonds: 0, ribbens: 0 } },
  );

  return (
    <>
      {usernameInput}
      <LoadingIndicator loading={loading} />
      {user ? (
        <>
          <div>
            <h2>Achievements</h2>
            <h3 style={{ textAlign: 'center' }}>Highest Honor</h3>
            <div
              style={{ alignItems: 'center', display: 'flex', width: '75%', overflow: 'scroll', margin: 'auto', fontSize: 100 + 'px' }}
            >
              {user?.achievements.filter(a => a.type === 'honor').sort((a, b) => b.when - a.when).map((ach) =>
                <img
                  key={ach.type + ach.period + ach.when}
                  className='achievement'
                  {...getAchievementAttributes(ach)}
                />
              )}
            </div>
            <h3 style={{ textAlign: 'center' }}>Gained Honor</h3>
            <div
              style={{ alignItems: 'center', display: 'flex', width: '75%', overflow: 'scroll', margin: 'auto', fontSize: 100 + 'px' }}
            >
              {user?.achievements.filter(a => a.type === 'change').sort((a, b) => b.when - a.when).map((ach) =>
                <img
                  key={ach.type + ach.period + ach.when}
                  className='achievement'
                  {...getAchievementAttributes(ach)}
                />
              )}
            </div>
          </div>
          <table style={{ margin: 'auto' }}>
            <tbody>
              <tr>
                <td>Image</td>
                <td>
                  <img src={user.profileImageURL} alt={`${user.username} avatar`} />
                </td>
              </tr>
              <tr>
                <td>Username</td>
                <td>
                  <Link href={'https://www.codewars.com/users/' + user.username}>{user.username}</Link>
                </td>
              </tr>
              <tr>
                <td>Name</td>
                <td>{user.name}</td>
              </tr>
              <tr>
                <td>
                  Clan <span style={{ color: inCorrectClan ? 'green' : 'red' }}>{inCorrectClan ? '✓' : '❌'}</span>
                </td>
                <td>{user.clan}</td>
              </tr>
              <tr>
                <td>Last Seen</td>
                <td>{new Date(user.lastSeen).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td>Member Since</td>
                <td>{new Date(user.memberSince).toLocaleDateString()}</td>
              </tr>

              {Object.entries(user.profiles).map(([siteSlug, url]) => (
                <tr key={siteSlug}>
                  <td>{siteSlug}</td>
                  <td>
                    <a href={url}>{url}</a>
                  </td>
                </tr>
              ))}

              <tr>
                <td>Following</td>
                <td>{user.followingCount}</td>
              </tr>
              <tr>
                <td>Followed By</td>
                <td>{user.followerCount}</td>
              </tr>
              <tr>
                <td>Allies</td>
                <td>{user.allyCount}</td>
              </tr>
              <tr>
                <td>Honor</td>
                <td>{user.honor}</td>
              </tr>
              <tr>
                <td>Global Leaderboard Position</td>
                <td>{user.leaderboardPosition}</td>
              </tr>
              <tr>
                <td>Skills</td>
                <td>{user.skills?.length ? user.skills.join(', ') : 'None'}</td>
              </tr>
              <tr>
                <td>Authored Katas</td>
                <td>{user.codeChallenges.totalAuthored}</td>
              </tr>
              <tr>
                <td>Completed Katas</td>
                <td>{user.codeChallenges.totalCompleted}</td>
              </tr>
              <tr>
                <td>Most Recent Language Trained</td>
                <td>{user.mostRecentLanguageTrained}</td>
              </tr>
              <tr>
                <td>Overall Rank</td>
                <td>
                  <RankBadge {...user.ranks.overall} />
                </td>
              </tr>

              {Object.entries(user.ranks.languages).map(([languageSlug, rank]) => (
                <tr key={languageSlug}>
                  <td>{languageSlug} Rank</td>
                  <td>
                    <RankBadge {...rank} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}
    </>
  );
}

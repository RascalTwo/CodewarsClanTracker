import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useUsernameInput } from '../../hooks';
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
              style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', width: '90%', justifyContent: 'center', margin: 'auto', fontSize: 100 + 'px' }}
            >
              {Array.from({ length: highestAchievements.gold.diamonds }, (_, i) => (
                <img alt="" src="/gold-diamond.webp" style={{fontSize: 75 + 'px'}} className="achievement" />
              ))}
              {Array.from({ length: highestAchievements.silver.diamonds }, (_, i) => (
                <img alt="" src="/silver-diamond.webp" style={{fontSize: 75 + 'px'}} className="achievement" />
              ))}
              {Array.from({ length: highestAchievements.bronze.diamonds }, (_, i) => (
                <img alt="" src="/bronze-diamond.webp" style={{fontSize: 75 + 'px'}} className="achievement" />
              ))}
              {Array.from({ length: highestAchievements.gold.ribbens }, (_, i) => (
                <img alt="" src="/gold-ribben.png" className="achievement" />
              ))}
              {Array.from({ length: highestAchievements.silver.ribbens }, (_, i) => (
                <img alt="" src="/silver-ribben.png" className="achievement" />
              ))}
              {Array.from({ length: highestAchievements.bronze.ribbens }, (_, i) => (
                <img alt="" src="/bronze-ribben.png" className="achievement" />
              ))}
            </div>
            <h3 style={{ textAlign: 'center' }}>Gained Honor</h3>
            <div
              style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', width: '90%', justifyContent: 'center', margin: 'auto', fontSize: 100 + 'px' }}
            >
              {Array.from({ length: changeAchievements.gold.diamonds }, (_, i) => (
                <img alt="" src="/gold-diamond.webp" style={{fontSize: 75 + 'px'}} className="achievement" />
              ))}
              {Array.from({ length: changeAchievements.silver.diamonds }, (_, i) => (
                <img alt="" src="/silver-diamond.webp" style={{fontSize: 75 + 'px'}} className="achievement" />
              ))}
              {Array.from({ length: changeAchievements.bronze.diamonds }, (_, i) => (
                <img alt="" src="/bronze-diamond.webp" style={{fontSize: 75 + 'px'}} className="achievement" />
              ))}
              {Array.from({ length: changeAchievements.gold.ribbens }, (_, i) => (
                <img alt="" src="/gold-ribben.png" className="achievement" />
              ))}
              {Array.from({ length: changeAchievements.silver.ribbens }, (_, i) => (
                <img alt="" src="/silver-ribben.png" className="achievement" />
              ))}
              {Array.from({ length: changeAchievements.bronze.ribbens }, (_, i) => (
                <img alt="" src="/bronze-ribben.png" className="achievement" />
              ))}
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

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useUsernameInput } from '../../hooks';
import { copyAndMutate, dateToYYYYMMDD } from '../../shared';
import type { FailureResponse, PublicScrapedUser, RankInfo, SuccessResponse } from '../../types';
import LoadingIndicator from '../LoadingIndicator';
import RankBadge from '../RankBadge';
// @ts-ignore
import CalendarHeatMap from 'calendar-heatmap-mini'

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

interface MinimalKata {
  id: string;
  name: string;
  slug: string;
  completedLanguages: string[];
  completedAt: number;
}


async function getCompletedKatas(username: string): Promise<MinimalKata[]> {
  const completedKatas: MinimalKata[] = [];
  let totalPages = 1;
  for (let page = 0; page < totalPages; page++) {
    const data = await fetch(
      `https://www.codewars.com/api/v1/users/${username}/code-challenges/completed?page=${page}`,
    ).then((response: any) => response.json());
    if (data.success === false) throw new Error(data.reason);
    totalPages = data.totalPages;
    completedKatas.push(
      ...data.data.map((kata: any) => ({ ...kata, completedAt: new Date(kata.completedAt).getTime() })),
    );
  }
  return completedKatas.sort((a, b) => b.completedAt - a.completedAt);
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

interface Streak {
  start: Date;
  end: Date;
  katas: MinimalKata[];
}

const flattenDateToDay = (when: number) => new Date(Math.trunc(when / 86400000) * 86400000)

export default function UserLookup() {
  const [username, setUsername, usernameInput] = useUsernameInput('Username to Lookup');
  const [user, setUser] = useState<(CodewarsAPIUser & PublicScrapedUser) | null>(null);
  const [loading, setLoading] = useState(false);

  const [completedKatas, setCompletedKatas] = useState<MinimalKata[]>([]);
  const streaks = useMemo(() => {
    if (!completedKatas.length) return [];
    const streaks: Streak[] = [];
    let currentStreak: Streak = {
      start: flattenDateToDay(completedKatas[0].completedAt),
      end: flattenDateToDay(completedKatas[0].completedAt),
      katas: [completedKatas[0]],
    }
    for (let i = 1; i < completedKatas.length; i++) {
      const currentKata = completedKatas[i];
      const currentKataDate = flattenDateToDay(currentKata.completedAt);
      if (currentKataDate.getTime() >= currentStreak.end.getTime() - 86400000) {
        currentStreak.end = currentKataDate;
        currentStreak.katas.push(currentKata);
      } else {
        streaks.push(currentStreak);
        currentStreak = {
          start: currentKataDate,
          end: currentKataDate,
          katas: [currentKata],
        };
      }
    }
    streaks.push(currentStreak)
    return streaks.map(s => ({
      ...s,
      length: Math.ceil((s.start.getTime() - s.end.getTime()) / 86400000) + 1,
    }))
  }, [completedKatas]);

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
      .finally(() => setLoading(false))
      .then(async () => {
        setCompletedKatas(await getCompletedKatas(username));
      }).catch(console.error);
  }, [username]);

  const inCorrectClan = useMemo(() => user?.clan === '#100Devs - leonnoel.com/twitch', [user]);

  useEffect(() => {
    if (!completedKatas.length) return
    const now = Date.now();
    const chartData: Record<number, number> = {};
    for (const kata of completedKatas) {
      const date = flattenDateToDay(kata.completedAt).getTime();
      // if date is more than a year old, ignore
      if (now - date > 31536000000) continue;
      if (!(date in chartData)) chartData[date] = 0;
      chartData[date]++;
    }

    const chart1 = new CalendarHeatMap()
      .data(Object.entries(chartData).reduce((acc, [date, count]) => {
        acc.push({ date: new Date(+date), count });
        return acc;
      }, [] as { date: Date, count: number }[]))
      .selector('#calendar-heatmap')
      .colorRange(['#161b22', '#39d353'])
      .tooltipEnabled(true)
      .onClick(function (data: any) {
        console.log('onClick callback. Data:', data);
      });

    // render the chart
    chart1();
  }, [completedKatas])

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
          <div id="calendar-heatmap"></div>
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
          <div style={{ textAlign: 'center' }}>
            <h3>Streaks</h3>
            <ul>
              {streaks.map(s => <li key={s.end.getTime()}> {dateToYYYYMMDD(s.end)} -&gt; {dateToYYYYMMDD(s.start)} ({s.katas.length.toString().padStart(3, '0')} katas over {s.length.toString().padStart(3, '0')} days) </li>)}
            </ul>
          </div>
        </>
      ) : null}
    </>
  );
}

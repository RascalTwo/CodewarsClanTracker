import { useEffect, useMemo, useState } from 'react';
import { useUsernameInput } from '../../hooks';
import type { FailureResponse, PublicScrapedUser, RankInfo, SuccessResponse } from '../../types';
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
  const [username, setUsername, usernameInput] = useUsernameInput();
  const [user, setUser] = useState<(CodewarsAPIUser & PublicScrapedUser) | null>(null);

  useEffect(() => {
    if (!username) return;
    const timeout = setTimeout(async () => {
      const data: CodewarsAPIUser | CodewarsAPIFailure = await fetch(
        'https://www.codewars.com/api/v1/users/' + username,
      ).then(response => response.json());
      if ('success' in data) return alert(data.reason);

      const myData: SuccessResponse<PublicScrapedUser> | FailureResponse = await fetch(
        '/api/user?username=' + username,
      ).then(response => response.json());
      if (!myData.success) return alert(myData.message);

      setUser({ ...data, ...myData.data });
    }, 1000);

    return () => clearTimeout(timeout);
  }, [username]);

  const inCorrectClan = useMemo(() => user?.clan === '#100Devs - leonnoel.com/twitch', [user]);
  return (
    <>
      {usernameInput}
      {user ? (
        <table>
          <tbody>
            <tr>
              <td>Image</td>
              <td>
                <img src={user.profileImageURL} alt={`${user.username} avatar`} />
              </td>
            </tr>
            <tr>
              <td>Username</td>
              <td>{user.username}</td>
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
              <td>{user.skills.length ? user.skills.join(', ') : 'None'}</td>
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
      ) : null}
    </>
  );
}

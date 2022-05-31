import fs from 'fs';
import { JSDOM } from 'jsdom';

import { rankNameToNumber } from '../../shared';

import type { NextApiRequest, NextApiResponse } from 'next';
import type {
  UserStats,
  ProgressStats,
  FailureResponse,
  SuccessResponse,
  PublicScrapedUser,
  ProfileKey,
} from '../../types';
import { generateNewHallData, getDailyClanTimes } from '../../helpers';

const SHORT_MONTHS = Array.from({ length: 12 }, (_, i) =>
  new Date(0, i).toLocaleString(undefined, { month: 'short' }).toLowerCase(),
);

interface RawUserStats {
  Profiles: Record<ProfileKey, string>;
  Name: string;
  Clan: string;
  'Member Since': number;
  'Last Seen': number;
  Following: number;
  Followers: number;
  Allies: number;
}

interface RawProgressStats {
  Rank: number;
  Honor: number;
  'Leaderboard Position'?: number;
  'Honor Percentile'?: number;
  'Total Completed Kata': number;
  'Total Languages Trained': number;
  'Highest Trained': { languageName: string; rank: number };
  'Most Recent': string;
}

function parseUserStatValue(key: keyof RawUserStats, value: ChildNode) {
  switch (key) {
    case 'Profiles':
      return [...(value as HTMLElement).querySelectorAll('a')].reduce(
        (links, anchor) => ({
          ...links,
          [anchor.querySelector('i')!.className.split('-').at(-1) as ProfileKey]: anchor.href,
        }),
        {} as Record<ProfileKey, string>,
      );
    case 'Member Since':
    case 'Last Seen':
      const [month, year] = value.textContent!.split(' ');
      return new Date(+year, SHORT_MONTHS.indexOf(month.toLowerCase())).getTime();
    case 'Following':
    case 'Followers':
    case 'Allies':
      return +value.textContent!.replace(/,/g, '')!;
    default:
      return value.textContent!.trim();
  }
}

function parseUserStats(document: Document): UserStats {
  const {
    'Last Seen': lastSeen,
    'Member Since': memberSince,
    Allies: allyCount,
    Followers: followerCount,
    Following: followingCount,
    Clan: clan,
    Name: name,
    Profiles: profiles,
  } = [...document.querySelectorAll('.user-profile .stat')]
    .map(stat => [...stat.childNodes])
    .map(([key, value]) => [key.textContent!.trim().replace(/:$/, ''), value] as [keyof RawUserStats, ChildNode])
    .reduce(
      (stats, [key, value]) => ({
        ...stats,
        [key]: parseUserStatValue(key, value),
      }),
      {} as RawUserStats,
    );
  return { lastSeen, memberSince, allyCount, followerCount, followingCount, clan, name, profiles };
}

function parseProgressStatValue(key: keyof RawProgressStats, value: ChildNode) {
  switch (key) {
    case 'Rank':
      return rankNameToNumber(value.textContent!);
    case 'Highest Trained':
      const [name, rank] = value.textContent!.split(/\s(.*)/);
      return { name, rank: rankNameToNumber(rank.split('(')[1].split(')')[0]!) };
    case 'Honor Percentile':
      return parseFloat(value.textContent!.split(' ')[1]);
    case 'Leaderboard Position':
      return +value.textContent!.slice(1).replace(/,/g, '');
    case 'Honor':
    case 'Total Languages Trained':
    case 'Total Completed Kata':
      return +value.textContent!.replace(/,/g, '');
    default:
      return value.textContent!.trim();
  }
}

function parseProgressStats(parent: Element): ProgressStats {
  const {
    Rank: overallRank,
    Honor: honor,
    'Leaderboard Position': leaderboardPosition,
    'Honor Percentile': honorPercentile,
    'Total Completed Kata': completedKataCount,
    'Total Languages Trained': trainedLanguageCount,
    'Highest Trained': highestLanguageTrained,
    'Most Recent': mostRecentLanguageTrained,
  } = [...parent.querySelectorAll('.stat')]
    .map(stat => [...stat.childNodes])
    .map(([key, value]) => [key.textContent!.trim().replace(/:$/, ''), value] as [keyof RawProgressStats, ChildNode])
    .reduce(
      (stats, [key, value]) => ({
        ...stats,
        [key]: parseProgressStatValue(key, value),
      }),
      {} as RawProgressStats,
    );

  return {
    overallRank,
    honor,
    global: { leaderboardPosition, honorPercentile },
    completedKataCount,
    trainedLanguageCount,
    highestLanguageTrained,
    mostRecentLanguageTrained,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FailureResponse | SuccessResponse<PublicScrapedUser>>,
) {
  const username = req.query.username as string;
  if (!username) return res.status(400).json({ success: false, message: 'Username Missing ' });
  return fetch('https://www.codewars.com/users/' + username)
    .then(response => {
      if (response.status === 404) return;
      return response.text();
    })
    .then(async html => {
      if (!html) return res.status(200).send({ success: false, message: 'Username not found' });

      const jsdom = new JSDOM(html);
      const profileImageURL = (jsdom.window.document.querySelector('.profile-pic img') as HTMLImageElement)!.src;

      const achievements = [];
      const hallData = await generateNewHallData(await getDailyClanTimes());
      // @ts-ignore
      for (const period in hallData) {
        // @ts-ignore
        for (const when in hallData[period]) {
          // @ts-ignore
          for (const type in hallData[period][when]) {
            // @ts-ignore
            const placedIndex = hallData[period][when][type].findIndex(user => user.username === username);
            if (placedIndex !== -1) achievements.push({ period, type, placedIndex });
          }
        }
      }

      return res.status(200).send({
        success: true,
        data: {
          ...parseUserStats(jsdom.window.document),
          ...parseProgressStats(jsdom.window.document.querySelector('.stat-category')!),
          profileImageURL,
          username,
          // @ts-ignore
          achievements,
        },
      });
    });
}

import fs from 'fs';
import path from 'path';

const HONOR_FOR_KATAS_BY_RANK: Record<string, number> = {
  '8 kyu': 0,
  '7 kyu': 0,
  '6 kyu': 6,
  '5 kyu': 6,
  '4 kyu': 30,
  '3 kyu': 30,
  '2 kyu': 126,
  '1 kyu': 126,
  Beta: 2,
};

const SCORE_FOR_KATAS_BY_RANK: Record<string, number> = {
  '8 kyu': 2,
  '7 kyu': 3,
  '6 kyu': 8,
  '5 kyu': 21,
  '4 kyu': 55,
  '3 kyu': 149,
  '2 kyu': 404,
  '1 kyu': 1097,
  Beta: 0,
};

const RANK_HONOR_REWARDS: Record<string, number> = {
  '8 kyu': 0,
  '7 kyu': 20,
  '6 kyu': 30,
  '5 kyu': 45,
  '4 kyu': 70,
  '3 kyu': 100,
  '2 kyu': 150,
  '1 kyu': 225,
  '1 dan': 450,
  '2 dan': 900,
  '3 dan': 1_800,
  '4 dan': 3_200,
  '5 dan': 6_400,
  '6 dan': 12_800,
};

const SCORE_TO_REACH_RANK: Record<string, number> = {
  '8 kyu': 0,
  '7 kyu': 20,
  '6 kyu': 76,
  '5 kyu': 229,
  '4 kyu': 643,
  '3 kyu': 1_768,
  '2 kyu': 4_829,
  '1 kyu': 13_147,
  '1 dan': 35_759,
  '2 dan': 97_225,
};

interface MinimalKata {
  id: string;
  name: string;
  slug: string;
  completedLanguages: string[];
  completedAt: number;
}

interface MiniUser {
  username: string;
  url: string;
}

interface RankInfo {
  id: number;
  name: string;
  color: string;
}

interface FullKata {
  id: string;
  name: string;
  slug: string;
  category: string;
  publishedAt: number;
  approvedAt: number;
  languages: string[];
  url: string;
  rank: RankInfo;
  createdAt: number;
  createdBy: MiniUser;
  approvedBy: MiniUser;
  description: string;
  totalAttempts: number;
  totalCompleted: number;
  totalStarts: number;
  voteScore: number;
  tags: string[];
  contributorsWanted: boolean;
  unresolved: Record<'issues' | 'suggestions', number>;
}

interface CodewarsAPIError {
  success: false;
  reason: string;
}

const KATA_INFO_MEMORY_CACHE: Record<string, FullKata | CodewarsAPIError> = {};

const DIRECTORY_CONTENTS: Record<string, Set<string>> = {};
async function existsInDirectory(absolute: string, filename: string) {
  if (!(absolute in DIRECTORY_CONTENTS)) DIRECTORY_CONTENTS[absolute] = new Set(await fs.promises.readdir(absolute));
  return DIRECTORY_CONTENTS[absolute].has(filename);
}

const CACHE_DIR = path.join('..', 'cache');

async function fetchKataInfo(id: string): Promise<FullKata | CodewarsAPIError> {
  if (id in KATA_INFO_MEMORY_CACHE) return KATA_INFO_MEMORY_CACHE[id];

  const filename = `kata-${id}.json`;
  const cachePath = path.join(CACHE_DIR, filename);
  if (await existsInDirectory(CACHE_DIR, filename)) {
    const info = JSON.parse((await fs.promises.readFile(cachePath)).toString());
    KATA_INFO_MEMORY_CACHE[id] = info;
    return info;
  }
  return fetch('https://www.codewars.com/api/v1/code-challenges/' + id)
    .then((response: any) => response.json())
    .then((info: FullKata) => {
      return fs.promises.writeFile(cachePath, JSON.stringify(info, null, '  ')).then(() => info);
    });
}


async function getCompletedKatas(username: string, when: number = Date.now()): Promise<MinimalKata[]> {
  const filename = `completed-by-${encodeURIComponent(username)}.json`;
  const cachePath = path.join(CACHE_DIR, filename);
  if (await existsInDirectory(CACHE_DIR, filename)) {
    const { when: whenCached, completedKatas } = JSON.parse((await fs.promises.readFile(cachePath)).toString());
    if (when <= whenCached) return completedKatas;
  }

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
  return fs.promises
    .writeFile(cachePath, JSON.stringify({ when, completedKatas }, null, '  '))
    .then(() => completedKatas);
}

export async function calculateHonorAndScoreAtTime(username: string, when: number = Date.now()) {
  const completedKatas = await getCompletedKatas(username, when);
  const consideringKatas = completedKatas.filter(kata => kata.completedAt <= when);

  let score = 0;
  let honor = 0;

  const honorByRank: Record<string, { count: number; honor: number }> = {};
  let completed = 0;
  let failed = [];
  for (const kata of consideringKatas) {
    //process.stdout.write(((i / consideringKatas.length) * 100).toFixed(2) + '      \r');
    const info = await fetchKataInfo(kata.id);
    if ('success' in info) {
      //console.error(info.reason);
      completed++;
      failed.push(kata.id);
      continue;
    }
    const rn = info.rank.name || 'Beta';
    completed++;
    if (!(rn in honorByRank)) honorByRank[rn] = { count: 0, honor: 0 };
    const count = HONOR_FOR_KATAS_BY_RANK[info.rank.name || 'Beta']!;
    honorByRank[rn].count += 1;
    honorByRank[rn].honor += count;

    honor += count;
    score += SCORE_FOR_KATAS_BY_RANK[info.rank.name || 'Beta']!;

    if (info.rank.name === 'Beta') honor++;
  }

  let rank = '';
  for (const [possibleRank, scoreNeeded] of Object.entries(SCORE_TO_REACH_RANK)) {
    if (score < scoreNeeded) continue;
    rank = possibleRank;
    honor += RANK_HONOR_REWARDS[rank]!;
  }

  honor += completed * 2;

  return { score, honor, rank };
}

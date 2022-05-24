import fs from 'fs';
import path from 'path';

import cacheData from 'memory-cache';

import type { NextApiRequest, NextApiResponse } from 'next';

function getNearest(to: number, others: number[]) {
  let nearest = Infinity;
  for (const time of others) {
    if (Math.abs(time - to) < Math.abs(nearest - to)) nearest = time;
  }
  return nearest;
}
interface HonorUser {
  username: string;
  honor: number;
  honorChange: number;
}
type Top3 = HonorUser[];

interface UserClanInfo {
  username: string;
  honor: number;
  clan: string;
}

const JSON_CACHE: Record<string, any> = {};

const readJSONFile = async (filepath: string) => {
  if (!(filepath in JSON_CACHE)) JSON_CACHE[filepath] = JSON.parse((await fs.promises.readFile(filepath)).toString());
  return JSON_CACHE[filepath];
};

const statsToUserMap = async (time: number): Promise<Record<string, UserClanInfo>> => {
  let userMap: Record<string, UserClanInfo> = {};
  for (const user of await readJSONFile(path.join(process.env.DAILY_CLAN_DIRECTORY!, time + '.json'))) {
    userMap[user.username] = user;
  }
  return userMap;
};

const flattenDate = (input: any) => {
  const date = new Date(input);
  date.setUTCHours(0);
  date.setUTCMinutes(0);
  date.setUTCSeconds(0);
  date.setUTCMilliseconds(0);
  return date;
};

const getUsersWithHonorChanges = async (start: number, end: number, times: number[]) => {
  const before = await statsToUserMap(getNearest(start, times));
  const after = await statsToUserMap(getNearest(end, times));
  return Object.values(after)
    .filter(user => before[user.username]?.honor && after[user.username]?.honor)
    .map(user => ({ ...user, honorChange: after[user.username].honor - before[user.username].honor }))
    .filter(u => u.honorChange)
    .sort((a, b) => b.honorChange - a.honorChange);
};

const trimUser = ({ username, honor, honorChange }: any) => ({ username, honor, honorChange });

export async function generateNewCalendarData(times: number[]) {
  const end = times.at(-1)!;

  const months: Record<number, Top3> = {};

  const monthStart = flattenDate(times[0]);
  monthStart.setUTCDate(1);
  let current = monthStart.getTime();
  while (current < end) {
    const nextMonth = new Date(current);
    nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
    months[current] = (await getUsersWithHonorChanges(current, nextMonth.getTime(), times)).map(trimUser);
    current = nextMonth.getTime();
  }

  const weeks: Record<number, Top3> = {};

  const weekStart = flattenDate(times[0]);
  weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());
  current = weekStart.getTime();
  while (current < end) {
    weeks[current] = (await getUsersWithHonorChanges(current, current + 86400000 * 7, times)).map(trimUser);
    current += 86400000 * 7;
  }

  const days: Record<number, Top3> = {};
  current = times[0];
  while (current < end) {
    days[current] = (await getUsersWithHonorChanges(current, current + 86400000, times)).map(trimUser);
    current += 86400000;
  }

  const response = { days, months, weeks };
  return response;
}

export const getDailyClanTimes = async () =>
  (await fs.promises.readdir(process.env.DAILY_CLAN_DIRECTORY!))
    .filter(filename => filename.endsWith('.json'))
    .sort()
    .map(filename => +filename.split('.')[0]);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const times = await getDailyClanTimes();

  const cacheKey = JSON.stringify(times);
  const cached = cacheData.get(cacheKey);
  if (cached) return res.send(cached);

  const data = await generateNewCalendarData(times);
  cacheData.put(cacheKey, data);
  return res.send(data);
}

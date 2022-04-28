import fs from 'fs';

import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';

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

const statsToUserMap = async (time: number): Promise<Record<string, UserClanInfo>> =>
  (await readJSONFile(path.join(process.env.DAILY_CLAN_DIRECTORY!, time + '.json'))).reduce(
    (map: any, user: any) => ({ ...map, [user.username]: user }),
    {},
  );

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

const CACHED_RESPONSE = fs.existsSync('./cache/calendar.json')
  ? JSON.parse(fs.readFileSync('./cache/calendar.json').toString())
  : { times: [], response: null, started: false };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (CACHED_RESPONSE.started) {
    console.log('Waiting for previous request to finish...');
    while (CACHED_RESPONSE.started) await new Promise(resolve => setTimeout(resolve, 5000));
  }

  const filenames = (await fs.promises.readdir(process.env.DAILY_CLAN_DIRECTORY!)).sort().slice(1);
  const times = filenames.map(filename => +filename.split('.')[0]);

  if (JSON.stringify(times) === JSON.stringify(CACHED_RESPONSE.times)) return res.send(CACHED_RESPONSE.response);
  console.log('Generating new data...');

  const end = times.at(-1)!;

  CACHED_RESPONSE.started = true;
  try {
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
    CACHED_RESPONSE.times = times;
    CACHED_RESPONSE.response = response;
    return res.send(response);
  } catch (err) {
    console.error(err);
    return res.status(500).send(err);
  } finally {
    CACHED_RESPONSE.started = false;
    await fs.promises.writeFile('./cache/calendar.json', JSON.stringify(CACHED_RESPONSE, null, '  '));
  }
}

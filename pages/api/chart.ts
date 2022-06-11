import type { NextApiRequest, NextApiResponse } from 'next';
import cacheData from 'memory-cache';
import { getAllUsersWithHonorChanges, getDailyClanTimes, Top3, trimUser } from '../../helpers';
import { dateToYYYYMMDD } from '../../shared';

async function generateChartDay(start: number, end: number, times: number[], usernames: string[]) {
  const allUsers = (await getAllUsersWithHonorChanges(start, end, times)).filter(user =>
    usernames.includes(user.username),
  );
  const trimmed = allUsers.map(({ honor, honorChange, username }) => ({ honor, honorChange, username }));
  const obj: Record<string, any> = {};
  for (const user of trimmed) {
    obj[user.username] = user;
		// @ts-ignore
		delete user.username
  }
  return obj;
}

async function generateChartData(times: number[], start: number, end: number, usernames: string[]) {
  const points = [];
	let current = start - 86400000;
  while (current !== end + 86400000) {
    const point = await generateChartDay(current, current + 86400000, times, usernames);
		point.name = dateToYYYYMMDD(new Date(current));
		points.push(point);
    current += 86400000;
  }
  return points;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { start, end, usernames } = JSON.parse(req.body);
  usernames.sort();

  const times = await getDailyClanTimes();
  const cacheKey = 'chart-' + JSON.stringify({ times, start, end, usernames });
  const cached = cacheData.get(cacheKey);
  if (cached) return res.send(cached);

  const data = await generateChartData(times, start, end, usernames);
  cacheData.put(cacheKey, data);
  return res.send(data);
}

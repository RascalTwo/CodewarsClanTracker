import cacheData from 'memory-cache';

import type { NextApiRequest, NextApiResponse } from 'next';
import { flattenDate, getAllUsersWithHonorChanges, getDailyClanTimes, Top3, trimUser } from '../../helpers';

const getHallUsers = async (start: number, end: number, times: number[]) => {
  const allUsers = await getAllUsersWithHonorChanges(start, end, times);
  const change = allUsers.slice(0, 10).map(trimUser);
  const honor = allUsers
    .sort((a, b) => b.honor - a.honor)
    .slice(0, 10)
    .map(trimUser);
  return { honor, change };
};

async function generateNewHallData(times: number[]) {
  const end = times.at(-1)!;

  const months: Record<number, { honor: Top3; change: Top3 }> = {};

  const monthStart = flattenDate(times[0]);
  monthStart.setUTCDate(1);
  let current = monthStart.getTime();
  while (current < end) {
    const nextMonth = new Date(current);
    nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
    months[current] = await getHallUsers(current, nextMonth.getTime(), times);
    current = nextMonth.getTime();
  }

  const weeks: Record<number, { honor: Top3; change: Top3 }> = {};

  const weekStart = flattenDate(times[0]);
  weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());
  current = weekStart.getTime();
  while (current < end) {
    weeks[current] = await getHallUsers(current, current + 86400000 * 7, times);
    current += 86400000 * 7;
  }

  const days: Record<number, { honor: Top3; change: Top3 }> = {};
  current = times[0];
  while (current < end) {
    days[current] = await getHallUsers(current, current + 86400000, times);
    current += 86400000;
  }

  const response = { days, months, weeks };
  return response;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const times = await getDailyClanTimes();

  const cacheKey = 'hall-' + JSON.stringify(times);
  const cached = cacheData.get(cacheKey);
  if (cached) return res.send(cached);

  const data = await generateNewHallData(times);
  cacheData.put(cacheKey, data);
  return res.send(data);
}

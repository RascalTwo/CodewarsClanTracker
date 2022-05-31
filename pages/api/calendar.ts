import cacheData from 'memory-cache';

import type { NextApiRequest, NextApiResponse } from 'next';
import { generateNewCalendarData, getDailyClanTimes } from '../../helpers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const times = await getDailyClanTimes();

  const cacheKey = 'calendar-' + JSON.stringify(times);
  const cached = cacheData.get(cacheKey);
  if (cached) return res.send(cached);

  const data = await generateNewCalendarData(times);
  cacheData.put(cacheKey, data);
  return res.send(data);
}

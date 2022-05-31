import cacheData from 'memory-cache';

import type { NextApiRequest, NextApiResponse } from 'next';
import { flattenDate, generateNewHallData, getAllUsersWithHonorChanges, getDailyClanTimes, Top3, trimUser } from '../../helpers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const times = await getDailyClanTimes();

  const cacheKey = 'hall-' + JSON.stringify(times);
  const cached = cacheData.get(cacheKey);
  if (cached) return res.send(cached);

  const data = await generateNewHallData(times);
  cacheData.put(cacheKey, data);
  return res.send(data);
}

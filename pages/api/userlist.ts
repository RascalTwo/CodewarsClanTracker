import cacheData from 'memory-cache';

import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import { getDailyClanTimes, readJSONFile } from '../../helpers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const times = await getDailyClanTimes();
  const cacheKey = JSON.stringify(times);
  const cached = cacheData.get('userlist-' + cacheKey);
  if (cached) return res.status(200).send(cached);

  const usernameSet = new Set();
  for (const time of times) {
    for (const user of await readJSONFile(path.join(process.env.DAILY_CLAN_DIRECTORY!, time + '.json'))) {
      usernameSet.add(user.username);
    }
  }
  const usernames = [...usernameSet];
  cacheData.put(cacheKey, usernames);
  return res.status(200).send(usernames);
}

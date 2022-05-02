import fs from 'fs';

import cacheData from 'memory-cache';
import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';

function getNearest(to: number, others: number[]) {
  let nearest = Infinity;
  for (const time of others) {
    if (Math.abs(time - to) < Math.abs(nearest - to)) nearest = time;
  }
  return nearest;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = +req.query.start!;
  const endTime = +req.query.end! + 86400000;
  const cacheKey = `${startTime}-${endTime}`;
  const cached = cacheData.get(cacheKey);
  if (cached) return res.send(cached);

  const filenames = (await fs.promises.readdir(process.env.DAILY_CLAN_DIRECTORY!))
    .filter(filename => filename.endsWith('.json'))
    .sort();
  const times = filenames.map(filename => +filename.split('.')[0]);
  const startFilename = getNearest(startTime, times);
  const endFilename = getNearest(endTime, times);
  const payload = {
    start: JSON.parse(
      (await fs.promises.readFile(path.join(process.env.DAILY_CLAN_DIRECTORY!, startFilename + '.json'))).toString(),
    ),
    end: JSON.parse(
      (await fs.promises.readFile(path.join(process.env.DAILY_CLAN_DIRECTORY!, endFilename + '.json'))).toString(),
    ),
  };
  cacheData.put(cacheKey, payload, 60000);
  return res.send(payload);
}

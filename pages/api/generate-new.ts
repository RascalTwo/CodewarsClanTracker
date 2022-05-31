import type { NextApiRequest, NextApiResponse } from 'next';
import childProcess from 'child_process';

import { generateNewCalendarData, getDailyClanTimes } from '../../helpers';

const { COMMAND_DOWNLOAD_NEW_CLAN_STATS } = process.env;
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!COMMAND_DOWNLOAD_NEW_CLAN_STATS) return res.status(500).send('Manual data generation disabled');
  const password = req.body;
  if (password !== process.env.PASSWORD) return res.status(403).send('Invalid Password!');

  const downloader = childProcess.exec(COMMAND_DOWNLOAD_NEW_CLAN_STATS);
  downloader.stdout!.pipe(process.stdout);
  downloader.stderr!.pipe(process.stderr);
  downloader.on('exit', async () => {
    await generateNewCalendarData(await getDailyClanTimes());
    return res.status(200).send('New Data Generated!');
  });
}

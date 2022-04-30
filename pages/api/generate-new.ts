import type { NextApiRequest, NextApiResponse } from 'next';
import childProcess from 'child_process';
import util from 'util';
const exec = util.promisify(childProcess.exec);

import { generateNewCalendarData, getDailyClanTimes } from './calendar';

const { COMMAND_DOWNLOAD_NEW_CLAN_STATS } = process.env;
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!COMMAND_DOWNLOAD_NEW_CLAN_STATS) return res.status(500).send('Manual data generation disabled');
  const password = req.body;
  if (password !== process.env.PASSWORD) return res.status(403).send('Invalid Password!');

	// TODO - depromisify, output stdout & stderr as it's generated
  const { stdout, stderr } = await exec(COMMAND_DOWNLOAD_NEW_CLAN_STATS);
  console.log(stdout);
  console.log(stderr);
  await generateNewCalendarData(await getDailyClanTimes());
  return res.status(200).send('New Data Generated!');
}

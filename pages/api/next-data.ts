import type { NextApiRequest, NextApiResponse } from 'next';
import schedule from 'node-schedule';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const job = schedule.scheduleJob('next data', '0 */3 * * *', () => undefined);
  const time = job.nextInvocation().getTime();
  job.cancel();
  return res.status(200).send(time);
}

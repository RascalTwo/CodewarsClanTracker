import fs from 'fs';

import JSZip from 'jszip';

import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import { getDailyClanTimes } from '../../helpers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const times = await getDailyClanTimes();
  const zip = new JSZip();
  for (const time of times) {
    const filepath = path.join(process.env.DAILY_CLAN_DIRECTORY!, time + '.json');
    zip.file(time + '.json', await fs.promises.readFile(filepath));
  }

  res.setHeader('Content-Disposition', 'attachment; filename="data.zip"');
  zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true }).pipe(res);
}

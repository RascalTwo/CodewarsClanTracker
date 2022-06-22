

import type { NextApiRequest, NextApiResponse } from 'next';

const CLAN = '#100Devs - leonnoel.com/twitch';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const response = await fetch(`https://www.codewars.com/api/v1/clans/${encodeURIComponent(CLAN)}/members?page=${req.query.page || 1}`);
	return res.send(await response.json());
}
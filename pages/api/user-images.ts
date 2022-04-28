import fs from 'fs';
import { JSDOM } from 'jsdom';

import type { NextApiRequest, NextApiResponse } from 'next';

const PROFILE_IMAGE_URL_CACHE = fs.existsSync('./cache/profile-images.json')
  ? JSON.parse(fs.readFileSync('./cache/profile-images.json').toString())
  : {};

async function fetchUserProfileImageURL(username: string) {
  return fetch('https://www.codewars.com/users/' + username)
    .then(response => {
      if (response.status === 404) return;
      return response.text();
    })
    .then(html => {
      if (!html) return null;

      return (new JSDOM(html).window.document.querySelector('.profile-pic img') as HTMLImageElement)!.src;
    });
}

async function getUserProfileImageURL(username: string) {
  if (username in PROFILE_IMAGE_URL_CACHE) return PROFILE_IMAGE_URL_CACHE[username];
  const url = await fetchUserProfileImageURL(username);
  if (!url) return null;
  PROFILE_IMAGE_URL_CACHE[username] = url;
  await fs.promises.writeFile('./cache/profile-images.json', JSON.stringify(PROFILE_IMAGE_URL_CACHE, null, '  '));
  return url;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const urls: Record<string, string> = {};
  const { usernames } = JSON.parse(req.body);
  for (const [i, username] of usernames.entries()) {
    process.stdout.write((i / usernames.length * 100).toFixed(2) + '      \r');
    urls[username] = await getUserProfileImageURL(username);
  }
  console.log()
  return res.status(200).send(urls);
}

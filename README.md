# [Codewars Clan Tracker](https://codewars.rascaltwo.com/)

A [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app) displaying in various forms the honor changes of users belonging to the same clan on [Codewars](https://codewars.com)

Currently tightly-coupled with [CodewarScripts](https://github.com/rascaltwo/CodewarScripts), requiring file access to it, configurable via environment variables:

```env
DAILY_CLAN_DIRECTORY=../clan_output/daily
# Path to the `clan_output/daily` directory of CodewarScripts

COMMAND_DOWNLOAD_NEW_CLAN_STATS=cd /CodewarScripts && /path-to-binary-for/node dist/download-clan-stats.js
# Command to download new clan stats

PASSWORD=password-to-request-new-clan-stats
# Password required to request new clan stats manually
```

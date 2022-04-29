import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import { useUsernameInput } from '../../hooks';
import { ChangeText } from '../ChangeText';

interface HonorUser {
  username: string;
  honor: number;
  honorChange: number;
}

const MiniUser = (user: HonorUser & { imageURL?: string }) => {
  return (
    <>
      {user.imageURL ? <img src={user.imageURL} /> : null}
      <Link href={'https://www.codewars.com/users/' + user.username}>{user.username}</Link>
      <ChangeText amount={user.honorChange} />
      <br />
    </>
  );
};
export function Calendar({ defaultStart, defaultEnd }: { defaultStart?: Date; defaultEnd?: Date }) {
  const [username, setUsername, usernameInput] = useUsernameInput();
  const [data, setData] = useState<Record<'days' | 'months' | 'weeks', Record<number, HonorUser[]>>>({
    days: {},
    weeks: {},
    months: {},
  });
  useEffect(() => {
    fetch('/api/calendar')
      .then(response => response.json())
      .then(setData);
  }, []);
  const [profileImageURLs, setProfileImageURLs] = useState<Record<string, string>>({});
  const usernames = useMemo(
    () => new Set(Object.values(data.days).flatMap(info => info.map(user => user.username))),
    [data],
  );
  useEffect(() => {
    const missing = [...usernames].filter(un => !(un in profileImageURLs));
    if (!missing.length) return;
    fetch('/api/user-images', { method: 'POST', body: JSON.stringify({ usernames: missing }) })
      .then(response => response.json())
      .then(newURLs => setProfileImageURLs(curr => ({ ...curr, ...newURLs })));
  }, [usernames, profileImageURLs]);

  const rows = [];
  let current = new Date(defaultStart || Date.now());
  current.setUTCDate(current.getUTCDate() - current.getUTCDay());
  let stop = new Date(defaultEnd || Date.now());
  if (stop.getUTCDay() !== 6) stop.setDate(stop.getUTCDate() + 6 - stop.getUTCDay());
  while (current.toDateString() !== stop.toDateString()) {
    rows.push(new Date(current.getTime()));
    if (current.getUTCDay() === 0) rows.push(new Date(current.getTime()));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  const days: Record<number, Record<string, HonorUser>> = {};
  for (const [epoch, users] of Object.entries(data.days)) {
    const day = new Date(+epoch).getUTCDay();
    if (!(day in days)) days[day] = {};
    for (const user of users) {
      if (!(user.username in days[day])) days[day][user.username] = { ...user };
      else {
        days[day][user.username].honorChange += user.honorChange;
        days[day][user.username].honor + user.honor;
      }
    }
  }
  console.log(days);
  return (
    <>
      {usernameInput}
      <div className="calendar">
        <div>Week</div>
        {Object.entries(days).map(([day, users]) => {
          const userz = Object.values(users)
            .sort((a, b) => b.honorChange - a.honorChange)
            .map((u, i) => [u, i] as [HonorUser, number])
            .filter(([u]) => u.username.toLowerCase().includes(username.toLowerCase()))
            .slice(0, 3)
            .map(([user, i]) => (
              <React.Fragment key={user.username}>
                #{i + 1}{' '}
                <MiniUser key={user.username} {...user} imageURL={!i ? profileImageURLs[user.username] : undefined} />
              </React.Fragment>
            ));
          return (
            <div key={day}>
              {new Date(2017, 0, +day + 1).toLocaleDateString(undefined, { weekday: 'long' })}
              <br />
              <br />
              {userz}
            </div>
          );
        })}
        {rows.map((cell, i) => {
          const isWeek = i % 8 === 0;
          const users = data[isWeek ? 'weeks' : 'days'][cell.getTime()] || [];
          const num = isWeek ? cell.getUTCDate() + ' - ' + (cell.getUTCDate() + 6) : cell.getUTCDate();
          const userz = username
            ? users
                .map((u, i) => [u, i] as [HonorUser, number])
                .filter(([u]) => u.username.toLowerCase().includes(username.toLowerCase()))
                .slice(0, 3)
                .map(([user, i]) => (
                  <React.Fragment key={user.username}>
                    #{i + 1}{' '}
                    <MiniUser
                      key={user.username}
                      {...user}
                      imageURL={!i ? profileImageURLs[user.username] : undefined}
                    />
                  </React.Fragment>
                ))
            : users.slice(0, 3).map((user, i) => (
                <React.Fragment key={user.username}>
                  #{i + 1}{' '}
                  <MiniUser key={user.username} {...user} imageURL={!i ? profileImageURLs[user.username] : undefined} />
                </React.Fragment>
              ));
          return (
            <div key={i}>
              <span>
                {isWeek ? num : num === 1 ? cell.toLocaleDateString(undefined, { month: 'short' }) + ' ' + num : num}
              </span>
              <br />
              <br />
              {userz}
            </div>
          );
        })}
      </div>
    </>
  );
}

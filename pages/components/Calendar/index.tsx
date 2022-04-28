import React, { useEffect, useMemo, useState } from 'react';
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
      {user.username} <ChangeText amount={user.honorChange} />
      <br />
    </>
  );
};
export function Calendar({ start, end }: { start: Date; end: Date }) {
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
  let current = new Date(start);
  current.setUTCDate(current.getUTCDate() - current.getUTCDay());
  let stop = new Date(end);
  if (stop.getUTCDay() !== 6) stop.setDate(stop.getUTCDate() + 6 - stop.getUTCDay());
  while (current.toDateString() !== stop.toDateString()) {
    rows.push(new Date(current.getTime()));
    if (current.getUTCDay() === 0) rows.push(new Date(current.getTime()));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  const [unFilter, setUnFilter] = useState('');
  return (
    <>
      <input placeholder="Username" value={unFilter} onChange={e => setUnFilter(e.currentTarget.value)} />

      <div className="calendar">
        <div>Week</div>
        <div>Sunday</div>
        <div>Monday</div>
        <div>Tuesday</div>
        <div>Wednesday</div>
        <div>Thursday</div>
        <div>Friday</div>
        <div>Saturday</div>
        {rows.map((cell, i) => {
          const isWeek = i % 8 === 0;
          const users = data[isWeek ? 'weeks' : 'days'][cell.getTime()] || [{ username: '', honorChange: 0 }];
          const num = isWeek ? cell.getUTCDate() + ' - ' + (cell.getUTCDate() + 6) : cell.getUTCDate();
          const userz = unFilter
            ? users
                .map((u, i) => [u, i] as [HonorUser, number])
                .filter(([u]) => u.username.toLowerCase().includes(unFilter.toLowerCase()))
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
              <span>{num}</span>
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

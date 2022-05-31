import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import { useUsernameInput } from '../../hooks';
import { dateToYYYYMMDD, getWeekNumber } from '../../shared';
import ChangeText from '../ChangeText';
import LoadingIndicator from '../LoadingIndicator';

interface HonorUser {
  username: string;
  honor: number;
  honorChange: number;
}

const MiniUser = (user: HonorUser & { imageURL?: string }) => {
  return (
    <>
      {user.imageURL ? <img src={user.imageURL} alt={`${user.username} avatar`} /> : null}
      <Link href={'https://www.codewars.com/users/' + user.username}>{user.username}</Link>
      <ChangeText amount={user.honorChange} />
      <br />
    </>
  );
};

export default function Calendar() {
  const [loading, setLoading] = useState(true);
  const [username, setUsername, usernameInput] = useUsernameInput('Filter by Username');
  const [data, setData] = useState<Record<'days' | 'months' | 'weeks', Record<number, HonorUser[]>>>({
    days: {},
    weeks: {},
    months: {},
  });
  useEffect(() => {
    setLoading(true);
    fetch('/api/calendar')
      .then(response => response.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);
  const [profileImageURLs, setProfileImageURLs] = useState<Record<string, string>>({});
  const usernames = useMemo(
    () => new Set(Object.values(data.days).flatMap(info => info.map(user => user.username))),
    [data],
  );
  useEffect(() => {
    const missing = [...usernames].filter(un => !(un in profileImageURLs));
    if (!missing.length) return;
    setLoading(true);
    fetch('/api/user-images', { method: 'POST', body: JSON.stringify({ usernames: missing }) })
      .then(response => response.json())
      .then(newURLs => setProfileImageURLs(curr => ({ ...curr, ...newURLs })))
      .finally(() => setLoading(false));
  }, [usernames, profileImageURLs]);

  const rows = useMemo(() => {
    const rows = [];
    let current = new Date(
      Object.keys(data.days).length ? Math.min(...Object.keys(data.days).map(Number)) : Date.now(),
    );
    current.setUTCDate(current.getUTCDate() - current.getUTCDay());

    let stop = new Date(Date.now() + 86400000);
    if (stop.getUTCDay() !== 6) stop.setUTCDate(stop.getUTCDate() + 6 - stop.getUTCDay());
    while (current.toDateString() !== stop.toDateString()) {
      rows.push(new Date(current.getTime()));
      if (current.getUTCDay() === 0) rows.push(new Date(current.getTime()));
      current.setUTCDate(current.getUTCDate() + 1);
    }
    return rows;
  }, [data.days]);

  const days = useMemo(() => {
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
    return days;
  }, [data.days]);
  return (
    <>
      {usernameInput}
      <LoadingIndicator loading={loading} />
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
          const num = isWeek ? '#' + getWeekNumber(cell) : cell.getUTCDate();
          const isMonth = num === 1 || i === 1;
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

          const startDate = (() => {
            if (isMonth) {
              const firstOfMonth = new Date(cell);
              firstOfMonth.setUTCDate(1);
              return firstOfMonth;
            }
            return cell;
          })();

          const endDate = (() => {
            if (isWeek) {
              const nextWeek = new Date(cell);
              nextWeek.setUTCDate(nextWeek.getUTCDate() + 6);
              return nextWeek;
            }
            if (isMonth) {
              const nextMonth = new Date(cell);
              nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
              nextMonth.setUTCDate(1);
              return nextMonth;
            }
            return cell;
          })();

          return (
            <div key={i}>
              <Link href={`/leaderboard?start=${dateToYYYYMMDD(startDate)}&end=${dateToYYYYMMDD(endDate)}`}>
                <a>
                  {isWeek ? num : isMonth ? cell.toLocaleDateString(undefined, { month: 'short' }) + ' ' + num : num}
                </a>
              </Link>
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

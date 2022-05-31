import Link from 'next/link';
import { useRouter } from 'next/router';
import { ChangeEventHandler, FormEventHandler, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useUsernameInput } from '../../hooks';
import { dateToYYYYMMDD, rankNameToNumber } from '../../shared';
import ChangeText from '../ChangeText';
import RankBadge from '../RankBadge';
import styles from './Loaderboard.module.css';

const RANK_STYLES = [
  {
    rank: -8,
    name: '8 kyu',
    color: 'white',
  },
  {
    name: '7 kyu',
    color: 'white',
    rank: -7,
  },
  {
    rank: -6,
    name: '6 kyu',
    color: 'yellow',
  },
  {
    rank: -5,
    name: '5 kyu',
    color: 'yellow',
  },
  {
    rank: -4,
    name: '4 kyu',
    color: 'blue',
  },
  {
    rank: -3,
    name: '3 kyu',
    color: 'blue',
  },
  {
    rank: -2,
    name: '2 kyu',
    color: 'purple',
  },
  {
    rank: -1,
    name: '1 kyu',
    color: 'purple',
  },
];

interface LeaderboardUser {
  rank: string;
  username: string;
  honor: number;
}

export default function Leaderboard() {
  const router = useRouter();
  const [username, setUsername, usernameInput] = useUsernameInput('Filter by Username');
  const [users, setUsers] = useState<{ start: LeaderboardUser[]; end: LeaderboardUser[] }>({ start: [], end: [] });

  const [loading, setLoading] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [pageNumber, setPageNumber] = useState(1);
  const honorChanges = useMemo(
    () =>
      Object.values(users.end)
        .filter(
          user =>
            users.start.find(u => u.username === user.username)?.honor &&
            users.end.find(u => u.username === user.username)?.honor,
        )
        .map(user => ({
          ...user,
          honorChange:
            users.end.find(u => u.username === user.username)!.honor -
            users.start.find(u => u.username === user.username)!.honor,
        }))
        .filter(u => u.honorChange)
        .sort((a, b) => b.honorChange - a.honorChange),
    [users],
  );

  const form = useRef<HTMLFormElement>(null);

  const [sortingKey, setSortingKey] = useState<'honor' | 'change'>(
    (router.query.sortBy as 'honor' | 'change') || 'honor',
  );
  const showingUsers = useMemo(() => {
    const filtered = users.end.filter(u => (u.username || '').toLowerCase().includes(username.toLowerCase()));
    return sortingKey === 'honor'
      ? filtered.sort((a, b) => b.honor - a.honor)
      : filtered.sort((a, b) => {
          const ah = honorChanges.find(u => u.username === a.username)?.honorChange || 0;
          const bh = honorChanges.find(u => u.username === b.username)?.honorChange || 0;
          return bh - ah;
        });
  }, [users, sortingKey, honorChanges, username]);

  const today = useMemo(() => {
    const today = new Date();
    today.setUTCHours(0);
    today.setUTCMinutes(0);
    today.setUTCSeconds(0);
    today.setUTCMilliseconds(0);
    return today;
  }, []);

  const getData = useCallback(
    (start: Date = today, end: Date = today) => {
      setLoading(true);
      fetch(`/api/leaderboard?start=${start.getTime()}&end=${end.getTime()}`)
        .then(r => r.json())
        .then(setUsers)
        .finally(() => setLoading(false));
    },
    [today],
  );

  const [defaultStart, defaultEnd] = useMemo(() => {
    let start = new Date((router.query.start as string) || '');
    let end = new Date((router.query.end as string) || '');
    if (isNaN(start.getTime())) start = end;
    if (isNaN(end.getTime())) end = start;
    if (isNaN(start.getTime())) start = end = today;

    return [dateToYYYYMMDD(start), dateToYYYYMMDD(end)];
  }, [router.query.end, router.query.start, today]);

  const getInputDates: () => [Date, Date] = useCallback(() => {
    if (!form.current) return [today, today];
    const start = form.current!.elements[1] as HTMLInputElement;
    const end = form.current!.elements[2] as HTMLInputElement;
    if (!start.value) start.value = end.value;
    if (!end.value) end.value = start.value;
    if (!start.value) {
      start.value = defaultStart;
      end.value = defaultEnd;
    }

    return [new Date(start.value), new Date(end.value)];
  }, [defaultEnd, defaultStart, today]);

  useEffect(() => {
    getData(...getInputDates());
  }, [getData, getInputDates]);

  const pagedUsers = useMemo(() => {
    const startIndex = (pageNumber - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return showingUsers.slice(startIndex, endIndex);
  }, [pageNumber, rowsPerPage, showingUsers]);

  useEffect(() => {
    if (!pagedUsers.length && pageNumber > 1) setPageNumber(pageNumber - 1);
  }, [pagedUsers, pageNumber]);

  const setInputDates = useCallback((start: Date, end: Date) => {
    (form.current!.elements[1] as HTMLInputElement).value = dateToYYYYMMDD(start);
    (form.current!.elements[2] as HTMLInputElement).value = dateToYYYYMMDD(end);
  }, []);

  return (
    <>
      {usernameInput}
      <form
        style={{ float: 'left' }}
        ref={form}
        onSubmit={
          useCallback(
            e => {
              e.preventDefault();
              getData(...getInputDates());
            },
            [getInputDates, getData],
          ) as FormEventHandler
        }
      >
        <fieldset className={styles.fieldset} disabled={loading}>
          <legend>Comparison Dates</legend>
          <label htmlFor="startDate">Start</label>
          <input id="startDate" type="date" defaultValue={defaultStart}></input>
          <label htmlFor="endDate">End</label>
          <input id="endDate" type="date" defaultValue={defaultEnd}></input>
          <button type="submit">Fetch</button>

          <button
            disabled={loading}
            onClick={useCallback(() => {
              const [start, end] = getInputDates();
              const diff = end.getTime() - start.getTime();
              if (!diff) {
                start.setTime(start.getTime() - 86400000);
                end.setTime(start.getTime());
              } else {
                const temp = start.getTime();
                start.setTime(start.getTime() - diff);
                end.setTime(temp);
              }

              setInputDates(start, end);

              return getData(start, end);
            }, [getData, getInputDates, setInputDates])}
          >
            Previous
          </button>
          <button
            disabled={loading}
            onClick={useCallback(() => {
              const [start, end] = getInputDates();

              const diff = end.getTime() - start.getTime();
              if (!diff) {
                start.setTime(end.getTime() + 86400000);
                end.setTime(start.getTime());
              } else {
                const temp = end.getTime();
                end.setTime(end.getTime() + diff);
                start.setTime(temp);
              }

              setInputDates(start, end);

              return getData(start, end);
            }, [getData, getInputDates, setInputDates])}
          >
            Next
          </button>

          <label htmlFor="sortingBy">Sort By</label>
          <select
            id="sortingBy"
            disabled={loading}
            value={sortingKey}
            onChange={
              useCallback(
                e => setSortingKey(e.currentTarget.value as 'honor' | 'change'),
                [],
              ) as ChangeEventHandler<HTMLSelectElement>
            }
          >
            <option value="honor">Honor</option>
            <option value="change">Honor Change</option>
          </select>
        </fieldset>
      </form>
      <fieldset disabled={loading} className={[styles.fieldset, styles.pagination].join(' ')}>
        <legend>Pagination</legend>

        <label htmlFor="rowsPerPage">Rows</label>
        <input
          id="rowsPerPage"
          type="number"
          value={rowsPerPage}
          onChange={e => setRowsPerPage(+e.currentTarget.value)}
        />

        <label htmlFor="pageNumber">Page #</label>
        <input
          id="pageNumber"
          min="1"
          max={Math.ceil(showingUsers.length / rowsPerPage)}
          type="number"
          value={pageNumber}
          onChange={e => setPageNumber(+e.currentTarget.value)}
        />
      </fieldset>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Position</th>
            <th>Rank</th>
            <th>User</th>
            <th>Honor</th>
          </tr>
        </thead>
        <tbody>
          {pagedUsers.map(curr => {
            const startIndex = users.start.findIndex(u => u.username === curr.username);
            const currentIndex = users.end.findIndex(u => u.username === curr.username);
            const indexChange = startIndex - currentIndex;
            const honorChange = honorChanges.find(u => u.username === curr.username)?.honorChange || 0;
            const rank = RANK_STYLES.find(rank => rank.rank === rankNameToNumber(curr.rank))!;
            return (
              <tr key={curr.username}>
                <td>
                  {currentIndex + 1}{' '}
                  {startIndex === -1 ? (
                    <sup title="User has no data available on the first date" className={styles.questionMark}>
                      ?
                    </sup>
                  ) : (
                    <ChangeText amount={indexChange}></ChangeText>
                  )}
                </td>
                <td>
                  <RankBadge {...rank} score={0} />
                </td>
                <td>
                  <Link href={'https://www.codewars.com/users/' + curr.username}>{curr.username}</Link>
                </td>
                <td>
                  {curr.honor} <ChangeText amount={honorChange}></ChangeText>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot></tfoot>
      </table>
    </>
  );
}

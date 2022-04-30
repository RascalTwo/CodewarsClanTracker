import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import { useUsernameInput } from '../../pages/hooks';
import { rankNameToNumber } from '../../shared';
import ChangeText from '../ChangeText';
import RankBadge from '../RankBadge';

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

function dateToYYYYMMDD(date: Date) {
  return `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${date
    .getUTCDate()
    .toString()
    .padStart(2, '0')}`;
}

const localYYYYMMDDToDate = (yyyymmdd: string) => {
  const [yyyy, mm, dd] = yyyymmdd.split('-').map(Number);
  return new Date(yyyy, mm - 1, dd);
};


export default function Leaderboard() {
  const [username, setUsername, usernameInput] = useUsernameInput();
  const [users, setUsers] = useState<{ start: LeaderboardUser[]; end: LeaderboardUser[] }>({ start: [], end: [] });
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
  const mostHonorable = useMemo(() => {
    let best = 0;
    let bu = users.start[0];
    users.end.forEach((curr, i) => {
      const startI = users.start.findIndex(u => u.username === curr.username);
      const honorChange = startI !== -1 ? curr.honor! - users.start[startI].honor! : 0;
      if (honorChange > best) {
        best = honorChange;
        bu = curr;
      }
    });
    return bu;
  }, [users]);

  const form = useRef<HTMLFormElement>(null);

  const [sortingKey, setSortingKey] = useState<'honor' | 'honorChange'>('honor');
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

  return (
    <>
      {usernameInput}
      <p>{mostHonorable?.username}</p>
      <button
        onClick={() => {
          let startDate = (form.current!.elements[0] as HTMLInputElement).value;
          let endDate = (form.current!.elements[1] as HTMLInputElement).value;
          if (!startDate) startDate = endDate;
          //const sd = localYYYYMMDDToDate(startDate);
          //const ed = localYYYYMMDDToDate(endDate);
          const sd = new Date(startDate);
          const ed = new Date(endDate);

          const diff = ed.getTime() - sd.getTime();
          if (!diff) {
            sd.setTime(sd.getTime() - 86400000);
            ed.setTime(sd.getTime());
          } else {
            const temp = sd.getTime();
            sd.setTime(sd.getTime() - diff);
            ed.setTime(temp);
          }

          (form.current!.elements[0] as HTMLInputElement).value = dateToYYYYMMDD(sd);
          (form.current!.elements[1] as HTMLInputElement).value = dateToYYYYMMDD(ed);
          fetch(`/api/leaderboard?start=${sd.getTime()}&end=${ed.getTime()}`)
            .then(r => r.json())
            .then(data => {
              setUsers(data);
            });
        }}
      >
        Prev
      </button>
      <button
        onClick={() => {
          let startDate = (form.current!.elements[0] as HTMLInputElement).value;
          let endDate = (form.current!.elements[1] as HTMLInputElement).value;
          if (!startDate) startDate = endDate;
          //const sd = localYYYYMMDDToDate(startDate);
          //const ed = localYYYYMMDDToDate(endDate);
          const sd = new Date(startDate);
          const ed = new Date(endDate);

          const diff = ed.getTime() - sd.getTime();

          if (!diff) {
            sd.setTime(ed.getTime() + 86400000);
            ed.setTime(sd.getTime());
          } else {
            const temp = ed.getTime();
            ed.setTime(ed.getTime() + diff);
            sd.setTime(temp);
          }

          (form.current!.elements[0] as HTMLInputElement).value = dateToYYYYMMDD(sd);
          (form.current!.elements[1] as HTMLInputElement).value = dateToYYYYMMDD(ed);
          fetch(`/api/leaderboard?start=${sd.getTime()}&end=${ed.getTime()}`)
            .then(r => r.json())
            .then(data => {
              setUsers(data);
            });
        }}
      >
        Next
      </button>
      <form
        ref={form}
        style={{ display: 'flex', flexDirection: 'column', width: 'max-content', margin: 'auto' }}
        onSubmit={e => {
          e.preventDefault();
          let startDate = (e.currentTarget.elements[0] as HTMLInputElement).value;

          let endDate = (e.currentTarget.elements[1] as HTMLInputElement).value;

          if (!startDate) startDate = endDate;
          //const sd = localYYYYMMDDToDate(startDate);
          //const ed = localYYYYMMDDToDate(endDate);
          const sd = new Date(startDate);
          const ed = new Date(endDate);

          fetch(`/api/leaderboard?start=${sd.getTime()}&end=${ed.getTime()}`)
            .then(r => r.json())
            .then(data => {
              setUsers(data);
            });
        }}
      >
        <label>
          Start
          <input type="date"></input>
        </label>
        <label>
          End
          <input type="date" defaultValue={dateToYYYYMMDD(new Date())}></input>
        </label>
        <button>Fetch</button>
      </form>

      <select value={sortingKey} onChange={e => setSortingKey(e.currentTarget.value as 'honor' | 'honorChange')}>
        <option value="honor">Honor</option>
        <option value="honorChange">Honor Change</option>
      </select>
      <table style={{ margin: 'auto' }}>
        <thead>
          <tr>
            <th>Position</th>
            <th>Rank</th>
            <th>User</th>
            <th>Honor</th>
          </tr>
        </thead>
        <tbody></tbody>
        <tfoot>
          {showingUsers.map(curr => {
            const startI = users.start.findIndex(u => u.username === curr.username);
            const pos = users.end.findIndex(u => u.username === curr.username);
            const change = startI - pos;
            const honorChange = honorChanges.find(u => u.username === curr.username)?.honorChange || 0;
            const rank = RANK_STYLES.find(rank => rank.rank === rankNameToNumber(curr.rank))!;
            if (curr.username === undefined) console.log(curr)
            return (
              <tr key={curr.username}>
                <td>
                  {pos} <ChangeText amount={startI !== -1 ? change : 0}></ChangeText>
                </td>
                <td>
                  <RankBadge {...rank} score={0} />
                </td>
                <td><Link href={'https://www.codewars.com/users/' + curr.username}>{curr.username}</Link></td>
                <td>
                  {curr.honor} <ChangeText amount={honorChange}></ChangeText>
                </td>
              </tr>
            );
          })}
        </tfoot>
      </table>
    </>
  );
}

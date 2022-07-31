import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  ChangeEventHandler,
  CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { LineChart, CartesianGrid, XAxis, YAxis, Line, Tooltip, Legend, Brush } from 'recharts';
import { useUsernameInput } from '../../hooks';
import { dateToYYYYMMDD, flattenDate, rankNameToNumber } from '../../shared';
import ChangeText from '../ChangeText';
import Countup from '../Countup';
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

const ActiveDot = (props: any) => {
  return (
    <>
      <circle
        type="monotone"
        {...props}
        className="recharts-dot recharts-line-dot"
        onMouseOver={() =>
          props.setShowing((showing: string[]) => (showing.includes(props.name) ? showing : [...showing, props.name]))
        }
        onMouseOut={() => props.setShowing((showing: string[]) => showing.filter(s => s !== props.name))}
      ></circle>
    </>
  );
};

const ShowingLegend = (props: { payload?: any[]; showing: string[]; contentStyle?: CSSProperties; label?: string }) => {
  const rendering = props.showing.length
    ? props.payload!.filter(payload => props.showing.includes(payload.name as string))
    : props.payload!;
  if (!rendering) return null;
  return (
    <div style={{ ...props.contentStyle, padding: '0.5rem', border: '1px solid white' }}>
      <span>{props.label}</span>
      <div>
        {rendering
          .sort((a, b) => (b.value! as number) - (a.value! as number))
          .map(payload => (
            // @ts-ignore
            <div key={payload.name!} style={{ color: payload.stroke }}>
              {payload?.name}: {payload.value!}
            </div>
          ))}
      </div>
    </div>
  );
};

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

  const [sortingKey, setSortingKey] = useState<'honor' | 'change' | 'position'>(
    (router.query.sortBy as 'honor' | 'change' | 'position') || 'honor',
  );
  const showingUsers = useMemo(() => {
    const filtered = users.end.filter(u => (u.username || '').toLowerCase().includes(username.toLowerCase()));
    return (sortingKey === 'honor' || sortingKey === 'position')
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
        .then(({ updated, users }) => {
          setUsers(users)
          setLastUpdatedAt(updated);
        })
        .finally(() => setLoading(false));
    },
    [today],
  );

  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  const [defaultStart, defaultEnd] = useMemo(() => {
    let start = new Date((router.query.start as string) || '');
    let end = new Date((router.query.end as string) || '');
    if (isNaN(start.getTime())) start = end;
    if (isNaN(end.getTime())) end = start;
    if (isNaN(start.getTime())) start = end = today;

    return [dateToYYYYMMDD(start), dateToYYYYMMDD(end)];
  }, [router.query.end, router.query.start, today]);

  const [rawStart, setRawStart] = useState(defaultStart);
  const [rawEnd, setRawEnd] = useState(defaultEnd);

  const getInputDates: () => [Date, Date] = useCallback(() => {
    let start = rawStart;
    let end = rawEnd;
    if (!start && end) {
      start = end;
      setRawStart(end);
    }
    if (!end && start) {
      end = start;
      setRawEnd(start);
    }
    if (!start && !end) {
      start = defaultStart;
      setRawStart(defaultStart);
      end = defaultEnd;
      setRawEnd(defaultEnd);
    }

    return [new Date(start), new Date(end)];
  }, [defaultEnd, defaultStart, rawEnd, rawStart]);

  useEffect(() => {
    getData(...getInputDates());
  }, [getData, getInputDates, rawStart, rawEnd]);

  const pagedUsers = useMemo(() => {
    const startIndex = (pageNumber - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return showingUsers.slice(startIndex, endIndex);
  }, [pageNumber, rowsPerPage, showingUsers]);

  useEffect(() => {
    if (!pagedUsers.length && pageNumber > 1) setPageNumber(pageNumber - 1);
  }, [pagedUsers, pageNumber]);

  const setInputDates = useCallback((start: Date, end: Date) => {
    setRawStart(dateToYYYYMMDD(start));
    setRawEnd(dateToYYYYMMDD(end));
  }, []);

  const [graphing, setGraphing] = useState(false);
  const [graphingUsernames, setGraphingUsernames] = useState('');
  const graphedUsernamesSet = useMemo(() => new Set(graphingUsernames.split(',').filter(Boolean)), [graphingUsernames]);
  useEffect(() => {
    if (!graphing) return;
    if (!graphingUsernames)
      setGraphingUsernames(
        pagedUsers
          .slice(0, 10)
          .map(user => user.username)
          .join(','),
      );
  }, [graphingUsernames, setGraphingUsernames, graphing, pagedUsers]);

  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (!graphedUsernamesSet) return;
    fetch('/api/chart', {
      method: 'POST',
      body: JSON.stringify({
        start: new Date(rawStart).getTime(),
        end: new Date(rawEnd).getTime(),
        usernames: [...graphedUsernamesSet],
      }),
    })
      .then(r => r.json())
      .then(setChartData);
  }, [graphedUsernamesSet, rawStart, rawEnd]);

  const [colors, setColors] = useState<Record<string, string>>({});
  useEffect(() => {
    setColors(colors => {
      let added = false;
      let newColors = { ...colors };
      for (const day of chartData) {
        for (const username in day) {
          if (username in newColors) continue;
          newColors[username] = `hsl(${Math.floor(Math.random() * 365)}, 100%, 50%)`;
          added = true;
        }
      }
      return added ? newColors : colors;
    });
  }, [chartData]);

  const [legendUsernames, setLegendUsernames] = useState<string[]>([]);

  const useLiveAPI = useMemo(() => new Date(rawEnd).getTime() >= flattenDate(new Date()).getTime(), [rawEnd]);
  const [liveFetched, setLiveFetched] = useState(false);
  useEffect(() => {
    if (!useLiveAPI || liveFetched || !users.end.length) return;
    let mounted = true;

    (async () => {
      if (!mounted) return;

      const response = await fetch(`/api/codewars-clan-members?page=${1}`);
      const payload: { success: false, reason: string } | {
        totalPages: number,
        totalItems: number,
        data: {
          id: string,
          username: string,
          honor: number,
          rank: number,
        }[],
      } = await response.json();
      if ('success' in payload) return alert(payload.reason);

      const endUsers = users.end.map(user => {
        const newUser = payload.data.find(u => u.username === user.username);
        return newUser ? { ...user, honor: newUser.honor } : user;
      });
      if (mounted) {
        setUsers(({ start: users.start, end: endUsers }));
        setLiveFetched(true);
        setLastUpdatedAt(Date.now());
      }
    })().catch(console.error)
    return () => {
      mounted = false;
    };
  }, [liveFetched, setUsers, useLiveAPI, users])

  return (
    <>
      {lastUpdatedAt ? <p style={{ textAlign: 'center' }}>Last updated: <Countup from={new Date(lastUpdatedAt)} /> </p> : null}
      {usernameInput}
      <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
        <fieldset className={styles.fieldset} disabled={loading}>
          <legend>Comparison Dates</legend>
          <label htmlFor="startDate">Start</label>
          <input id="startDate" type="date" value={rawStart} onChange={e => setRawStart(e.currentTarget.value)}></input>
          <label htmlFor="endDate">End</label>
          <input id="endDate" type="date" value={rawEnd} onChange={e => setRawEnd(e.currentTarget.value)}></input>

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
                e => setSortingKey(e.currentTarget.value as 'honor' | 'change' | 'position'),
                [],
              ) as ChangeEventHandler<HTMLSelectElement>
            }
          >
            <option value="honor">Honor</option>
            <option value="change">Honor Change</option>
            {graphing ? <option value="position">Position</option> : null}
          </select>
        </fieldset>
        <fieldset className={styles.fieldset} style={{ margin: 'auto' }}>
          <legend>View</legend>
          <label htmlFor="graphingCheckbox">Graphing</label>
          <input
            id="graphingCheckbox"
            type="checkbox"
            checked={graphing}
            onChange={e => setGraphing(e.currentTarget.checked)}
          />

          {graphing ? (
            <>
              <label>Graphing Usernames</label>
              <input value={graphingUsernames} onChange={e => setGraphingUsernames(e.currentTarget.value)} />
            </>
          ) : null}
        </fieldset>
        <fieldset disabled={loading} className={styles.fieldset}>
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
      </div>

      {graphing ? (
        <LineChart
          width={window.innerWidth * 0.75}
          height={window.innerHeight * 0.75}
          style={{ margin: 'auto' }}
          data={chartData}
          onClick={() => setLegendUsernames([])}
        >
          <CartesianGrid stroke="#fff" />
          <XAxis dataKey="name" />
          <YAxis reversed={sortingKey === 'position'} />

          <Tooltip
            contentStyle={{ background: 'black', color: 'white' }}
            content={<ShowingLegend showing={legendUsernames} />}
          />
          <Brush
            tickFormatter={(_, i) => {
              const date = new Date(rawStart);
              date.setUTCDate(date.getUTCDate() + i);
              return dateToYYYYMMDD(date).slice(5);
            }}
          />
          {[...graphedUsernamesSet].map(key => (
            <Line
              name={key}
              key={key}
              stroke={colors[key]}
              type="monotone"
              dataKey={obj => obj[key]?.[sortingKey === 'honor' ? 'honor' : sortingKey === 'position' ? 'position' : 'honorChange']}
              activeDot={<ActiveDot name={key} setShowing={setLegendUsernames} />}
            />
          ))}
        </LineChart>
      ) : null}
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

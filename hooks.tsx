import { useRouter } from 'next/router';
import { ChangeEventHandler, Dispatch, ReactElement, SetStateAction, useEffect } from 'react';
import { useCallback, useMemo, useState } from 'react';
import LoadingIndicator from './components/LoadingIndicator';

function useDebounce<T extends {}>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export function useUsernameInput(
  labelText: string = 'Username',
): [string, Dispatch<SetStateAction<string>>, ReactElement] {
  const router = useRouter();
  useEffect(() => {
    if (typeof router.query.username === 'string') setUsername(router.query.username);
  }, [router.query.username]);

  const [username, setUsername] = useState('');
  const debouncedUsername = useDebounce(username, 1000);

  useEffect(() => {
    if (debouncedUsername === router.query.username) return;
    try {
      router.replace({ query: { ...router.query, username: debouncedUsername } });
    } catch (_) {}
  }, [router, debouncedUsername]);

  const onChange: ChangeEventHandler<HTMLInputElement> = useCallback(e => setUsername(e.currentTarget.value), []);

  return [
    debouncedUsername,
    setUsername,
    useMemo(
      () => (
        <div className="usernameInput">
          <label htmlFor="username-input">{labelText}</label>
          <input id="username-input" value={username} onChange={onChange} />
          <LoadingIndicator loading={username !== debouncedUsername} />
        </div>
      ),
      [username, onChange, labelText, debouncedUsername],
    ),
  ];
}

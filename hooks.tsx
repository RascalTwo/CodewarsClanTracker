import { ChangeEventHandler, Dispatch, ReactElement, SetStateAction, useCallback, useMemo, useState } from 'react';

export function useUsernameInput(): [string, Dispatch<SetStateAction<string>>, ReactElement] {
  const [username, setUsername] = useState('');

  const onChange: ChangeEventHandler<HTMLInputElement> = useCallback(e => setUsername(e.currentTarget.value), []);

  return [
    username,
    setUsername,
    useMemo(
      () => (
        <div className="usernameInput">
          <label htmlFor="username-input">Username</label>
          <input id="username-input" value={username} onChange={onChange} />
        </div>
      ),
      [username, onChange],
    ),
  ];
}

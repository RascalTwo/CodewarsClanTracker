import { CSSProperties } from 'react';
import { RankInfo } from '../../types';
import styles from './RankBadge.module.css';

const COLOR_NAME: Record<string, string> = {
  purple: '--color-rank-purple',
  white: '--color-ui-white-rank-text',
  blue: '--color-rank-blue',
  yellow: '--color-rank-yellow',
	red: '--color-legacy-unsat-red'
};

export function RankBadge({ color, name, rank, score }: RankInfo) {
  return (
    <div className={styles.rankBadge} style={{ '--color-rank': `var(${COLOR_NAME[color]!})` } as CSSProperties}>
      <div>
        <span>{name}</span>
      </div>
    </div>
  );
}

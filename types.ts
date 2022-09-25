export interface RankInfo {
  rank: number;
  name: string;
  color: string;
  score: number;
}

export interface ProgressStats {
  overallRank: number;
  honor: number;
  global: { leaderboardPosition: number | undefined; honorPercentile: number | undefined };
  completedKataCount: number;
  trainedLanguageCount: number;
  highestLanguageTrained: { languageName: string; rank: number };
  mostRecentLanguageTrained: string;
}

export type ProfileKey = 'github' | 'twitter' | 'linkedin' | 'stackoverflow';

export interface UserStats {
  lastSeen: number;
  memberSince: number;
  allyCount: number;
  followerCount: number;
  followingCount: number;
  clan: string;
  name: string;
  profiles: Record<ProfileKey, string>;
}

export interface PublicScrapedUser extends UserStats, ProgressStats {
  profileImageURL: string;
  username: string;
  achievements: { when: number, period: 'days' | 'weeks' | 'months'; type: 'honor' | 'change'; placedIndex: number }[];
}

export interface FailureResponse {
  success: false;
  message: string;
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
}

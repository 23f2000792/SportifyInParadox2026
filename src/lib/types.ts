export type SportType = 'kampus-run' | 'football' | 'volleyball' | 'badminton' | 'ipl-auction';

export interface SportEvent {
  id: string;
  name: string;
  slug: SportType;
  icon: string;
  description: string;
}

export interface Match {
  id: string;
  sport: SportType;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  status: 'Upcoming' | 'Live' | 'Completed';
  time: string;
  group?: string;
  keyEvents?: string[];
}

export interface Standing {
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  group?: string;
}

export interface RunResult {
  position: number;
  name: string;
  time: string;
  gender: 'M' | 'F';
  ageGroup: string;
}

export interface AuctionTeam {
  house: string;
  squad: string[];
  totalPoints: number;
  remainingPurse: number;
}

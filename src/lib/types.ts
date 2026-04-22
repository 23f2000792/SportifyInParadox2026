
export type SportType = 'kampus-run' | 'football' | 'volleyball' | 'badminton';

export interface SportEvent {
  id: string;
  name: string;
  slug: SportType;
  icon: string;
  description: string;
}

export interface BadmintonResult {
  type: 'MS' | 'WS' | 'MD' | 'WD' | 'XD';
  score: string;
  winner?: string;
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
  badmintonResults?: BadmintonResult[];
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
  category: string;
}

export type UserRole = 'admin' | 'super-admin';

export interface AdminUser {
  uid: string;
  email: string;
  role: UserRole;
  assignedSport?: string;
}

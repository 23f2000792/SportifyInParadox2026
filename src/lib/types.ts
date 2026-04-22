
export type SportType = 'kampus-run' | 'football' | 'volleyball' | 'badminton';
export type MatchPhase = 'group' | 'semi-final' | 'third-place' | 'final';

export interface SportEvent {
  id: string;
  name: string;
  slug: SportType;
  icon: string;
  description: string;
}

export interface BadmintonMatchResult {
  type: 'MS' | 'WS' | 'MD' | 'WD' | 'XD';
  score: string;
  winner: string;
}

export interface Match {
  id: string;
  matchNumber: string;
  sport: SportType;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  status: 'Upcoming' | 'Live' | 'Completed';
  phase: MatchPhase;
  time: string;
  date: string;
  day: string;
  venue: string;
  courtNumber?: string; // For Badminton, Volleyball
  groundNumber?: string; // For Football
  group?: string; // A, B, C, D
  keyEvents?: string[];
  badmintonResults?: BadmintonMatchResult[];
  updatedAt?: any;
}

export interface Standing {
  id?: string;
  team: string; // House Name
  sport: SportType;
  group: string; // A, B, C, D
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
}

export interface RunResult {
  id: string;
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

export const HOUSES = [
  'Sundarbans', 'Nallamala', 'Gir', 'Bandipur', 
  'Kaziranga', 'Corbett', 'Wayanad', 'Nilgiri', 
  'Saranda', 'Namdapha', 'Pichavaram', 'Kanha'
];

export const GROUPS = ['A', 'B', 'C', 'D'];

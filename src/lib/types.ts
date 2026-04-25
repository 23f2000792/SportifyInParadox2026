
export type SportType = 'kampus-run' | 'football' | 'volleyball' | 'badminton';
export type MatchPhase = 'group' | 'semi-final' | 'third-place' | 'final' | 'race';

export interface SportEvent {
  id: string;
  name: string;
  slug: SportType;
  icon: string;
  description: string;
}

export interface BadmintonMatchResult {
  type: 'MS' | 'WS' | 'MD' | 'XD';
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
  reportingTime?: string;
  date: string;
  day: string;
  venue: string;
  courtNumber?: string;
  groundNumber?: string;
  group?: string;
  keyEvents?: string[];
  badmintonResults?: BadmintonMatchResult[];
  updatedAt?: any;
}

export interface Trial {
  id: string;
  sport: SportType;
  house: string;
  date: string;
  time: string;
  venue: string;
  notes?: string;
  updatedAt?: any;
}

export interface Standing {
  id: string;
  team: string;
  sport: SportType;
  group: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  updatedAt?: any;
}

export interface RunResult {
  id: string;
  position: number;
  name: string;
  time: string;
  gender: 'M' | 'F';
  ageGroup: string;
  category: string;
  updatedAt?: any;
}

export interface Broadcast {
  id: string;
  message: string;
  active: boolean;
  timestamp: any;
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

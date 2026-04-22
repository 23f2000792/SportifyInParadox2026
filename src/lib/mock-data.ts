import { SportEvent, Match, Standing, RunResult, AuctionTeam } from './types';

export const EVENTS: SportEvent[] = [
  { id: '1', name: 'Kampus Run', slug: 'kampus-run', icon: 'Zap', description: 'The ultimate endurance race.' },
  { id: '2', name: 'Football', slug: 'football', icon: 'Trophy', description: 'Paradox Champions League.' },
  { id: '3', name: 'Volleyball', slug: 'volleyball', icon: 'CircleDot', description: 'VolleyVibes competition.' },
  { id: '4', name: 'Badminton', slug: 'badminton', icon: 'Target', description: 'High-speed racket battle.' },
  { id: '5', name: 'IPL Auction', slug: 'ipl-auction', icon: 'Gavel', description: 'The strategy of recruitment.' },
];

export const MOCK_MATCHES: Match[] = [
  { id: 'm1', sport: 'football', teamA: 'Avengers FC', teamB: 'Guardians Utd', scoreA: 2, scoreB: 1, status: 'Completed', time: '10:00 AM', group: 'A', keyEvents: ['John Doe 15\'', 'Mike Smith 42\''] },
  { id: 'm2', sport: 'football', teamA: 'Phoenix Suns', teamB: 'Shadow Strikers', scoreA: 0, scoreB: 0, status: 'Live', time: '12:00 PM', group: 'B' },
  { id: 'm3', sport: 'volleyball', teamA: 'Spike Squad', teamB: 'Net Ninjas', scoreA: 25, scoreB: 23, status: 'Completed', time: '11:00 AM' },
  { id: 'm4', sport: 'volleyball', teamA: 'Volley Vipers', teamB: 'Thunder Bolts', scoreA: 12, scoreB: 15, status: 'Live', time: '12:30 PM' },
];

export const FOOTBALL_STANDINGS: Standing[] = [
  { team: 'Avengers FC', played: 3, won: 2, drawn: 1, lost: 0, points: 7, group: 'A' },
  { team: 'Guardians Utd', played: 3, won: 1, drawn: 1, lost: 1, points: 4, group: 'A' },
  { team: 'Shadow Strikers', played: 2, won: 2, drawn: 0, lost: 0, points: 6, group: 'B' },
];

export const RUN_RESULTS: RunResult[] = [
  { position: 1, name: 'Alex Rivera', time: '18:45', gender: 'M', ageGroup: '18-25' },
  { position: 2, name: 'Samantha Chen', time: '19:12', gender: 'F', ageGroup: '18-25' },
  { position: 3, name: 'James Wilson', time: '19:30', gender: 'M', ageGroup: '26-35' },
  { position: 4, name: 'Elena Gilbert', time: '20:05', gender: 'F', ageGroup: '18-25' },
];

export const AUCTION_DATA: AuctionTeam[] = [
  { house: 'Gryffindor', squad: ['Virat K.', 'MS Dhoni', 'KL Rahul'], totalPoints: 450, remainingPurse: 12.5 },
  { house: 'Slytherin', squad: ['Kane W.', 'Ben Stokes', 'Pat Cummins'], totalPoints: 420, remainingPurse: 8.2 },
];

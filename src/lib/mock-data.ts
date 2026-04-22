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
  { id: 'm5', sport: 'badminton', teamA: 'House Alpha', teamB: 'House Beta', scoreA: 2, scoreB: 0, status: 'Completed', time: '09:00 AM' },
  { id: 'm6', sport: 'football', teamA: 'Titan Kings', teamB: 'Storm Breakers', scoreA: 1, scoreB: 3, status: 'Completed', time: '08:30 AM', group: 'A' },
  { id: 'm7', sport: 'volleyball', teamA: 'Cloud 9', teamB: 'Gravity', scoreA: 0, scoreB: 0, status: 'Upcoming', time: '02:00 PM' },
  { id: 'm8', sport: 'badminton', teamA: 'Swift Strikes', teamB: 'Feather Flyers', scoreA: 0, scoreB: 0, status: 'Upcoming', time: '03:30 PM' },
  { id: 'm9', sport: 'football', teamA: 'Rogue Legion', teamB: 'Star Knights', scoreA: 1, scoreB: 1, status: 'Completed', time: '07:00 AM', group: 'B' },
  { id: 'm10', sport: 'football', teamA: 'Shadow Strikers', teamB: 'Rogue Legion', scoreA: 0, scoreB: 0, status: 'Upcoming', time: '04:00 PM', group: 'B' },
  { id: 'm11', sport: 'football', teamA: 'Galactic Warriors', teamB: 'Nebula Navigators', scoreA: 3, scoreB: 0, status: 'Completed', time: '11:30 AM', group: 'C' },
  { id: 'm12', sport: 'football', teamA: 'Solar Flares', teamB: 'Lunar Legends', scoreA: 1, scoreB: 1, status: 'Live', time: '01:00 PM', group: 'D' },
];

export const FOOTBALL_STANDINGS: Standing[] = [
  // Group A
  { team: 'Avengers FC', played: 2, won: 2, drawn: 0, lost: 0, points: 6, group: 'A' },
  { team: 'Storm Breakers', played: 1, won: 1, drawn: 0, lost: 0, points: 3, group: 'A' },
  { team: 'Guardians Utd', played: 1, won: 0, drawn: 0, lost: 1, points: 0, group: 'A' },
  { team: 'Titan Kings', played: 1, won: 0, drawn: 0, lost: 1, points: 0, group: 'A' },
  
  // Group B
  { team: 'Shadow Strikers', played: 1, won: 1, drawn: 0, lost: 0, points: 3, group: 'B' },
  { team: 'Star Knights', played: 1, won: 0, drawn: 1, lost: 0, points: 1, group: 'B' },
  { team: 'Rogue Legion', played: 2, won: 0, drawn: 1, lost: 1, points: 1, group: 'B' },
  { team: 'Phoenix Suns', played: 1, won: 0, drawn: 0, lost: 1, points: 0, group: 'B' },

  // Group C
  { team: 'Galactic Warriors', played: 1, won: 1, drawn: 0, lost: 0, points: 3, group: 'C' },
  { team: 'Nebula Navigators', played: 1, won: 0, drawn: 0, lost: 1, points: 0, group: 'C' },
  { team: 'Comet Crusaders', played: 0, won: 0, drawn: 0, lost: 0, points: 0, group: 'C' },
  { team: 'Meteor Masters', played: 0, won: 0, drawn: 0, lost: 0, points: 0, group: 'C' },

  // Group D
  { team: 'Solar Flares', played: 1, won: 0, drawn: 1, lost: 0, points: 1, group: 'D' },
  { team: 'Lunar Legends', played: 1, won: 0, drawn: 1, lost: 0, points: 1, group: 'D' },
  { team: 'Stellar Sprinters', played: 0, won: 0, drawn: 0, lost: 0, points: 0, group: 'D' },
  { team: 'Nova Knights', played: 0, won: 0, drawn: 0, lost: 0, points: 0, group: 'D' },
];

export const VOLLEYBALL_STANDINGS: Standing[] = [
  { team: 'Spike Squad', played: 2, won: 2, drawn: 0, lost: 0, points: 6 },
  { team: 'Thunder Bolts', played: 1, won: 1, drawn: 0, lost: 0, points: 3 },
  { team: 'Net Ninjas', played: 2, won: 0, drawn: 0, lost: 2, points: 0 },
  { team: 'Volley Vipers', played: 1, won: 0, drawn: 0, lost: 1, points: 0 },
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

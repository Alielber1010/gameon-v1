/**
 * Comprehensive list of sports and activities
 * Includes traditional sports, Asian sports, dances, yoga, martial arts, etc.
 */

export const SPORTS = [
  // Traditional Sports
  'football',
  'basketball',
  'soccer',
  'tennis',
  'volleyball',
  'badminton',
  'table-tennis',
  'cricket',
  'baseball',
  'softball',
  'rugby',
  'hockey',
  'ice-hockey',
  'swimming',
  'running',
  'cycling',
  'golf',
  
  // Asian Sports & Activities
  'sepak-takraw',
  'kabaddi',
  'kho-kho',
  'gilli-danda',
  'carrom',
  'chess',
  'mahjong',
  'go',
  'xiangqi',
  
  // Martial Arts
  'karate',
  'taekwondo',
  'judo',
  'kung-fu',
  'muay-thai',
  'boxing',
  'wrestling',
  'jiu-jitsu',
  'aikido',
  'capoeira',
  
  // Dances & Movement
  'dancing',
  'zumba',
  'aerobic-dance',
  'hip-hop-dance',
  'salsa',
  'bhangra',
  'bollywood-dance',
  'k-pop-dance',
  'ballroom-dancing',
  'latin-dance',
  
  // Yoga & Wellness
  'yoga',
  'pilates',
  'meditation',
  'tai-chi',
  'qigong',
  'stretching',
  'calisthenics',
  
  // Fitness & Training
  'gym',
  'weightlifting',
  'crossfit',
  'functional-training',
  'cardio',
  'hiit',
  'bodybuilding',
  
  // Outdoor Activities
  'hiking',
  'trekking',
  'rock-climbing',
  'mountaineering',
  'camping',
  'kayaking',
  'canoeing',
  'surfing',
  'skateboarding',
  'rollerblading',
  
  // Other Activities
  'archery',
  'shooting',
  'fishing',
  'darts',
  'billiards',
  'snooker',
  'bowling',
  'skating',
  'ice-skating',
  'skiing',
  'snowboarding',
] as const;

export type Sport = typeof SPORTS[number];

// Display names for sports (user-friendly)
export const SPORT_DISPLAY_NAMES: Record<string, string> = {
  'football': 'Football',
  'basketball': 'Basketball',
  'soccer': 'Soccer',
  'tennis': 'Tennis',
  'volleyball': 'Volleyball',
  'badminton': 'Badminton',
  'table-tennis': 'Table Tennis',
  'pingpong': 'Table Tennis',
  'cricket': 'Cricket',
  'baseball': 'Baseball',
  'softball': 'Softball',
  'rugby': 'Rugby',
  'hockey': 'Hockey',
  'ice-hockey': 'Ice Hockey',
  'swimming': 'Swimming',
  'running': 'Running',
  'cycling': 'Cycling',
  'golf': 'Golf',
  
  // Asian Sports
  'sepak-takraw': 'Sepak Takraw',
  'kabaddi': 'Kabaddi',
  'kho-kho': 'Kho Kho',
  'gilli-danda': 'Gilli Danda',
  'carrom': 'Carrom',
  'chess': 'Chess',
  'mahjong': 'Mahjong',
  'go': 'Go',
  'xiangqi': 'Xiangqi',
  
  // Martial Arts
  'karate': 'Karate',
  'taekwondo': 'Taekwondo',
  'judo': 'Judo',
  'kung-fu': 'Kung Fu',
  'muay-thai': 'Muay Thai',
  'boxing': 'Boxing',
  'wrestling': 'Wrestling',
  'jiu-jitsu': 'Jiu Jitsu',
  'aikido': 'Aikido',
  'capoeira': 'Capoeira',
  
  // Dances
  'dancing': 'Dancing',
  'zumba': 'Zumba',
  'aerobic-dance': 'Aerobic Dance',
  'hip-hop-dance': 'Hip Hop Dance',
  'salsa': 'Salsa',
  'bhangra': 'Bhangra',
  'bollywood-dance': 'Bollywood Dance',
  'k-pop-dance': 'K-Pop Dance',
  'ballroom-dancing': 'Ballroom Dancing',
  'latin-dance': 'Latin Dance',
  
  // Yoga & Wellness
  'yoga': 'Yoga',
  'pilates': 'Pilates',
  'meditation': 'Meditation',
  'tai-chi': 'Tai Chi',
  'qigong': 'Qigong',
  'stretching': 'Stretching',
  'calisthenics': 'Calisthenics',
  
  // Fitness
  'gym': 'Gym',
  'weightlifting': 'Weightlifting',
  'crossfit': 'CrossFit',
  'functional-training': 'Functional Training',
  'cardio': 'Cardio',
  'hiit': 'HIIT',
  'bodybuilding': 'Bodybuilding',
  
  // Outdoor
  'hiking': 'Hiking',
  'trekking': 'Trekking',
  'rock-climbing': 'Rock Climbing',
  'mountaineering': 'Mountaineering',
  'camping': 'Camping',
  'kayaking': 'Kayaking',
  'canoeing': 'Canoeing',
  'surfing': 'Surfing',
  'skateboarding': 'Skateboarding',
  'rollerblading': 'Rollerblading',
  
  // Other
  'archery': 'Archery',
  'shooting': 'Shooting',
  'fishing': 'Fishing',
  'darts': 'Darts',
  'billiards': 'Billiards',
  'snooker': 'Snooker',
  'bowling': 'Bowling',
  'skating': 'Skating',
  'ice-skating': 'Ice Skating',
  'skiing': 'Skiing',
  'snowboarding': 'Snowboarding',
};

// Get display name for a sport
export function getSportDisplayName(sport: string): string {
  return SPORT_DISPLAY_NAMES[sport] || sport.charAt(0).toUpperCase() + sport.slice(1).replace(/-/g, ' ');
}

// Get all sports as display names (for dropdowns)
export function getSportsForDisplay(): Array<{ value: string; label: string }> {
  return SPORTS.map(sport => ({
    value: sport,
    label: getSportDisplayName(sport),
  })).sort((a, b) => a.label.localeCompare(b.label));
}






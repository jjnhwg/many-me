// What clones can do. Adding an activity is a data change here (+ an anim name the renderer knows).

export type Category = 'bjj' | 'gym' | 'dev' | 'study' | 'coffee' | 'eat' | 'rest' | 'selfcare' | 'sleep' | 'wander';

export type Needs = { energy: number; focus: number; hunger: number; mood: number };

export type Anim =
  | 'idle' | 'walk' | 'type' | 'squat' | 'press' | 'run' | 'drill' | 'roll' | 'stretch'
  | 'read' | 'sleep' | 'eat' | 'eatStand' | 'drink' | 'phone' | 'skincare' | 'write' | 'rest';

export type Activity = {
  id: string;
  label: string;          // "coding", shown in HUD / hover
  category: Category;
  points: string[];
  anim: Anim;
  duration: [number, number]; // minutes of sim time
  effects: Partial<Needs>;    // change per sim hour while doing it
  focusTask?: boolean;        // duration scales with focus
  summary: { kind: 'time' | 'count'; text: string }; // "{t}" = duration, "{n}" = count
  emoji: string;
};

const HALL = ['hall1', 'hall2', 'hall3', 'hall4', 'hall5', 'hall6'];

export const activities: Activity[] = [
  // BJJ
  { id: 'drill', label: 'drilling', category: 'bjj', points: ['dojo_drill1', 'dojo_drill2'], anim: 'drill', duration: [3, 6],
    effects: { energy: -32, hunger: 10 }, summary: { kind: 'count', text: 'drilled {n} technique blocks' }, emoji: '🥋' },
  { id: 'roll', label: 'rolling', category: 'bjj', points: ['dojo_roll'], anim: 'roll', duration: [2, 4],
    effects: { energy: -40, hunger: 12 }, summary: { kind: 'count', text: 'rolled {n} rounds' }, emoji: '🤼' },
  { id: 'stretch', label: 'stretching', category: 'bjj', points: ['dojo_stretch1', 'dojo_stretch2'], anim: 'stretch', duration: [1, 3],
    effects: { energy: 8, mood: 10 }, summary: { kind: 'time', text: 'stretched for {t}' }, emoji: '🧘' },
  // Gym
  { id: 'squat', label: 'squatting', category: 'gym', points: ['gym_squat'], anim: 'squat', duration: [2, 4],
    effects: { energy: -38, hunger: 12 }, summary: { kind: 'count', text: 'hit {n} squat sets' }, emoji: '🏋️' },
  { id: 'press', label: 'pressing', category: 'gym', points: ['gym_bench'], anim: 'press', duration: [2, 4],
    effects: { energy: -32, hunger: 10 }, summary: { kind: 'count', text: 'hit {n} press sets' }, emoji: '💪' },
  { id: 'treadmill', label: 'on the treadmill', category: 'gym', points: ['gym_tread'], anim: 'run', duration: [4, 8],
    effects: { energy: -34, hunger: 10 }, summary: { kind: 'time', text: 'ran for {t}' }, emoji: '🏃' },
  { id: 'gymrest', label: 'resting between sets', category: 'gym', points: ['gym_stool'], anim: 'rest', duration: [1, 2],
    effects: { energy: 25 }, summary: { kind: 'count', text: 'took {n} breathers' }, emoji: '💧' },
  // Dev
  { id: 'code', label: 'coding', category: 'dev', points: ['dev_desk1', 'dev_desk2'], anim: 'type', duration: [6, 15], focusTask: true,
    effects: { energy: -8, focus: -30 }, summary: { kind: 'time', text: 'coded for {t}' }, emoji: '💻' },
  { id: 'coffee', label: 'getting coffee', category: 'coffee', points: ['dev_coffee'], anim: 'drink', duration: [1, 2],
    effects: { focus: 600, energy: 120 }, summary: { kind: 'count', text: 'had {n} coffees' }, emoji: '☕' },
  // Study
  { id: 'read', label: 'reading', category: 'study', points: ['study_beanbag', 'study_chair'], anim: 'read', duration: [4, 10], focusTask: true,
    effects: { focus: -15, mood: 6 }, summary: { kind: 'time', text: 'read for {t}' }, emoji: '📖' },
  { id: 'leetcode', label: 'grinding LeetCode', category: 'study', points: ['study_laptop'], anim: 'type', duration: [5, 12], focusTask: true,
    effects: { energy: -8, focus: -28 }, summary: { kind: 'count', text: 'solved {n} LeetCode problems' }, emoji: '🧩' },
  { id: 'whiteboard', label: 'at the whiteboard', category: 'study', points: ['study_board'], anim: 'write', duration: [2, 4], focusTask: true,
    effects: { focus: -12 }, summary: { kind: 'time', text: 'whiteboarded for {t}' }, emoji: '📈' },
  // Food
  { id: 'eat', label: 'eating', category: 'eat', points: ['kitchen_seat1', 'kitchen_seat2'], anim: 'eat', duration: [3, 6],
    effects: { hunger: -900, energy: 15, mood: 20 }, summary: { kind: 'count', text: 'ate {n} meals' }, emoji: '🍜' },
  { id: 'snack', label: 'raiding the fridge', category: 'eat', points: ['fridge'], anim: 'eatStand', duration: [1, 2],
    effects: { hunger: -700, mood: 15 }, summary: { kind: 'count', text: 'raided the fridge {n}x' }, emoji: '🧃' },
  // Rest / self-care
  { id: 'nap', label: 'napping', category: 'rest', points: ['couch1', 'study_beanbag', 'dojo_mat'], anim: 'sleep', duration: [10, 25],
    effects: { energy: 70, focus: 40 }, summary: { kind: 'count', text: 'napped {n}x' }, emoji: '😴' },
  { id: 'phone', label: 'scrolling their phone', category: 'rest', points: ['couch1', 'couch2', 'study_beanbag'], anim: 'phone', duration: [2, 6],
    effects: { energy: 20, focus: -5 }, summary: { kind: 'time', text: 'doomscrolled for {t}' }, emoji: '📱' },
  { id: 'skincare', label: 'doing skincare', category: 'selfcare', points: ['vanity'], anim: 'skincare', duration: [2, 4],
    effects: { mood: 40 }, summary: { kind: 'count', text: 'did skincare {n}x' }, emoji: '🧴' },
  { id: 'sleep', label: 'sleeping', category: 'sleep', points: ['bed1', 'bed2', 'couch1', 'study_beanbag', 'dojo_mat', 'dojo_mat2'], anim: 'sleep', duration: [0, 0],
    effects: { energy: 14, focus: 12 }, summary: { kind: 'time', text: 'slept {t}' }, emoji: '💤' },
  { id: 'wander', label: 'hanging out', category: 'wander', points: HALL, anim: 'idle', duration: [0.3, 1.2],
    effects: { energy: 2 }, summary: { kind: 'count', text: 'wandered the halls {n}x' }, emoji: '🚶' },
];

export const activityById = new Map(activities.map((a) => [a.id, a]));

// Speech bubble lines, keyed by activity id (+ "walk" and "idle").
export const lines: Record<string, string[]> = {
  drill: ['again.', 'hip escape, hip escape', 'smooth is fast', 'oss'],
  roll: ['tap tap', 'one more round', 'nice guard', 'breathe...'],
  stretch: ['hips are tight', 'ahh', 'mobility day'],
  squat: ['one more set', 'depth!', 'light weight', 'brace...'],
  press: ['one more rep', 'up!', 'pump is real'],
  treadmill: ['cardio arc', 'zone 2', 'why did I start'],
  gymrest: ['water break', '90 seconds', 'whew'],
  code: ['it works??', 'why is this O(n²)', 'who wrote this. oh. me', 'ship it', 'git push --force? no.', 'one more test'],
  coffee: ['caffeine++', 'fuel', 'decaf is a lie'],
  read: ['huh, interesting', 'one more chapter', 'highlighting this'],
  leetcode: ['why is this O(n²)', 'two pointers?', 'dp again...', 'accepted!!'],
  whiteboard: ['so if we draw it...', 'big O of what', 'hmm'],
  eat: ['so good', 'protein', 'nom'],
  snack: ['just a snack', 'midnight-ish snack'],
  phone: ['lol', 'one more video', 'where did the hour go'],
  skincare: ['glow up', 'SPF is life', 'moisturize'],
  walk: ['brb', 'hmm', 'where was I'],
  idle: ['what now', 'vibes', '...'],
};

export const GREETINGS = ['👋', 'yo', 'sup me', '✋ high five', 'lookin good'];
// When a Justin passes someone who isn't a Justin.
export const FRIEND_GREETINGS = ['👋', 'hey you', 'hi Em', '💕', 'missed you'];

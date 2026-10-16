// All texts of the page live here, so they can be changed without touching the layout.
// Markup: **word** is set bold (see components/Rich.tsx).

import stravaData from './data/strava.json'

export const person = {
  name: 'Toni',
  tagline: 'Lorem ipsum dolor sit amet, **consectetur** adipiscing elit, sed do eiusmod tempor.',
  github: 'https://github.com/Toni01837463829',
}

export const about = {
  text: [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    'Ut enim ad minim veniam, quis nostrud **exercitation ullamco.**',
  ],
  path: [
    { place: 'HTL Krems', detail: 'Ausbildung', years: '' },
    { place: 'FH Oberösterreich', detail: 'AI Solutions', years: '' },
  ],
}

export type HobbyId = 'triathlon' | 'simracing' | 'coding' | 'feuerwehr'

/** colors: the hobby's own accent pair, used for its screen in the hobbies section */
export const hobbies: { id: HobbyId; name: string; text: string; colors: [string, string] }[] = [
  {
    id: 'triathlon',
    name: 'Triathlon',
    text: 'Angehender Triathlet :)',
    colors: ['#fc4c02', '#fbbf24'],
  },
  {
    id: 'simracing',
    name: 'Sim-Racing',
    text: 'Viel zu viel Zeit verbracht, mittelgut zu werden.',
    colors: ['#22c55e', '#0ea5e9'],
  },
  {
    id: 'feuerwehr',
    name: 'Freiwillige Feuerwehr',
    text: 'APTE: Bronze, APLE: Bronze. Erstellung und Hosting der Website der FF Pfaffenschlag.',
    colors: ['#ef4444', '#b91c1c'],
  },
  {
    id: 'coding',
    name: 'Coding',
    text: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco.',
    colors: ['#8b5cf6', '#c026d3'],
  },
]

export const projects: {
  title: string
  hobby: HobbyId
  text: string
  tags: string[]
  visual: 'browser' | 'dashboard' | 'garmin' | 'portal'
  link?: string
  /** Screenshot shown inside the portal (visual: 'portal') */
  image?: string
  /** Small line under the portal; defaults to the link's domain */
  caption?: string
  /** Three colors for the portal's rim and glow, taken from the screenshot */
  colors?: [string, string, string]
}[] = [
  {
    title: 'Website der FF Pfaffenschlag',
    hobby: 'feuerwehr',
    text: 'Erstellung, Verwaltung und Hosting der Website der **FF Pfaffenschlag**, mit eigenem **CMS** und Datenbank.',
    tags: ['Web', 'CMS', 'Datenbank', 'Hosting'],
    visual: 'portal',
    link: 'https://www.ff-pfaffenschlag.at/',
    image: 'projects/ff-pfaffenschlag.jpg',
    colors: ['#e5383b', '#f97316', '#e11d48'],
  },
  {
    title: 'Sim-Racing Dashboards',
    hobby: 'simracing',
    text: 'Eigene Dashboards für den Simulator: Drehzahl, Gang, Rundenzeiten und Delta **auf einen Blick.**',
    tags: ['Telemetrie', 'Live-Daten'],
    visual: 'portal',
    image: 'projects/simracing-dashboard.webp',
    caption: 'Live-Dashboard',
    colors: ['#22c55e', '#22d3ee', '#a855f7'],
  },
  {
    title: 'Garmin Edge 1030 Datenseiten',
    hobby: 'triathlon',
    text: 'Eigene Datenseiten für den Radcomputer, genau auf das Training abgestimmt.',
    tags: ['Garmin Connect IQ', 'Training'],
    visual: 'garmin',
  },
]

// The Garmin data pages, recorded in the Connect IQ simulator. crop is where the
// 282×470 device screen sits inside each recording (in video pixels).
export const garminPages: { name: string; text: string; video: string; crop: { x: number; y: number } }[] = [
  {
    name: 'Fahrt',
    text: 'Zeit, Distanz, **Höhenprofil** und die Zonen der ganzen Fahrt auf einer Seite.',
    video: 'projects/garmin-1.mp4',
    crop: { x: 94, y: 112 },
  },
  {
    name: 'Carb Fuel',
    text: 'Glykogen, **Burn-Rate** und wann die nächste Verpflegung fällig ist.',
    video: 'projects/garmin-2.mp4',
    crop: { x: 96, y: 114 },
  },
  {
    name: 'Live-Graphen',
    text: 'Speed, Puls und **3s-Power** mit Verlauf und Zonen, live während der Fahrt.',
    video: 'projects/garmin-3.mp4',
    crop: { x: 95, y: 111 },
  },
]

export type Sport = 'swim' | 'bike' | 'run'

export type Activity = {
  id: string
  sport: Sport
  name: string
  /** yyyy-mm-dd */
  date: string
  /** seconds */
  movingTime: number
  /** meters */
  distance: number
  elevationGain?: number
  avgHr?: number
  /** Shape of the route as x/y points in 0..1000, without the first and last kilometer */
  route?: [number, number][]
  /** Altitude in meters, sampled evenly over the activity */
  elevation?: number[]
}

// Strava activities on the triathlon screen, generated from a Strava export by
// scripts/strava.mjs (npm run strava)
export const stravaActivities = stravaData as Activity[]

/** The sim-racing screen: the games circling (Steam store banners, © their publishers) and the slides in the middle */
export const simracing = {
  games: [
    { name: 'Le Mans Ultimate', image: 'simracing/lmu.jpg' },
    { name: 'Assetto Corsa EVO', image: 'simracing/acevo.jpg' },
    { name: 'Assetto Corsa Competizione', image: 'simracing/acc.jpg' },
    { name: 'Assetto Corsa', image: 'simracing/ac.jpg' },
  ],
  // Slides without an image show a drawn stand-in; add a screenshot path to replace it
  slides: [
    { id: 'telemetry' as const, label: 'Telemetrie', caption: 'Runde im Detail', image: undefined as string | undefined },
    { id: 'setup' as const, label: 'Car Setup', caption: 'GT3 · Trocken', image: undefined as string | undefined },
    { id: 'dashboard' as const, label: 'Dashboard', caption: 'Mein Live-Dashboard', image: 'projects/simracing-dashboard.webp' as string | undefined },
  ],
}

/** The Feuerwehr screen: badges from the training exams (Ausbildungsprüfungen), then the website */
export const feuerwehr = {
  medals: [
    { short: 'APTE', name: 'Technischer Einsatz', level: 'Bronze', image: 'feuerwehr/apte-bronze.png', ratio: 129 / 162 },
    { short: 'APLE', name: 'Löscheinsatz', level: 'Bronze', image: 'feuerwehr/aple-bronze.png', ratio: 98 / 158 },
  ],
}

/** The Strava badge and wall on the triathlon screen */
export const strava = {
  profile: 'https://www.strava.com/athletes/896347841',
  badge: 'Mein Strava',
  heading: 'Meine Strava-Aktivitäten',
}

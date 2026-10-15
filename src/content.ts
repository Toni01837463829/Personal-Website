// All texts of the page live here, so they can be changed without touching the layout.
// Markup: **word** is set bold (see components/Rich.tsx).

export const person = {
  name: 'Toni',
  tagline: 'Ich studiere **AI Solutions** und baue Software für das, was mich begeistert.',
  github: 'https://github.com/Toni01837463829',
}

export const about = {
  text: [
    'Hier steht später ein kurzer Absatz über dich: woher du kommst, was dich antreibt und woran du gerade arbeitest.',
    'Zwei, drei Sätze reichen. Der Rest der Seite zeigt, **was du machst.**',
  ],
  path: [
    { place: 'HTL Krems', detail: 'Ausbildung', years: '' },
    { place: 'FH Oberösterreich', detail: 'AI Solutions', years: '' },
  ],
}

export type HobbyId = 'triathlon' | 'simracing' | 'coding' | 'feuerwehr'

export const hobbies: { id: HobbyId; name: string; text: string }[] = [
  { id: 'triathlon', name: 'Triathlon', text: 'Schwimmen, Radfahren, Laufen. Training mit **Daten**, Rennen mit Kopf.' },
  { id: 'simracing', name: 'Sim-Racing', text: 'Rennen am Simulator und eigene Dashboards, die zeigen, **was zählt.**' },
  { id: 'coding', name: 'Coding', text: 'Das, was alles andere verbindet: Werkzeuge für die eigenen Hobbys bauen.' },
  { id: 'feuerwehr', name: 'Freiwillige Feuerwehr', text: 'Im Einsatz, **wenn es darauf ankommt,** und online für die eigene Wehr.' },
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
}[] = [
  {
    title: 'Website der FF Pfaffenschlag',
    hobby: 'feuerwehr',
    text: 'Erstellung, Verwaltung und Hosting der Website der **FF Pfaffenschlag**, mit eigenem **CMS** und Datenbank.',
    tags: ['Web', 'CMS', 'Datenbank', 'Hosting'],
    visual: 'portal',
    link: 'https://www.ff-pfaffenschlag.at/',
    image: 'projects/ff-pfaffenschlag.jpg',
  },
  {
    title: 'Sim-Racing Dashboards',
    hobby: 'simracing',
    text: 'Eigene Dashboards für den Simulator: Drehzahl, Gang, Rundenzeiten und Delta **auf einen Blick.**',
    tags: ['Telemetrie', 'Live-Daten'],
    visual: 'portal',
    image: 'projects/simracing-dashboard.webp',
    caption: 'Live-Dashboard',
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

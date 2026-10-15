// All texts of the page live here, so they can be changed without touching the layout.

export const person = {
  name: 'Toni',
  tagline: 'Ich studiere AI Solutions und baue Software für das, was mich begeistert.',
  github: 'https://github.com/Toni01837463829',
}

export const about = {
  text: [
    'Hier steht später ein kurzer Absatz über dich: woher du kommst, was dich antreibt und woran du gerade arbeitest.',
    'Zwei, drei Sätze reichen. Der Rest der Seite zeigt, was du machst.',
  ],
  path: [
    { place: 'HTL Krems', detail: 'Ausbildung', years: '' },
    { place: 'FH Oberösterreich', detail: 'AI Solutions', years: '' },
  ],
}

export type HobbyId = 'triathlon' | 'simracing' | 'coding' | 'feuerwehr'

export const hobbies: { id: HobbyId; name: string; text: string }[] = [
  { id: 'triathlon', name: 'Triathlon', text: 'Schwimmen, Radfahren, Laufen. Training mit Daten, Rennen mit Kopf.' },
  { id: 'simracing', name: 'Sim-Racing', text: 'Rennen am Simulator und eigene Dashboards, die zeigen, was zählt.' },
  { id: 'coding', name: 'Coding', text: 'Das, was alles andere verbindet: Werkzeuge für die eigenen Hobbys bauen.' },
  { id: 'feuerwehr', name: 'Freiwillige Feuerwehr', text: 'Im Einsatz, wenn es darauf ankommt, und online für die eigene Wehr.' },
]

export const projects: {
  title: string
  hobby: HobbyId
  text: string
  tags: string[]
  visual: 'browser' | 'dashboard' | 'garmin'
  link?: string
}[] = [
  {
    title: 'Homepage der Freiwilligen Feuerwehr',
    hobby: 'feuerwehr',
    text: 'Die Website der eigenen Feuerwehr: Einsätze, Neuigkeiten und alles, was die Gemeinde wissen muss.',
    tags: ['Web', 'Design'],
    visual: 'browser',
  },
  {
    title: 'Sim-Racing Dashboards',
    hobby: 'simracing',
    text: 'Eigene Dashboards für den Simulator: Drehzahl, Gang, Rundenzeiten und Delta auf einen Blick.',
    tags: ['Telemetrie', 'Live-Daten'],
    visual: 'dashboard',
  },
  {
    title: 'Garmin Edge 1030 Datenseiten',
    hobby: 'triathlon',
    text: 'Eigene Datenseiten für den Radcomputer, genau auf das Training abgestimmt.',
    tags: ['Garmin Connect IQ', 'Training'],
    visual: 'garmin',
  },
]

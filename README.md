# Toni – persönliche Website

React + Vite + TypeScript + Tailwind CSS, animations with Motion.

## Run it

You need Node.js (version 20 or newer).

```
npm install
npm run dev
```

Then open the address it prints (usually http://localhost:5173).

`npm run build` creates the finished site in `dist/`, ready to upload to any web host.

## Where things are

- `src/content.ts`: all texts, hobbies and projects. Change content here.
- `src/sections/`: the page sections (Hero, About, Hobbies, Projects, Contact).
- `src/components/`: reusable pieces, like the mouse depth effect (`Mouse.tsx`), tilting cards (`TiltCard.tsx`) and the drawn project previews (`Visuals.tsx`).
- `src/index.css`: colors and fonts.

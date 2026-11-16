# Glen Hutajulu portfolio

A static portfolio site built with Astro. Every project reads the same way: images and a written case study. The Voltwise demo lives in its own repo, `voltwise-demo`.

- `src/pages`: the homepage, `/about`, `/services` and one page per case study.
- `src/components`: the top bar, full-screen menu and footer shared by every page.
- `src/styles/global.css`: all styles, copied from the "Portfolio (current)" design canvas. Font names point at the self-hosted Fontsource files.
- `src/scripts/motion.js`: all motion, inlined at the end of each page: the menu, the home hero zoom and work stack, the case study cover and reading bar, smooth wheel scrolling and scroll reveals (`.rv`). Scroll-driven effects run only on windows at least 760px wide and at most 1400px tall, and never with reduced motion.
- `src/data.ts`: contact links.
- `public/cv.pdf`: every CV link appears while this file exists. This repo is public, so keep the phone number out of the PDF.

## Run it

```sh
npm install
npm run dev
```

## Deploy

Netlify builds from `netlify.toml`: `npm run build`, publish `dist`.

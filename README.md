# Glen Hutajulu portfolio

A static portfolio site built with Astro. Every project reads the same way: images and a written case study. The Voltwise demo lives in its own repo, `voltwise-demo`.

- `src/pages`: the homepage, `/about`, `/services` and one page per case study.
- `src/components`: the header and footer shared by every page.
- `src/styles/global.css`: all styles, including the motion keyframes.
- `src/scripts/motion.js`: all motion, inlined at the end of each page. Text and images are picked by rule, so new content animates without extra classes.
- `src/data.ts`: contact links and the demo URL. The demo link appears once `demo` is set.
- `public/cv.pdf`: add this file and every Download CV link appears on the next build. This repo is public, so remove the phone number from the PDF first.

## Run it

```sh
npm install
npm run dev
```

## Deploy

Netlify builds from `netlify.toml`: `npm run build`, publish `dist`.

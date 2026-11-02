# Glen Hutajulu portfolio

A static portfolio site built with Astro. It ships no JavaScript, and every project reads the same way: images and a written case study. The Voltwise demo lives in its own repo, `voltwise-demo`.

- `src/pages`: the homepage, `/services` and case studies.
- `src/content/work`: case studies as Markdown. Frontmatter feeds the TL;DR block.
- `src/data.ts`: contact links and the demo URL. The demo link appears once `demo` is set.
- `public/cv.pdf`: add this file and every Download CV link appears on the next build.

## Run it

```sh
npm install
npm run dev
```

## Deploy

Netlify builds from `netlify.toml`: `npm run build`, publish `dist`.

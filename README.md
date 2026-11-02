# Glen Hutajulu portfolio

Portfolio site plus Voltwise, an interactive dashboard demo with dummy data.

- `src/pages`: Astro pages. The homepage, `/services`, `/demo` and case studies.
- `src/content/work`: case studies as Markdown. Frontmatter feeds the TL;DR block.
- `src/demo`: the Voltwise React app. All data is generated in `data.ts` from a fixed seed.
- `public/cv.pdf`: add this file and every Download CV link appears on the next build.

## Run it

```sh
npm install
npm run dev
```

## Deploy

Netlify builds from `netlify.toml`: `npm run build`, publish `dist`.

## Rule for the demo

Everything under `src/demo` stays fictional: no real product, client, region or number.

import { existsSync } from 'node:fs';

export const site = {
  name: 'Glen Hutajulu',
  email: 'glenaldohutajulu@gmail.com',
  linkedin: 'https://www.linkedin.com/in/glenhutajulu/',
  dribbble: 'https://dribbble.com/glenhutajulu',
  // Set this after deploying voltwise-demo. The link appears on the Arsenal case study.
  demo: null as string | null,
  // The Download CV link appears as soon as public/cv.pdf exists.
  cv: existsSync('public/cv.pdf') ? '/cv.pdf' : null,
};

import { existsSync } from 'node:fs';

export const site = {
  name: 'Glen Hutajulu',
  email: 'glenaldohutajulu@gmail.com',
  linkedin: 'https://www.linkedin.com/in/glenhutajulu/',
  dribbble: 'https://dribbble.com/glenhutajulu',
  // The Download CV link appears as soon as public/cv.pdf exists.
  cv: existsSync('public/cv.pdf') ? '/cv.pdf' : null,
};

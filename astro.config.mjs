// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import yaml from '@rollup/plugin-yaml';

// https://astro.build/config
export default defineConfig({
  site: 'https://secureliving.com',
  vite: {
    plugins: [yaml()],
  },
  integrations: [
    mdx(),
    sitemap({
      serialize(item) {
        const url = item.url;

        if (url === 'https://secureliving.com/') {
          item.changefreq = 'weekly';
          item.priority = 1.0;
        } else if (url.includes('/home-security-systems/') && url !== 'https://secureliving.com/home-security-systems/') {
          item.changefreq = 'monthly';
          item.priority = 0.8;
        } else if (url === 'https://secureliving.com/home-security-systems/') {
          item.changefreq = 'weekly';
          item.priority = 0.9;
        } else {
          item.changefreq = 'yearly';
          item.priority = 0.3;
        }

        item.lastmod = new Date().toISOString();

        return item;
      },
    }),
  ],
});
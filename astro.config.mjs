// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import yaml from '@rollup/plugin-yaml';
import seoGraph from '@jdevalk/astro-seo-graph/integration';

// https://astro.build/config
export default defineConfig({
  site: 'https://secureliving.com',
  vite: {
    plugins: [yaml()],
  },
  integrations: [
    mdx(),
    seoGraph({
      validateInternalLinks: {
        skip: (href) => href === '/sitemap-index.xml',
      },
    }),
    sitemap({
      serialize(item) {
        const url = item.url;

        if (url === 'https://secureliving.com/') {
          item.priority = 1.0;
        } else if (url.includes('/home-security-systems/') && url !== 'https://secureliving.com/home-security-systems/') {
          item.priority = 0.8;
        } else if (url === 'https://secureliving.com/home-security-systems/') {
          item.priority = 0.9;
        } else {
          item.priority = 0.3;
        }

        item.lastmod = new Date().toISOString();

        return item;
      },
    }),
  ],
});
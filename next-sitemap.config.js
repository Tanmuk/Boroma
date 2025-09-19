/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://boroma.site', // change to your production domain
  generateRobotsTxt: true,
  sitemapSize: 5000,
  exclude: [
    '/api/*',   // exclude APIs
    '/404',     // exclude 404 page
  ],
  transform: async (config, path) => {
    // Add anchors only for homepage
    if (path === '/') {
      return [
        { loc: '/', changefreq: 'daily', priority: 1.0 },
        { loc: '/#how-it-works', changefreq: 'weekly', priority: 0.8 },
        { loc: '/#pricing', changefreq: 'weekly', priority: 0.8 },
        { loc: '/#testimonials', changefreq: 'weekly', priority: 0.6 },
      ];
    }

    // Keep other pages normally
    return {
      loc: path,
      changefreq: 'weekly',
      priority: 0.7,
    };
  },
};

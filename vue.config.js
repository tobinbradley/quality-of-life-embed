const siteConfig = require("./data/config/site.js");

Object.keys(siteConfig).forEach((key) => {
  process.env[`VUE_APP_${key}`] = siteConfig[key];
});

module.exports = {
  baseUrl: process.env.NODE_ENV === 'production' ? '' : '/',
  pages: {
    embed: {
      entry: 'src/main.js',
      template: 'public/embed.html',
      filename: 'embed.html'
    },
    index: {
      entry: 'src/print.js',
      template: 'public/index.html',
      filename: 'index.html'
    }
  },
  css: {
    sourceMap: true
  }
};
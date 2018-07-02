const siteConfig = require('./data/config/site.js');
const dataConfig = require('./data/config/data.js');

module.exports = {
  locals: {
    siteConfig: siteConfig,
    dataConfig: dataConfig
  },
  include: {
    enabled: false
  }
};
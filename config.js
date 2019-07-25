var config = {};
//development
var env = process.env.NODE_ENV || 'development';
if(env === 'development'){
  config = require('./config.json');
} else if(env === 'production'){
    config = process.env;
}

module.exports = config;
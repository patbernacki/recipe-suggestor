const knexLib = require('knex');
const knexConfig = require('./knexfile');

const environment = process.env.NODE_ENV || 'development';
const knex = knexLib(knexConfig[environment]);

module.exports = knex;
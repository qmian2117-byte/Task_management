const knex = require('knex');
const knexConfig = require('../../knexfile');

// Determine environment
const environment = process.env.NODE_ENV || 'development';

// Initialize Knex with the appropriate configuration
const db = knex(knexConfig[environment]);

// Test database connection
db.raw('SELECT 1')
    .then(() => {
        console.log('Database connected successfully');
    })
    .catch((err) => {
        console.error('Database connection failed:', err.message);
    });

module.exports = db;

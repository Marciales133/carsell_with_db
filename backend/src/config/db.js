
import knex from 'knex';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const config = require('../../knexfile.cjs');

const db = knex(config.development);

export default db;
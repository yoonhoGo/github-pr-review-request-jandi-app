import { serverless } from '@probot/serverless-lambda';
import appFn = require('./app');

module.exports.probot = serverless(appFn)

import { serverless } from '@probot/serverless-lambda';
import appFn = require('../');

module.exports.probot = serverless(appFn)

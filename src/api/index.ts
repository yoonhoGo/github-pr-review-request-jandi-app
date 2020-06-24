import { serverless } from '@probot/serverless-lambda';
const appFn = require('../');

exports.handler = serverless(appFn)

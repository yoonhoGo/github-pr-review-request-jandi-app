import { serverless } from '@probot/serverless-lambda';
import appFn = require('../src');

exports.handler = serverless(appFn)

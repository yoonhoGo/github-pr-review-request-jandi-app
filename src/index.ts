import { Application, Context } from 'probot';
import got from 'got';
import Webhook from '@octokit/webhooks';
import * as jandiWebhook from './jandi-webhook';
import config from './config/environments';

/**
 * @example {
 *  yoonhoGo: {
 *    name: '고윤호',
 *    email: 'rhdbsgh0629@naver.com' // jandi에 등록된 email
 *  }
 * }
 */
interface GHUsernameMapFile {
  [username: string]: {
    name: string;
    email: string;
  }
}

/**
 * github username-jandi email file을 받아온다.
 */
function getEmailMapFile() {
  return got.get(config.MAP_FILE_URL).json<GHUsernameMapFile>();
}

const mapFile = getEmailMapFile();

function setTemplate(context: Context<Webhook.WebhookPayloadPullRequest>, email?: string): jandiWebhook.JandiPayload {
  const repositoryInfo: jandiWebhook.ConnectInfo = {
    title: 'Repository',
    description: context.payload.repository.full_name,
  };
  const assignessInfo: jandiWebhook.ConnectInfo = {
    title: 'Assignees',
    description: context.payload.sender.login,
    imageUrl: context.payload.sender.avatar_url,
  };
  const prInfo: jandiWebhook.ConnectInfo = {
    title: 'Pull Request Link',
    description: context.payload.pull_request.url,
  };

  return {
    body: `#${context.payload.number} ` + context.payload.pull_request.title,
    connectColor: '#FF0000',
    connectInfo: [
      repositoryInfo,
      assignessInfo,
      prInfo,
    ],
    email,
  };
}

export = (app: Application) => {
  app.on('pull_request.review_requested', async (context) => {
    const reviewerUsernames = context.payload.pull_request.requested_reviewers.map((reviewer) => reviewer.login);
    const bbrosEmails = await mapFile.then(list => reviewerUsernames.map(username => list[username]));
    const template = setTemplate(context, bbrosEmails.join(','));

    return jandiWebhook.send(template);
  });
}

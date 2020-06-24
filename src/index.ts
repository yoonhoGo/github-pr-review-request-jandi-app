import { Application, Context } from "probot";
import got from "got";
import Webhook from "@octokit/webhooks";
import * as jandiWebhook from "./jandi-webhook";
import config from "./config/environments";

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
  };
}

/**
 * github username-jandi email file을 받아온다.
 */
function getEmailMapFile() {
  return got.get(config.MAP_FILE_URL).json<GHUsernameMapFile>();
}

const mapFile = getEmailMapFile();

function setTemplate(
  context: Context<Webhook.WebhookPayloadPullRequest>,
  email?: string
): jandiWebhook.JandiPayload {
  const repositoryInfo: jandiWebhook.ConnectInfo = {
    title: "Repository",
    description: context.payload.repository.full_name,
  };
  const reviewers: jandiWebhook.ConnectInfo = {
    title: "Reviewers",
    description: context.payload.pull_request.requested_reviewers
      .map(({ login }) => `@${login}`)
      .join(", "),
  };
  const assignessInfo: jandiWebhook.ConnectInfo = {
    title: "Assignees",
    description: context.payload.sender.login,
    imageUrl: context.payload.sender.avatar_url,
  };
  const prInfo: jandiWebhook.ConnectInfo = {
    title: "Pull Request Link",
    description: context.payload.pull_request.html_url,
  };

  return {
    body: `#${context.payload.number} ` + context.payload.pull_request.title,
    connectColor: "#00FF00",
    connectInfo: [repositoryInfo, reviewers, assignessInfo, prInfo],
    email,
  };
}

async function requestReview(
  context: Context<Webhook.WebhookPayloadPullRequest>
) {
  const requestedReviewer = (context.payload as any)
    .requested_reviewer as Webhook.WebhookPayloadPullRequestReviewPullRequestUser;
  const bbrosEmails = await mapFile.then(
    (list) => list[requestedReviewer.login]?.email
  );
  const template = setTemplate(context, bbrosEmails);

  return jandiWebhook.send(template);
}

function errorHandler(
  err: Error,
  context: Context<Webhook.WebhookPayloadPullRequest>
) {
  const template: jandiWebhook.JandiPayload = {
    body: "PR Review Request 실패",
    connectColor: "#FF0000",
    connectInfo: [
      {
        title: err.name,
        description: err.message,
      },
      {
        title: "context",
        description: JSON.stringify(context.payload),
      },
    ],
    email: config.ADMIN_JANDI_EMAIL,
  };

  jandiWebhook.send(template);
}

export = (app: Application) => {
  app.on("pull_request.review_requested", async (context) =>
    requestReview(context).catch((err) => errorHandler(err, context))
  );
};

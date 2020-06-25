import { Context } from "probot";
import got from "got";
import Webhooks from "@octokit/webhooks";
import * as jandiWebhook from "../service/jandi-webhook";
import config from "../config/environments";

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
  // context: Context<Webhook.WebhookPayloadPullRequest>,
  payload: ContextPayload,
  email?: string
): jandiWebhook.JandiPayload {
  const repositoryInfo: jandiWebhook.ConnectInfo = {
    title: "Repository",
    description: payload.repository.full_name,
  };
  const reviewers: jandiWebhook.ConnectInfo = {
    title: "Reviewers",
    description: payload.pull_request.requested_reviewers
      .map(({ login }) => `@${login}`)
      .join(", "),
  };
  const assignessInfo: jandiWebhook.ConnectInfo = {
    title: "Assignees",
    description: payload.sender.login,
    imageUrl: payload.sender.avatar_url,
  };
  const prInfo: jandiWebhook.ConnectInfo = {
    title: "Pull Request Link",
    description: payload.pull_request.html_url,
  };

  return {
    body: `#${payload.number} ` + payload.pull_request.title,
    connectColor: "#00FF00",
    connectInfo: [repositoryInfo, reviewers, assignessInfo, prInfo],
    email,
  };
}

export type ContextWithRequestedReviewer = Context<
  Webhooks.WebhookPayloadPullRequest & {
    requested_reviewer: Webhooks.WebhookPayloadPullRequestReviewPullRequestUser;
  }
>;

export type ContextPayload = {
  number: number;
  repository: Webhooks.PayloadRepository;
  pull_request: Webhooks.WebhookPayloadPullRequestPullRequest;
  sender: Webhooks.WebhookPayloadPullRequestSender;
  requested_reviewer: Webhooks.WebhookPayloadPullRequestReviewPullRequestUser;
};

export async function requestReview(payload: ContextPayload) {
  const requestedReviewer = payload.requested_reviewer;
  const bbrosEmail = await mapFile.then(
    (list) => list[requestedReviewer.login]?.email
  );
  const template = setTemplate(payload, bbrosEmail);
  
  return jandiWebhook.send(template);
}

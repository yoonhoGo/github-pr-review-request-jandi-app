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

async function getUser(
  username: string,
  field: "name" | "email" = "name"
): Promise<string | undefined> {
  const users = await mapFile;

  return users[username]?.[field];
}

async function makeRepositoryInfo(
  repository: Webhooks.PayloadRepository
): Promise<jandiWebhook.ConnectInfo> {
  return {
    title: "Repository",
    description: repository.full_name,
  };
}

async function makeReviewersInfo(
  pullRequest: Webhooks.WebhookPayloadPullRequestPullRequest
): Promise<jandiWebhook.ConnectInfo> {
  const reviewers = await Promise.all(
    pullRequest.requested_reviewers.map(
      async ({ login }) => `@${(await getUser(login)) || login}`
    )
  );
  const reviewersDescription = reviewers.join(", ");

  return {
    title: "Reviewers",
    description: reviewersDescription,
  };
}

async function makeAssignessInfo(
  sender: Webhooks.WebhookPayloadPullRequestSender
): Promise<jandiWebhook.ConnectInfo> {
  const assignee = (await getUser(sender.login)) || sender.login;

  return {
    title: "Assignees",
    description: assignee,
    imageUrl: sender.avatar_url,
  };
}

async function makePRInfo(
  pullRequest: Webhooks.WebhookPayloadPullRequestPullRequest
): Promise<jandiWebhook.ConnectInfo> {
  return {
    title: "Pull Request Link",
    description: pullRequest.html_url,
  };
}

async function setTemplate(
  email: string,
  payload: ContextPayload
): Promise<jandiWebhook.JandiPayload> {
  const repositoryInfo = await makeRepositoryInfo(payload.repository);
  const reviewers = await makeReviewersInfo(payload.pull_request);
  const assignessInfo = await makeAssignessInfo(payload.sender);
  const prInfo = await makePRInfo(payload.pull_request);

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
  const bbrosEmail = await getUser(requestedReviewer.login, "email");

  if (!bbrosEmail) {
    return;
  }

  const template = await setTemplate(bbrosEmail, payload);

  console.log("template", template);

  return jandiWebhook.send(template);
}

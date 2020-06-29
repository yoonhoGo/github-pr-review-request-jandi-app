import Webhooks from "@octokit/webhooks";
import * as jandiWebhook from "../service/jandi-webhook";
import config from "../config/environments";

export type ContextPayload = {
  number: number;
  repository: Webhooks.PayloadRepository;
  pull_request: Webhooks.WebhookPayloadPullRequestPullRequest;
  sender: Webhooks.WebhookPayloadPullRequestSender;
  requested_reviewer: Webhooks.WebhookPayloadPullRequestReviewPullRequestUser;
};

export function errorHandler(
  err: Error,
  payload: ContextPayload,
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
        description: JSON.stringify(payload),
      },
    ],
    email: config.ADMIN_JANDI_EMAIL,
  };

  console.error(err);

  jandiWebhook.send(template);
}

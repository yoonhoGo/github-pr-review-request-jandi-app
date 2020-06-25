import { Context } from "probot";
import Webhooks from "@octokit/webhooks";
import * as jandiWebhook from "../service/jandi-webhook";
import config from "../config/environments";

export function errorHandler(
  err: Error,
  context: Context<Webhooks.WebhookPayloadPullRequest>
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

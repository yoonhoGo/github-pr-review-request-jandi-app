import createScheduler from "probot-scheduler";
import { Application, Context, Octokit } from "probot";
import Webhooks from "@octokit/webhooks";
import {
  requestReview,
  ContextPayload,
} from "../hanlder/requested-review-handler";
import config from "../config/environments";

function requestToReviewer(
  reviewer: Octokit.PullsListResponseItemRequestedReviewersItem,
  payload: Omit<ContextPayload, "requested_reviewer">
) {
  return requestReview({
    ...payload,
    requested_reviewer: reviewer,
  });
}

function requestEachReviewers(
  pullRequest: Octokit.PullsListResponseItem,
  context: Context<Webhooks.WebhookPayloadRepository>
) {
  const prPayload = {
    number: pullRequest.number,
    action: context.payload.action,
    pull_request: pullRequest as any as Webhooks.WebhookPayloadPullRequestPullRequest,
    repository: context.payload.repository,
    sender: pullRequest.assignee || pullRequest.user,
  };

  return pullRequest.requested_reviewers.map((reviewer) =>
    requestToReviewer(reviewer, prPayload)
  );
}

function getOpenedPulls(context: Context<Webhooks.WebhookPayloadRepository>) {
  const { owner, name } = context.payload.repository;

  return context.github.pulls.list({
    state: "open",
    owner: owner.login,
    repo: name,
  });
}

export default (robot: Application) => {
  createScheduler(robot, {
    delay: config.DISABLE_DELAY,
    interval: config.INTERVAL_TIME,
  });

  robot.on(
    "schedule.repository",
    async (context: Context<Webhooks.WebhookPayloadRepository>) => {
      // this event is triggered on an interval, which is 1 hr by default
      const pulls = await getOpenedPulls(context);

      pulls.data.map((pullRequest) =>
        requestEachReviewers(pullRequest, context)
      );
    }
  );
};

import { Application } from "probot";
import { errorHandler, ContextPayload } from "./hanlder/error-hanlder";
import { requestReview } from "./hanlder/requested-review-handler";
import scheduler from "./scheduler";

export = (app: Application) => {
  scheduler(app);

  app.on("pull_request.review_requested", async (context) => {
    const payload = (context.payload as any) as ContextPayload;
    requestReview(payload).catch((err) => errorHandler(err, payload));
  });
};

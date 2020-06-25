import { Application } from "probot";
import { errorHandler } from "./hanlder/error-hanlder";
import { requestReview } from "./hanlder/requested-review-handler";
import scheduler from './scheduler';

export = (app: Application) => {
  scheduler(app);

  app.on("pull_request.review_requested", async (context) =>
    requestReview(context.payload as any).catch((err) => errorHandler(err, context))
  );
};

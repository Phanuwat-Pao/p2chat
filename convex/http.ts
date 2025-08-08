import { httpRouter } from "convex/server";
import { lineWebhook } from "./line";

const http = httpRouter();

http.route({
  path: "/line/webhook",
  method: "POST",
  handler: lineWebhook,
});

export default http;

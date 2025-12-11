import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();
crons.weekly(
  "deleteOldEvents",
  {
    dayOfWeek: "sunday",
    hourUTC: 0,
    minuteUTC: 0,
  },
  internal.line.deleteOldEvents,
);

export default crons;

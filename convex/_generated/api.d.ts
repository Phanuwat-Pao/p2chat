/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as http from "../http.js";
import type * as line from "../line.js";
import type * as models_ai from "../models/ai.js";
import type * as myFunctions from "../myFunctions.js";
import type * as node from "../node.js";
import type * as vips from "../vips.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  http: typeof http;
  line: typeof line;
  "models/ai": typeof models_ai;
  myFunctions: typeof myFunctions;
  node: typeof node;
  vips: typeof vips;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};

"use node";
import { saveMessage } from "@convex-dev/agent";
import {
  messagingApi,
  validateSignature,
  type WebhookRequestBody,
} from "@line/bot-sdk";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { agent } from "./models/ai";

export const processLineWebhook = internalAction({
  args: {
    bodyText: v.string(),
    signature: v.string(),
    channelSecret: v.string(),
  },
  handler: async (ctx, { bodyText, signature, channelSecret }) => {
    if (!process.env.LINE_CHANNEL_SECRET) {
      throw new Error("LINE_CHANNEL_SECRET is not set");
    }
    if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
      throw new Error("LINE_CHANNEL_ACCESS_TOKEN is not set");
    }

    const isSignatureValid = validateSignature(
      bodyText,
      channelSecret,
      signature,
    );

    const bodyJson: WebhookRequestBody = JSON.parse(bodyText);

    const vips = await ctx.runMutation(internal.line.lineEvent, {
      isSignatureValid,
      signature,
      event: bodyJson,
    });

    if (isSignatureValid) {
      for (const event of bodyJson.events) {
        let isVipInChat = false;
        let isMentioned = false;
        let isQuoted = false;
        switch (event.type) {
          case "message":
            switch (event.message.type) {
              case "text":
                if (event.message.quotedMessageId) {
                  isQuoted = true;
                }
                if (event.message.mention) {
                  for (const mention of event.message.mention?.mentionees) {
                    if (
                      mention.type === "user" &&
                      process.env.LINE_USER_ID &&
                      mention.userId === process.env.LINE_USER_ID
                    ) {
                      isMentioned = true;
                      if (isVipInChat) {
                        break;
                      }
                      const lineClient = new messagingApi.MessagingApiClient({
                        channelAccessToken:
                          process.env.LINE_CHANNEL_ACCESS_TOKEN,
                      });
                      let members: string[] = [];
                      switch (event.source.type) {
                        case "user":
                          isVipInChat = vips.some(
                            (vip) => vip.lineUserId === event.source.userId,
                          );
                          break;
                        case "group":
                          let groupMembers: messagingApi.MembersIdsResponse;
                          do {
                            groupMembers = await lineClient.getGroupMembersIds(
                              event.source.groupId,
                            );
                            members = groupMembers.memberIds;
                            isVipInChat = vips.some((vip) =>
                              members.includes(vip.lineUserId),
                            );
                            if (isVipInChat) {
                              break;
                            }
                          } while (groupMembers?.next);
                          break;
                        case "room":
                          let roomMembers: messagingApi.MembersIdsResponse;
                          do {
                            roomMembers = await lineClient.getRoomMembersIds(
                              event.source.roomId,
                            );
                            members = roomMembers.memberIds;
                            isVipInChat = vips.some((vip) =>
                              members.includes(vip.lineUserId),
                            );
                            if (isVipInChat) {
                              break;
                            }
                          } while (roomMembers?.next);
                          break;
                      }
                    }
                  }
                }
                if (
                  (isMentioned || event.source.type === "user") &&
                  isVipInChat
                ) {
                  let prompt = event.message.text;
                  const {
                    thread: { threadId },
                  } = await agent.createThread(ctx);
                  const { messageId } = await saveMessage(
                    ctx,
                    components.agent,
                    {
                      threadId,
                      prompt,
                    },
                  );
                  await ctx.scheduler.runAfter(
                    0,
                    internal.line.generateResponseAsync,
                    {
                      threadId,
                      promptMessageId: messageId,
                    },
                  );
                }
                break;
            }
            break;
        }
      }
      return new Response("OK");
    } else {
      return new Response("Invalid signature", { status: 400 });
    }
  },
});

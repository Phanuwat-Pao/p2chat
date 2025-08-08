"use node";
import {
  messagingApi,
  validateSignature,
  type WebhookRequestBody,
} from "@line/bot-sdk";
import { generateText } from "ai";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { openrouter } from "./models/ai";

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

    const lineClient = new messagingApi.MessagingApiClient({
      channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    });

    if (isSignatureValid) {
      for (const event of bodyJson.events) {
        let isVipInChat = false;
        let isMentioned = false;
        let isQuoted = false;
        if (event.source.type === "user") {
          isVipInChat = vips.some(
            (vip) => vip.lineUserId === event.source.userId,
          );
        }
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
                      let members: string[] = [];
                      switch (event.source.type) {
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
                  const result = await generateText({
                    //@ts-ignore
                    model: openrouter("@preset/p2chat"),
                    prompt,
                  });
                  await lineClient.replyMessage({
                    replyToken: event.replyToken,
                    messages: [
                      {
                        type: "text",
                        text: result.text,
                        quoteToken: event.message.id,
                      },
                    ],
                  });
                }
                break;
            }
            break;
        }
      }
      return "OK";
    } else {
      return "Invalid signature";
    }
  },
});

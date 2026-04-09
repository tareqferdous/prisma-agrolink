import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { chatService } from "./chat.service";
import { chatRequestSchema } from "./chat.validation";

const chatWithAssistant = catchAsync(async (req: Request, res: Response) => {
  const validated = chatRequestSchema.parse(req.body);
  const result = await chatService.getAssistantReply(validated.message);

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Assistant reply generated successfully",
    data: result,
  });
});

export const chatController = {
  chatWithAssistant,
};

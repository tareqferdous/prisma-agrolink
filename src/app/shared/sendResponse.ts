import { Response } from "express";

interface IResponseData<T> {
  httpStatusCode: number;
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filterMeta?: {
    locations: string[];
    priceRange: { min: number; max: number };
    categories: string[];
  };
}

export const sendResponse = <T>(
  res: Response,
  responseData: IResponseData<T>,
) => {
  const { httpStatusCode, success, message, data, meta, filterMeta } =
    responseData;

  res.status(httpStatusCode).json({
    success,
    message,
    data,
    meta,
    ...(filterMeta && { filterMeta }),
  });
};

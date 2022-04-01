import type { MiddlewareObj } from "@middy/core";
import { isHttpError } from "http-errors";

const customErrorHandler = () => {
  const onError: MiddlewareObj["onError"] = async ({ error, response }) => {
    response.statusCode = isHttpError(error) ? error.statusCode : 500;

    response.body = JSON.stringify({
      error: true,
      type: error.name,
      message: error.message,
    });

    return response;
  };

  return {
    onError,
  } as MiddlewareObj;
};

export { customErrorHandler };

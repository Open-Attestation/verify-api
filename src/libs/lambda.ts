import middy from "@middy/core";
import cors from "@middy/http-cors";
import jsonBodyParser from "@middy/http-json-body-parser";

import { customErrorHandler } from "@middlewares/error";

export const middyfy = (handler) => {
  return middy(handler)
    .use(jsonBodyParser()) // Parses the request body when it's a JSON and converts it to an object
    .use(cors()) // Sets header Access-Control-Allow-Origin=*
    .use(customErrorHandler());
};

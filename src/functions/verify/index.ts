import type { AWS } from "@serverless/typescript";
import { handlerPath } from "@libs/handlerResolver";

export default <AWS["functions"][string]>{
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: "post",
        path: "verify",
        request: {},
      },
    },
  ],
};

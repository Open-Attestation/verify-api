import type { Context } from "aws-lambda";
import { main } from "@functions/verify/handler";
import sample from "@fixtures/pdt_pcr_notarized_with_nric_wrapped.json";

describe("middlewares", () => {
  it("should successfully parse request body", async () => {
    const event = {
      httpMethod: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    };
    const context = {} as Context;
    const { statusCode, body } = await main(event, context);
    const parsedBody = JSON.parse(body);

    expect(statusCode).toStrictEqual(200);
    expect(parsedBody).toHaveProperty("diagnostics");
    expect(parsedBody.diagnostics).toStrictEqual([
      { message: "The document does not match OpenAttestation schema 2.0" },
      { message: "document - must be object" },
    ]);
  });

  it("should return 422 for invalid request body", async () => {
    const event = {
      httpMethod: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{foo",
    };
    const context = {} as Context;
    const { statusCode, body } = await main(event, context);
    const parsedBody = JSON.parse(body);

    expect(statusCode).toStrictEqual(422);
    expect(parsedBody.error).toStrictEqual(true);
    expect(parsedBody.type).toStrictEqual("UnprocessableEntityError");
    expect(parsedBody.message).toStrictEqual("Content type defined as JSON but an invalid JSON was provided");
  });

  it("should have Access-Control-Allow-Origin header", async () => {
    const event = {
      httpMethod: "POST",
    };
    const context = {} as Context;
    const response = await main(event, context);

    expect(response.headers["Access-Control-Allow-Origin"]).toStrictEqual("*");
  });
});

describe("verify", () => {
  it("should verify a valid document", async () => {
    const { statusCode, body } = await main({ body: sample }, {} as any);
    const parsedBody = JSON.parse(body);

    expect(statusCode).toStrictEqual(200);
    expect(parsedBody).toHaveProperty("isValid");
    expect(parsedBody.isValid).toStrictEqual(true);
    expect(parsedBody).toHaveProperty("fragments");
    expect(parsedBody).toHaveProperty("diagnostics");
    expect(parsedBody.diagnostics).toStrictEqual([]);
  });
});

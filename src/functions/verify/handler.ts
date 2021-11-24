import type { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway";
import { SignedWrappedDocument, OpenAttestationDocument, utils } from "@govtechsg/open-attestation";
import { formatJSONResponse } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import { isValid, getVerifier } from "@libs/oa-verify";

const verify: ValidatedEventAPIGatewayProxyEvent<SignedWrappedDocument<OpenAttestationDocument>> = async ({ body }) => {
  const verifier = getVerifier();

  const fragments = await verifier(body);
  const diagnostics = utils.diagnose({ version: "2.0", kind: "signed", document: body, mode: "strict" });

  return formatJSONResponse({ isValid: isValid(fragments), fragments, diagnostics });
};

export const main = middyfy(verify);

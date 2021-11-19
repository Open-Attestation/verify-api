import type { ValidatedEventAPIGatewayProxyEvent } from "@libs/apiGateway";
import { SignedWrappedDocument, OpenAttestationDocument, utils } from "@govtechsg/open-attestation";
import { formatJSONResponse } from "@libs/apiGateway";
import { middyfy } from "@libs/lambda";
import { isValid, getVerifier } from "@libs/oaVerify";

const verify: ValidatedEventAPIGatewayProxyEvent<SignedWrappedDocument<OpenAttestationDocument>> = async ({ body }) => {
  const verifier = getVerifier();

  const fragments = await verifier(body);
  const _isValid = isValid(fragments);
  const diagnostics = utils.diagnose({ version: "2.0", kind: "signed", document: body, mode: "strict" });

  return formatJSONResponse({ isValid: _isValid, fragments, diagnostics });
};

export const main = middyfy(verify);

import { isValid, verificationBuilder, openAttestationVerifiers, CodedError } from "@govtechsg/oa-verify";
import type {
  Verifier,
  SkippedVerificationFragment,
  ValidVerificationFragment,
  InvalidVerificationFragment,
  ErrorVerificationFragment,
  VerificationFragmentType,
} from "@govtechsg/oa-verify";
import { getData, utils } from "@govtechsg/open-attestation";
import { providers } from "ethers";
import { Resolver, DIDCache, DIDResolutionResult } from "did-resolver";
import { getResolver } from "ethr-did-resolver";
import * as NodeCache from "node-cache";

type AllowedIssuersValidFragment = ValidVerificationFragment<Array<string | undefined>>;
type AllowedIssuersInvalidFragment = InvalidVerificationFragment<Array<string | undefined>>;
type AllowedIssuersErrorFragment = ErrorVerificationFragment<any>;

type AllowedIssuersFragment =
  | AllowedIssuersValidFragment
  | AllowedIssuersErrorFragment
  | AllowedIssuersInvalidFragment
  | SkippedVerificationFragment;

type VerifierType = Verifier<AllowedIssuersFragment>;

enum VerifyAllowedIssuersCode {
  UNEXPECTED_ERROR = 0,
  INVALID_IDENTITY = 1,
  SKIPPED = 2,
  UNSUPPORTED_V3_DOCUMENT = 3,
}

const NETWORK_NAME = process.env.NETWORK_NAME || "ropsten";
const INFURA_API_KEY = process.env.INFURA_API_KEY; // eslint-disable-line prefer-destructuring
const WHITELISTED_ISSUERS = process.env.WHITELISTED_ISSUERS?.split(",") || ["gov.sg", "openattestation.com"];

const didResolutionCache = new NodeCache({ stdTTL: 1 * 60 * 60 }); // 1 hour
const customCache: DIDCache = async (parsed, resolve) => {
  if (parsed.params && parsed.params["no-cache"] === "true") {
    const doc = await resolve();
    return doc;
  }

  const cachedResult = didResolutionCache.get<DIDResolutionResult>(parsed.didUrl);
  if (cachedResult) return cachedResult;

  const doc = await resolve();
  didResolutionCache.set(parsed.didUrl, doc);
  return doc;
};

const provider = INFURA_API_KEY ? new providers.InfuraProvider(NETWORK_NAME, INFURA_API_KEY) : undefined;
const ethrDidResolver = INFURA_API_KEY
  ? getResolver({ name: NETWORK_NAME, rpcUrl: `https://${NETWORK_NAME}.infura.io/v3/${INFURA_API_KEY}` })
  : undefined;
const resolver = new Resolver(ethrDidResolver, { cache: customCache });

export const isWhitelisted = (identity: string): boolean => {
  return (
    WHITELISTED_ISSUERS.some((issuer) => identity.toLowerCase().endsWith(`.${issuer}`)) ||
    WHITELISTED_ISSUERS.includes(identity.toLowerCase())
  );
};

const verifyAllowedIssuersMethod: VerifierType["verify"] = async (document) => {
  const name = "VerifyAllowedIssuers";
  const type: VerificationFragmentType = "ISSUER_IDENTITY";

  try {
    if (utils.isWrappedV2Document(document)) {
      const documentData = getData(document);
      const identities = documentData.issuers.map((issuer) => issuer.identityProof?.location);
      // every issuers must be whitelisted
      const valid =
        identities.length > 0 && identities.every((identity) => (identity ? isWhitelisted(identity) : false));
      if (!valid) {
        return <AllowedIssuersFragment>{
          name,
          type,
          data: identities,
          status: "INVALID" as const,
          reason: {
            code: VerifyAllowedIssuersCode.INVALID_IDENTITY,
            codeString: VerifyAllowedIssuersCode[VerifyAllowedIssuersCode.INVALID_IDENTITY],
            message: `No issuers allowed by this platform found. Valid issuers are ${WHITELISTED_ISSUERS.join(",")}`,
          },
        };
      }
      return <AllowedIssuersFragment>{
        name,
        type,
        data: identities,
        status: "VALID" as const,
      };
    }
    // TODO: support for V3 is available now
    throw new CodedError(
      "Verify does not support v3 document",
      VerifyAllowedIssuersCode.UNSUPPORTED_V3_DOCUMENT,
      VerifyAllowedIssuersCode[VerifyAllowedIssuersCode.UNSUPPORTED_V3_DOCUMENT]
    );
  } catch (e) {
    return <AllowedIssuersFragment>{
      name,
      type,
      data: e,
      reason: {
        code: e.code || VerifyAllowedIssuersCode.UNEXPECTED_ERROR,
        codeString: e.codeString || VerifyAllowedIssuersCode[VerifyAllowedIssuersCode.UNEXPECTED_ERROR],
        message: e.message,
      },
      status: "ERROR" as const,
    };
  }
};

export const verifyAllowedIssuers: VerifierType = {
  skip: () => {
    throw new Error("This verifier is never skipped");
  },
  test: () => true,
  verify: verifyAllowedIssuersMethod,
};

let verify;
const getVerifier = () => {
  if (!verify) {
    verify = verificationBuilder([...openAttestationVerifiers, verifyAllowedIssuers], { provider, resolver });
  }

  return verify;
};

export { isValid, getVerifier };

import { isValid, verificationBuilder, openAttestationVerifiers, CodedError } from "@govtechsg/oa-verify";
import type {
  verify as defaultVerify,
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
import { MultiProviderConfiguration } from "ethr-did-resolver/lib/configuration";
import NodeCache from "node-cache";

/** ========= TYPES ========= */
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
enum NETWORKS {
  SEPOLIA = "sepolia",
  MAINNET = "mainnet",
}
/* ========= Environment Variables ========= */
const NETWORK_NAME = process.env.NETWORK_NAME || NETWORKS.SEPOLIA;

const INFURA_API_KEY = process.env.INFURA_API_KEY; // eslint-disable-line prefer-destructuring
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY; // eslint-disable-line prefer-destructuring
const WHITELISTED_ISSUERS = process.env.WHITELISTED_ISSUERS?.split(",") || ["gov.sg", "openattestation.com"];

/**
 * Returns true if issuer identity is whitelisted
 * @param identity
 * @returns
 */
export const isWhitelisted = (identity: string): boolean => {
  return (
    WHITELISTED_ISSUERS.some((issuer) => identity.toLowerCase().endsWith(`.${issuer}`)) ||
    WHITELISTED_ISSUERS.includes(identity.toLowerCase())
  );
};

/**
 * Custom verification method to only allow whitelisted issuers
 * @param document
 * @returns
 */
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

/**
 * Custom verifier to only allow whitelisted issuers
 *
 * Refer to: https://github.com/Open-Attestation/oa-verify#extending-custom-verification
 */
export const verifyAllowedIssuers: VerifierType = {
  skip: () => {
    throw new Error("This verifier is never skipped");
  },
  test: () => true,
  verify: verifyAllowedIssuersMethod,
};

/* ========= Instantiate a single instance of cache, verify, provider, resolver ========= */
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

let verify: typeof defaultVerify;

/**
 * Returns a cached instance of `verify()` that was only instantiated once
 * @returns
 */
const getVerifier = () => {
  if (!verify) {
    const config: { providers: providers.FallbackProviderConfig[]; resolvers: MultiProviderConfiguration } = {
      providers: [],
      resolvers: { networks: [] },
    };

    /**
     * 1. Infura - Provider Priority: 1, Resolver Index: 1
     * 2. Alchemy - Provider Priority: 2, Resolver Index: 0
     *
     * Provider: Lower-value priorities are favoured: https://docs.ethers.io/v5/api/providers/other/#FallbackProviderConfig
     * Resolver: Infura resolver should be last item in array so that it will be used first
     */
    if (INFURA_API_KEY) {
      const infuraProviderSepolia = new providers.InfuraProvider(NETWORKS.SEPOLIA, INFURA_API_KEY);
      const infuraProviderMainnet = new providers.InfuraProvider(NETWORKS.MAINNET, INFURA_API_KEY);
      config.providers.push({
        provider: NETWORK_NAME === NETWORKS.MAINNET ? infuraProviderMainnet : infuraProviderSepolia,
        priority: 1,
        stallTimeout: 4000,
      });
      config.resolvers.networks.unshift({ name: NETWORKS.MAINNET, provider: infuraProviderMainnet });
    }
    if (ALCHEMY_API_KEY) {
      // Handling sepolia network differently because ethers v5 AlchemyProvider doesn't support Sepolia
      // TODO: use ethers v6 AlchemyProvider once ethers version is able to be bumped
      const alchemyProviderSepolia = new providers.StaticJsonRpcProvider(
        `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
        NETWORKS.SEPOLIA
      );
      const alchemyProviderMainnet = new providers.AlchemyProvider(NETWORKS.MAINNET, ALCHEMY_API_KEY);

      config.providers.push({
        provider: NETWORK_NAME === NETWORKS.MAINNET ? alchemyProviderMainnet : alchemyProviderSepolia,
        priority: 2,
      });
      config.resolvers.networks.unshift({ name: NETWORKS.MAINNET, provider: alchemyProviderMainnet });
    }

    const provider = config.providers.length > 0 ? new providers.FallbackProvider(config.providers) : undefined;
    const resolver =
      config.resolvers.networks.length > 0
        ? new Resolver(getResolver(config.resolvers), { cache: customCache })
        : undefined;

    verify = verificationBuilder([...openAttestationVerifiers, verifyAllowedIssuers], {
      provider,
      resolver,
      network: NETWORK_NAME,
    });
  }

  return verify;
};

export { isValid, getVerifier };

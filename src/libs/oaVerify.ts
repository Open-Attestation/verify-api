import { isValid, verificationBuilder, openAttestationVerifiers } from "@govtechsg/oa-verify";
import { providers } from "ethers";
import { Resolver, DIDCache, DIDResolutionResult } from "did-resolver";
import { getResolver } from "ethr-did-resolver";
import NodeCache from "node-cache";

const NETWORK_NAME = process.env.NETWORK_NAME || "ropsten";
const INFURA_API_KEY = process.env.INFURA_API_KEY;

const didResolutionCache = new NodeCache({ stdTTL: 1 * 60 * 60 }); // 1 hour
const customCache: DIDCache = async (parsed, resolve) => {
  if (parsed.params && parsed.params["no-cache"] === "true") return await resolve();

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

let verify;
const getVerifier = () => {
  if (!verify) {
    verify = verificationBuilder(openAttestationVerifiers, { provider, resolver });
  }

  return verify;
};

export { isValid, getVerifier };

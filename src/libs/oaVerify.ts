import { isValid, verificationBuilder, openAttestationVerifiers, createResolver } from "@govtechsg/oa-verify";
import { providers } from "ethers";

const NETWORK_NAME = process.env.REACT_APP_NETWORK_NAME || "ropsten";
const INFURA_API_KEY = process.env.REACT_APP_INFURA_API_KEY;

const provider = INFURA_API_KEY ? new providers.InfuraProvider(NETWORK_NAME, INFURA_API_KEY) : undefined;
const resolver = INFURA_API_KEY
  ? createResolver({
      ethrResolverConfig: {
        networks: [{ name: "mainnet", rpcUrl: `https://mainnet.infura.io/v3/${INFURA_API_KEY}` }],
      },
    })
  : undefined;

let verify;
const getVerifier = () => {
  if (!verify) {
    verify = verificationBuilder(openAttestationVerifiers, { provider, resolver });
  }

  return verify;
};

export { isValid, getVerifier };

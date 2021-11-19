import { isValid, verificationBuilder, openAttestationVerifiers } from "@govtechsg/oa-verify";
import { ethers } from "ethers";
import { NETWORK_NAME, INFURA_API_KEY } from "../config";

const provider = new ethers.providers.FallbackProvider(
  [
    { priority: 1, provider: new ethers.providers.InfuraProvider(NETWORK_NAME, INFURA_API_KEY) },
    // { priority: 10, provider: new ethers.providers.AlchemyProvider(NETWORK_NAME, ALCHEMY_API_KEY) },
  ],
  1
);

let verify;
const getVerifier = () => {
  if (!verify) {
    verify = verificationBuilder(openAttestationVerifiers, { provider });
  }

  return verify;
};

export { isValid, getVerifier };

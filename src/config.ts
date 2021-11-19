export const IS_MAINNET = process.env.NODE_ENV === "production";
export const NETWORK_NAME = IS_MAINNET ? "homestead" : "ropsten"; // expected by ethers
export const INFURA_API_KEY = process.env.INFURA_API_KEY;

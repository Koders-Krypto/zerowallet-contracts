import { PublicClient, createPublicClient, http } from "viem";
import { PimlicoPaymasterClient, createPimlicoPaymasterClient } from "permissionless/clients/pimlico";
import { NetworkUtil } from "./networks";
import { ethers, formatUnits } from "ethers";


  // ERC-20 token ABI (replace with the actual ABI)
  const ERC20_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address owner) view returns (uint256)",
    "function transfer(address to, uint256 value) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 value) returns (bool)",
    "function transferFrom(address from, address to, uint256 value) returns (bool)"
  ];



export const publicClient = (chainId: number): PublicClient => {

  return createPublicClient({
    transport: http(NetworkUtil.getNetworkById(chainId)?.url),
  });
}

export const chain: any = {
  1: 'ethereum',
  5: 'goerli',
  84531: 'base-goerli'
}

// export const paymasterClient = (chainId: number): PimlicoPaymasterClient => {
//   return createPimlicoPaymasterClient({
//     transport: http(
//       `https://api.pimlico.io/v2/${chain[chainId]}/rpc?apikey=${process.env.NEXT_PUBLIC_PIMLICO_API_KEY}`,
//     ),
//   });
// }

export const generateRandomBuffer = (): ArrayBuffer => {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return arr.buffer;
};

export const base64UrlEncode = (challenge: ArrayBuffer): string => {
  return Buffer.from(challenge)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
};




export async function getTokenBalance(tokenAddress: string, account: string, provider: any) {
  // Ethereum provider (you can use Infura or any other provider)

  // Connect to the ERC-20 token contract
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

  // Get the balance using the balanceOf function
  const balance = await tokenContract.balanceOf(account);
  console.log(balance)
  const decimals = await tokenContract.decimals()

  return formatUnits(balance, decimals);
}


export async function getTokenDecimals(tokenAddress: string,  provider: any) {
  // Ethereum provider (you can use Infura or any other provider)


  // Connect to the ERC-20 token contract
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

  const decimals = await tokenContract.decimals()

  return decimals;
}


export async function buildTransferToken(tokenAddress: string, to: string, value: BigInt, provider: any) {
  // Ethereum provider (you can use Infura or any other provider)


const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

const data = await tokenContract.transfer.populateTransaction(to, value);

return data.data;

}


export function formatTime(seconds: number) {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return `${days ? days + " days, " : ""} ${hours ? hours + " hours, "  : ""} ${ minutes ? minutes + " minutes, " : ""} ${remainingSeconds + " seconds"}`;
}
import { AbstractProvider, ethers } from "ethers"
import { NetworkUtil } from "./networks";


export const getJsonRpcProvider = async(chainId: string): Promise<AbstractProvider> => {

    return new ethers.JsonRpcProvider(NetworkUtil.getNetworkById(parseInt(chainId))?.url)
}
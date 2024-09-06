import { Contract, Interface, ZeroAddress, getBytes } from "ethers";
import { getJsonRpcProvider } from "./web3";
import AutoDCASessionModule from "./AutoDCASessionModule.json";
import {  Address, Hex, PrivateKeyAccount,  pad } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
    getClient,
    getModule,
    getAccount,
    installModule,
    isModuleInstalled,
    ModuleType,
  } from "@rhinestone/module-sdk";
import { NetworkUtil } from "./networks";
import { SafeSmartAccountClient, getSmartAccountClient } from "./permissionless";
import EntryPoint from "./EntryPoint.json"
import { ENTRYPOINT_ADDRESS_V07_TYPE, UserOperation } from "permissionless/types";   
import { ENTRYPOINT_ADDRESS_V07, getPackedUserOperation } from "permissionless";


const autoDCAModule = "0x679f144fCcc63c5Af7bcDb2BAda756f1bd40CE3D"




export const getSessionData = async (chainId: string, sessionKey: string, sessionId: string): Promise<any> => {


    const bProvider = await getJsonRpcProvider(chainId)

    const autoDCA = new Contract(
        autoDCAModule,
        AutoDCASessionModule.abi,
        bProvider
    )


    const sesionData = await autoDCA.sessionKeyData(sessionKey, sessionId);

    return sesionData;

}



export const sendTransaction = async (chainId: string, sessionId: string, recipient: string, amount: bigint, data: Hex, walletProvider: PrivateKeyAccount, safeAccount: Hex): Promise<any> => {


    const abi = [
        'function execute(address sessionKey, uint256 sessionId, address to, uint256 value, bytes calldata data) external',
      ]

    const execCallData = new Interface(abi).encodeFunctionData('execute', [walletProvider.address, parseInt(sessionId), recipient, amount, data])

    const call = { to: autoDCAModule as Hex, value: 0n, data: execCallData as Hex }

    const key = BigInt(pad(autoDCAModule as Hex, {
        dir: "right",
        size: 24,
      }) || 0
    )

    const signUserOperation = async function signUserOperation(userOperation: UserOperation<"v0.7">) {

    const provider = await getJsonRpcProvider(chainId)

    const entryPoint = new Contract(
        ENTRYPOINT_ADDRESS_V07,
        EntryPoint.abi,
        provider
    )
    
    let typedDataHash = getBytes(await entryPoint.getUserOpHash(getPackedUserOperation(userOperation)))

    return await walletProvider.signMessage({ message:  { raw: typedDataHash}}) 
    }

    const smartAccount = await getSmartAccountClient(chainId, safeAccount, key, walletProvider, signUserOperation)


    return await smartAccount.sendTransaction(call);
}







export const isInstalled = async (chainId: number, safeAddress: Address, address: Address, type: ModuleType): Promise<boolean> => {


    const client = getClient({ rpcUrl: NetworkUtil.getNetworkById(chainId)?.url!});


    // Create the account object
    const account = getAccount({
            address: safeAddress,
            type: "safe",
        });


    const accountModule = getModule({
        module: address,
        initData: '0x',
        type:  type ,
      });

     
    try {  
    return await isModuleInstalled({
        client,
        account,
        module: accountModule,
      });
    }
    catch {
        return false;
    }

}


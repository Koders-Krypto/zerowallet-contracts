import { Contract, ZeroAddress, getBytes} from "ethers";
import { ethers } from 'ethersv5';
import { BaseTransaction } from '@safe-global/safe-apps-sdk';
import { getSafeInfo, isConnectedToSafe, submitTxs } from "./safeapp";
import { isModuleEnabled, buildEnableModule, buildUpdateFallbackHandler } from "./safe";
import { getJsonRpcProvider, getProvider } from "./web3";
import Safe7579 from "./Safe7579.json"
import EntryPoint from "./EntryPoint.json"
import {  Address, Hex, PrivateKeyAccount, encodeAbiParameters, pad, toBytes } from "viem";
import { ENTRYPOINT_ADDRESS_V07, getPackedUserOperation, UserOperation, getAccountNonce } from 'permissionless'
import {
    getClient,
    getModule,
    getAccount,
    installModule,
    isModuleInstalled,
    getInstallOwnableValidator,
    ModuleType,
    OWNABLE_VALIDATOR_ADDRESS
  } from "@rhinestone/module-sdk";
import { NetworkUtil } from "./networks";
import { getSmartAccountClient } from "./permissionless";
import { signMessage } from "viem/accounts";
import { buildUnsignedUserOpTransaction } from "@/utils/userOp";
   

const safe7579Module = "0x3Fdb5BC686e861480ef99A6E3FaAe03c0b9F32e2"
const ownableModule = "0xeA1C45a77bCcD401388553033A994d7F296db3CE"

export function generateRandomString(length: number) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomIndex);
    }
    return result;
}


/**
 * Generates a deterministic key pair from an arbitrary length string
 *
 * @param {string} string - The string to generate a key pair from
 * @returns {Object} - An object containing the address and privateKey
 */
export function generateKeysFromString(string: string) {
    const privateKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(string)) // v5
    const wallet = new ethers.Wallet(privateKey)
    return {
        address: wallet.address,
        privateKey: privateKey,
    }
}




export const sendTransaction = async (chainId: string, recipient: string, amount: bigint, walletProvider: PrivateKeyAccount, safeAccount: Hex): Promise<any> => {

    const call = { to: recipient as Hex, value: amount, data: '0x' as Hex }


    const key = BigInt(pad(ownableModule as Hex, {
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


const buildInitSafe7579 = async ( ): Promise<BaseTransaction> => {
    
    const provider = await getProvider()
    const safeInfo = await getSafeInfo()

    const safe7579 = new Contract(
        safe7579Module,
        Safe7579.abi,
        provider
    )

    return {
        to: safeInfo.safeAddress,
        value: "0",
        data: (await safe7579.initializeAccount.populateTransaction([], [], [], [], {registry: ZeroAddress, attesters: [], threshold: 0})).data
    }
}




const buildInstallModule = async (address: Address, type: ModuleType, initData: Hex): Promise<BaseTransaction> => {

    const provider = await getProvider()
    const safeInfo = await getSafeInfo()
    
    const chainId = (await provider.getNetwork()).chainId.toString()

    const client = getClient({ rpcUrl: NetworkUtil.getNetworkById(parseInt(chainId))?.url!});

    // Create the account object
    const account = getAccount({
            address: safe7579Module,
            type: "safe",
        });


    const module = getModule({
        module: address,
        data: initData,
        type:  type,
      });

    const executions = await installModule({
        client,
        account,
        module,
      });


      return {to: safeInfo.safeAddress , value: executions[0].value.toString() , data: executions[0].callData}

}

const buildOwnableInstallModule = async (owners: Address[], threshold: number): Promise<BaseTransaction> => {

    const provider = await getProvider()
    const safeInfo = await getSafeInfo()
    
    // Updating the provider RPC if it's from the Safe App.
    const chainId = (await provider.getNetwork()).chainId.toString()

    const client = getClient({ rpcUrl: NetworkUtil.getNetworkById(parseInt(chainId))?.url!});

    // Create the account object
    const account = getAccount({
            address: safe7579Module,
            type: "safe",
        });

    const ownableValidator = getInstallOwnableValidator({
        owners: owners, 
        threshold: threshold, // owners threshold
      });

    const executions = await installModule({
        client,
        account,
        module: ownableValidator,
      });

    return { to: safeInfo.safeAddress , value: executions[0].value.toString() , data: executions[0].callData }

}


const isInstalled = async (address: Address, type: ModuleType): Promise<boolean> => {

    const provider = await getProvider()
    const safeInfo = await getSafeInfo()
    
    // Updating the provider RPC if it's from the Safe App.
    const chainId = (await provider.getNetwork()).chainId.toString()

    const client = getClient({ rpcUrl: NetworkUtil.getNetworkById(parseInt(chainId))?.url!});


    // Create the account object
    const account = getAccount({
            address: safeInfo.safeAddress as Hex,
            type: "safe",
        });


    const module = getModule({
        module: address,
        data: '0x',
        type:  type ,
      });

     
    try {  
    return await isModuleInstalled({
        client,
        account,
        module,
      });
    }
    catch {
        return false;
    }

}


export const addValidatorModule = async (ownerAddress: Hex ) => {
    
    if (!await isConnectedToSafe()) throw Error("Not connected to a Safe")

    const info = await getSafeInfo()

    const txs: BaseTransaction[] = []

    if (!await isModuleEnabled(info.safeAddress, safe7579Module)) {
        txs.push(await buildEnableModule(info.safeAddress, safe7579Module))
        txs.push(await buildUpdateFallbackHandler(info.safeAddress, safe7579Module))
        txs.push(await buildInitSafe7579())
 
        // txs.push(await buildOwnableInstallModule([ownerAddress], 1))
        txs.push(await buildInstallModule(ownableModule, 'validator', encodeAbiParameters(
            [
              { name: 'threshold', type: 'uint256' },
              { name: 'owners', type: 'address[]' },
            ],
            [BigInt(1), [ownerAddress]],
          ),))

    }
    else if(!await isInstalled(ownableModule, 'validator')) {
        // txs.push(await buildOwnableInstallModule([ownerAddress], 1))
        txs.push(await buildInstallModule(ownableModule, 'validator', encodeAbiParameters(
            [
              { name: 'threshold', type: 'uint256' },
              { name: 'owners', type: 'address[]' },
            ],
            [BigInt(1), [ownerAddress]],
          ),))

    }

    if (txs.length > 0)  
    await submitTxs(txs)
}

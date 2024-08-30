import { Hex, createPublicClient, http, Chain, Transport } from 'viem'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { base, baseSepolia, sepolia } from 'viem/chains'
import {
  ENTRYPOINT_ADDRESS_V07,
  createSmartAccountClient,
  SmartAccountClient
} from 'permissionless'
import {
  signerToSafeSmartAccount,
  SafeSmartAccount
} from 'permissionless/accounts'
import { erc7579Actions, Erc7579Actions } from 'permissionless/actions/erc7579'
import {
  createPimlicoBundlerClient,
  createPimlicoPaymasterClient
} from 'permissionless/clients/pimlico'
import { EntryPoint, UserOperation } from 'permissionless/types'
import { chainId } from 'permissionless/actions/bundler/chainId'
import { publicClient } from './utils'

export type SafeSmartAccountClient = SmartAccountClient<
  EntryPoint,
  Transport,
  Chain,
  SafeSmartAccount<EntryPoint>
> &
  Erc7579Actions<EntryPoint, SafeSmartAccount<EntryPoint>>

  export const getChain = (chainId: string) : Chain => {
    return [base, sepolia, baseSepolia].find((chain: any) => chain.id == chainId) as Chain;
  }
  

const safe4337ModuleAddress = '0x3Fdb5BC686e861480ef99A6E3FaAe03c0b9F32e2'
const erc7569LaunchpadAddress = '0xEBe001b3D534B9B6E2500FB78E67a1A137f561CE'



const privateKey =
  (process.env.NEXT_PUBLIC_PRIVATE_KEY as Hex) ??
  (() => {
    const pk = generatePrivateKey()
    console.log('Private key to add to .env.local:', `PRIVATE_KEY=${pk}`)
    return pk
  })()

// const signer = privateKeyToAccount('0x47cfffe655129fa5bce61a8421eb6ea97ec6d5609b5fbea45ad68bacede19d8b')

const getPimlicoEndpoint = (chainId: string) => {
  const chain = getChain(chainId);

  return `https://api.pimlico.io/v2/${chain.name.toLowerCase().replace(/\s+/g, '-')}/rpc?apikey=${import.meta.env.VITE_PIMLICO_API_KEY}`;
}

export const getPaymasterClient = async (chainId: string) => {
return createPimlicoPaymasterClient({
  transport: http(getPimlicoEndpoint(chainId)),
  entryPoint: ENTRYPOINT_ADDRESS_V07
})
}

export const getBundlerClient = async (chainId: string) => {
 return createPimlicoBundlerClient({
  transport: http(getPimlicoEndpoint(chainId)),
  entryPoint: ENTRYPOINT_ADDRESS_V07
})

}

export const getSmartAccountClient = async (chainId: string, address: Hex, nonceKey: bigint,  signer: any, signUserOperation?: any) => {

  const chain = getChain(chainId);
  const account = await signerToSafeSmartAccount(publicClient(parseInt(chainId)), {
    entryPoint: ENTRYPOINT_ADDRESS_V07,
    signer,
    address,
    nonceKey,
    safeVersion: '1.4.1',
    saltNonce: 120n,
    safe4337ModuleAddress,
    erc7569LaunchpadAddress,
  })

  account.signUserOperation = signUserOperation ?? signUserOperation

  const pimlicoBundlerClient = await getBundlerClient(chainId)
  const paymasterClient = await getPaymasterClient(chainId)
  const smartAccountClient = createSmartAccountClient({
    chain,
    account,
    bundlerTransport: http(getPimlicoEndpoint(chainId)),
    middleware: {
      gasPrice: async () =>
        (await pimlicoBundlerClient.getUserOperationGasPrice()).fast,
      sponsorUserOperation: paymasterClient.sponsorUserOperation
    }
  }).extend(erc7579Actions({ entryPoint: ENTRYPOINT_ADDRESS_V07 }))

  return smartAccountClient as SafeSmartAccountClient
}


export const waitForExecution = async (chainId: string, userOperationHash: string) => {


  const pimlicoBundlerClient = await getBundlerClient(chainId)
  const receipt = await pimlicoBundlerClient.waitForUserOperationReceipt({ hash: userOperationHash as Hex, timeout: 60000})

  return receipt;

}


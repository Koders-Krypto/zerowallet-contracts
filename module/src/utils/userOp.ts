// import { UserOperation } from '@safe-global/safe-4337-provider'
import { BigNumberish, BytesLike, Contract, Signer, ethers } from 'ethers'
import { PackedUserOperationStruct as PackedUserOperation } from '../../typechain-types/contracts/safe7579/Safe7579'

import {
  Address,
  Hex,
  encodeFunctionData,
  encodeAbiParameters,
  pad,
  encodePacked,
  slice,
} from "viem";
import AccountInterface from "./abis/Account.json";

export { PackedUserOperation }

export type SafeUserOperation = {
  safe: string
  entryPoint: string
  validAfter: BigNumberish
  validUntil: BigNumberish
} & GasParameters &
  Omit<PackedUserOperation, 'sender' | 'signature' | keyof PackedGasParameters>


  export type Call = {
    target: Hex
    value: BigNumberish
    data: string

  }

  export type Action = {
    target: Hex
    value: BigNumberish
    callData: Hex

  }


  export const CALL_TYPE = {
    SINGLE: "0x0000000000000000000000000000000000000000000000000000000000000000",
    BATCH: "0x0100000000000000000000000000000000000000000000000000000000000000",
  };




export function encodeUserOpCallData(funcName: string, {
  actions,
}: {
  actions: { target: Address; value: BigNumberish; callData: Hex }[];
}): Hex {
  if (actions.length === 0) {
    throw new Error("No actions");
  } else if (actions.length === 1) {
    const { target, value, callData } = actions[0];
    return encodeFunctionData({
      functionName: funcName,
      abi: AccountInterface.abi,
      args: [
        CALL_TYPE.SINGLE,
        encodePacked(
          ["address", "uint256", "bytes"],
          [target, BigInt(Number(value)), callData]
        ),
      ],
    });
  } else {
    return encodeFunctionData({
      functionName: "execute",
      abi: AccountInterface.abi,
      args: [
        CALL_TYPE.BATCH,
        encodeAbiParameters(
          [
            {
              components: [
                {
                  name: "target",
                  type: "address",
                },
                {
                  name: "value",
                  type: "uint256",
                },
                {
                  name: "callData",
                  type: "bytes",
                },
              ],
              name: "Execution",
              type: "tuple[]",
            },
          ],
          // @ts-ignore
          [actions]
        ),
      ],
    });
  }
}


export const buildUnsignedUserOpTransaction = (
  from: string,
  nonce: BigNumberish,
  action: Action
): PackedUserOperation => {

  const callData =  encodeUserOpCallData('execute', {actions: [action]})

  return {
    sender: from,
    nonce: nonce,
    initCode: '0x',
    callData: callData,
    preVerificationGas: ethers.toBeHex(60000),
    ...packGasParameters({
      verificationGasLimit: 500000,
      callGasLimit: 2000000,
      maxPriorityFeePerGas: 10000000000,
      maxFeePerGas: 10000000000
    }),
    paymasterAndData: ethers.hexlify('0x'),
    signature: '0x',
  }
}


/**
 * Packs validation data into a string using the Ethereum ABI encoding.
 *
 * @param {BigNumberish} authorizer - The address of the authorizer. 0 for validation success, 1 for validation failure.
 * @param {BigNumberish} validUntil - The timestamp until which the validation remains valid.
 * @param {BigNumberish} validAfter - The timestamp when the validation becomes valid.
 * @returns {string} The packed validation data.
 */
export const packValidationData = (authorizer: BigNumberish, validUntil: BigNumberish, validAfter: BigNumberish): bigint => {
  const addrBigInt = BigInt(authorizer)
  const validUntilBigInt = BigInt(validUntil)
  const validAfterBigInt = BigInt(validAfter)

  const result = addrBigInt | (validUntilBigInt << 160n) | (validAfterBigInt << (160n + 48n))

  return result
}

export interface GasParameters {
  verificationGasLimit: BigNumberish
  callGasLimit: BigNumberish
  maxPriorityFeePerGas: BigNumberish
  maxFeePerGas: BigNumberish
}

export interface PackedGasParameters {
  accountGasLimits: BytesLike
  gasFees: BytesLike
}

/**
 * Packs two 128uint gas limit values (validationGasLimit and callGasLimit) into a hex-encoded bytes32 string.
 *
 * @param validationGasLimit - The validation gas limit.
 * @param callGasLimit - The call gas limit.
 * @returns The packed gas limits as a string.
 */
export const packGasParameters = (unpacked: GasParameters): PackedGasParameters => {
  const pack = (hi: BigNumberish, lo: BigNumberish) => ethers.solidityPacked(['uint128', 'uint128'], [hi, lo])
  return {
    accountGasLimits: pack(unpacked.verificationGasLimit, unpacked.callGasLimit),
    gasFees: pack(unpacked.maxPriorityFeePerGas, unpacked.maxFeePerGas),
  }
}

/**
 * Unpacks the account gas limits from a bytes32 hex-encoded string into two uint128 BigInts.
 *
 * @param accountGasLimits - The account gas limits as a bytes32 hex-encoded string.
 * @returns An object containing the validation gas limit and the call gas limit.
 */
export const unpackGasParameters = (packed: PackedGasParameters): GasParameters => {
  const unpack = (word: BytesLike) => {
    if (ethers.dataLength(word) !== 32) {
      throw new Error('Invalid input: packed gas parameter value must be 32-bytes')
    }
    return [BigInt(ethers.dataSlice(word, 0, 16)), ethers.dataSlice(word, 16, 32)] as const
  }
  const [verificationGasLimit, callGasLimit] = unpack(packed.accountGasLimits)
  const [maxPriorityFeePerGas, maxFeePerGas] = unpack(packed.gasFees)

  return { verificationGasLimit, callGasLimit, maxPriorityFeePerGas, maxFeePerGas }
}

/**
 * Unpacks a user operation.
 *
 * @param packedUserOp - The packed user operation.
 * @returns The unpacked user operation.
 */
export const unpackUserOperation = async (packedUserOp: PackedUserOperation): Promise<UserOperation> => {
  return {
    sender: await ethers.resolveAddress(packedUserOp.sender),
    nonce: packedUserOp.nonce,
    ...unpackInitCode(packedUserOp),
    callData: packedUserOp.callData,
    ...unpackGasParameters(packedUserOp),
    preVerificationGas: packedUserOp.preVerificationGas,
    ...unpackPaymasterAndData(packedUserOp),
    signature: packedUserOp.signature,
  }
}

/**
 * Unpacks a user operation's `initCode` field into a factory address and its data.
 *
 * @param _ - The packed user operation.
 * @returns The unpacked `initCode`.
 */
export const unpackInitCode = ({ initCode }: Pick<PackedUserOperation, 'initCode'>): Pick<UserOperation, 'factory' | 'factoryData'> => {
  return ethers.dataLength(initCode) > 0
    ? {
        factory: ethers.getAddress(ethers.dataSlice(initCode, 0, 20)),
        factoryData: ethers.dataSlice(initCode, 20),
      }
    : {}
}

/**
 * Unpacks a user operation's `paymasterAndData` field into a the paymaster options.
 *
 * @param _ - The packed user operation.
 * @returns The unpacked `paymasterAndData`.
 */
export const unpackPaymasterAndData = ({
  paymasterAndData,
}: Pick<PackedUserOperation, 'paymasterAndData'>): Pick<
  UserOperation,
  'paymaster' | 'paymasterVerificationGasLimit' | 'paymasterPostOpGasLimit' | 'paymasterData'
> => {
  return ethers.dataLength(paymasterAndData) > 0
    ? {
        paymaster: ethers.getAddress(ethers.dataSlice(paymasterAndData, 0, 20)),
        paymasterVerificationGasLimit: BigInt(ethers.dataSlice(paymasterAndData, 20, 36)),
        paymasterPostOpGasLimit: BigInt(ethers.dataSlice(paymasterAndData, 36, 52)),
        paymasterData: ethers.dataSlice(paymasterAndData, 52),
      }
    : {}
}

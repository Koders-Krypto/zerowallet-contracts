import { Hex, encodeAbiParameters } from "viem"

export const createEnableData = (
    pubKeyX: string,
    pubKeyY: string,
    authenticatorIdHash: Hex
) => {
    return encodeAbiParameters(
        [
            {
                components: [
                    { name: "x", type: "uint256" },
                    { name: "y", type: "uint256" }
                ],
                name: "webAuthnData",
                type: "tuple"
            },
            {
                name: "authenticatorIdHash",
                type: "bytes32"
            }
        ],
        [
            {
                x: BigInt(`0x${pubKeyX}`),
                y: BigInt(`0x${pubKeyY}`)
            },
            authenticatorIdHash
        ]
    )
}

export const createDummySignatrue = () => {
    return encodeAbiParameters(
        [
            { name: "authenticatorData", type: "bytes" },
            { name: "clientDataJSON", type: "string" },
            { name: "responseTypeLocation", type: "uint256" },
            { name: "r", type: "uint256" },
            { name: "s", type: "uint256" },
            { name: "usePrecompiled", type: "bool" }
        ],
        [
            "0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97631d00000000",
            '{"type":"webauthn.get","challenge":"tbxXNFS9X_4Byr1cMwqKrIGB-_30a0QhZ6y7ucM0BOE","origin":"http://localhost:3000","crossOrigin":false}',
            1n,
            44941127272049826721201904734628716258498742255959991581049806490182030242267n,
            9910254599581058084911561569808925251374718953855182016200087235935345969636n,
            false
        ]
    )
}
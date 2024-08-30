import { expect } from 'chai'
import { deployments, ethers } from 'hardhat'
import { utils } from 'ethersv5';
import { getTestSafe, getEntryPoint, getTestToken, getSafe7579, getMockTarget, getOwnableValidator } from '../utils/setup'
import { buildSignatureBytes, signHash, logGas } from '../../src/utils/execution'
import {
  buildUnsignedUserOpTransaction,
  encodeUserOpCallData,
} from '../../src/utils/userOp'
import execSafeTransaction from '../utils/execSafeTransaction';
import { ZeroAddress } from 'ethers';
import { Hex, pad } from 'viem'


describe('Safe7579 - Basic tests', () => {
  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture()

    const [user1, user2, relayer] = await ethers.getSigners()
    let entryPoint = await getEntryPoint()

    entryPoint = entryPoint.connect(relayer)
    const ownableValidator = await getOwnableValidator()
    const mockTarget = await getMockTarget()
    const safe7579 = await getSafe7579()
    const testToken = await getTestToken()
    const safe = await getTestSafe(user1, await safe7579.getAddress(), await safe7579.getAddress())

    return {
      testToken,
      user1,
      user2,
      safe,
      relayer,
      mockTarget,
      ownableValidator,
      safe7579,
      entryPoint,
    }
  })

  describe('handleOps - without validators', () => {
    it('should revert with invalid signature', async () => {
      const { user1, safe, entryPoint } = await setupTests()

      await user1.sendTransaction({ to: await safe.getAddress(), value: ethers.parseEther('1.0') })

      const call = {target: user1.address as Hex, value: ethers.parseEther('0.5'), callData: '0x' as Hex}

      const userOp = buildUnsignedUserOpTransaction(
        await safe.getAddress(),
        '0',
        call
      )
      userOp.signature = buildSignatureBytes([await signHash(user1, ethers.keccak256('0xbaddad42'))])
       
      await expect(entryPoint.handleOps([userOp], user1.address))
        .to.be.revertedWithCustomError(entryPoint, 'FailedOp')
        .withArgs(0, 'AA24 signature error')

      expect(await ethers.provider.getBalance(await safe.getAddress())).to.be.eq(ethers.parseEther('1.0'))
    })



    it('should add a ownable validator and execute ops with signatures', async () => {
      const { user1, user2, safe, ownableValidator, safe7579, entryPoint, relayer } = await setupTests()

      await entryPoint.depositTo(await safe.getAddress(), { value: ethers.parseEther('1.0') })

      await user1.sendTransaction({ to: await safe.getAddress(), value: ethers.parseEther('1') })

      const call = {target: user1.address as Hex, value: ethers.parseEther('1'), callData: '0x' as Hex} // Added the callData property

      await execSafeTransaction(safe, await safe7579.initializeAccount.populateTransaction([], [], [], [], {registry: ZeroAddress, attesters: [], threshold: 0}));

      await execSafeTransaction(safe, {to: await safe.getAddress(), data:  ((await safe7579.installModule.populateTransaction(1, await ownableValidator.getAddress(), utils.defaultAbiCoder.encode(['uint256', 'address[]'], [1, [user1.address]]))).data as string), value: 0})

      const key = BigInt(pad(await ownableValidator.getAddress() as Hex, {
          dir: "right",
          size: 24,
        }) || 0
      )
      const currentNonce = await entryPoint.getNonce(await safe.getAddress(), key);


      let userOp = buildUnsignedUserOpTransaction(await safe.getAddress(), currentNonce, call)

      const typedDataHash = ethers.getBytes(await entryPoint.getUserOpHash(userOp))
      userOp.signature = await user1.signMessage(typedDataHash)
      
      await logGas('Execute UserOp without a prefund payment', entryPoint.handleOps([userOp], relayer))
      expect(await ethers.provider.getBalance(await safe.getAddress())).to.be.eq(ethers.parseEther('0'))
    })


    it('should add a ownable validator and execute ops with signatures for contract calls', async () => {
      const { user1, safe, ownableValidator, safe7579, mockTarget, entryPoint, relayer } = await setupTests()

      await entryPoint.depositTo(await safe.getAddress(), { value: ethers.parseEther('1.0') })

      await user1.sendTransaction({ to: await safe.getAddress(), value: ethers.parseEther('1') })

      const abi = [
        'function set( uint256 value) external',
      ]
    
      const targetCallData = new ethers.Interface(abi).encodeFunctionData('set', [7579])

      const call = {target: await mockTarget.getAddress() as Hex, value: 0, callData: targetCallData as Hex} // Added the callData property

      await execSafeTransaction(safe, await safe7579.initializeAccount.populateTransaction([], [], [], [], {registry: ZeroAddress, attesters: [], threshold: 0}));

      await execSafeTransaction(safe, {to: await safe.getAddress(), data:  ((await safe7579.installModule.populateTransaction(1, await ownableValidator.getAddress(), utils.defaultAbiCoder.encode(['uint256', 'address[]'], [1, [user1.address]]))).data as string), value: 0})
      const key = BigInt(pad(await ownableValidator.getAddress() as Hex, {
          dir: "right",
          size: 24,
        }) || 0
      )
      const currentNonce = await entryPoint.getNonce(await safe.getAddress(), key);


      let userOp = buildUnsignedUserOpTransaction(await safe.getAddress(), currentNonce, call)
      

      const typedDataHash = ethers.getBytes(await entryPoint.getUserOpHash(userOp))
      userOp.signature = await user1.signMessage(typedDataHash)
      
      await logGas('Execute UserOp without a prefund payment', entryPoint.handleOps([userOp], relayer))

      expect(await mockTarget.value()).to.be.eq(7579)


    })
  })
})
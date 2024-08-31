import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

describe("StakingERC20", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployToken() {
    const erc20Token = await ethers.getContractFactory("Web3CXI");
    const token = await erc20Token.deploy();

    return { token };
  }

  async function deployStakingERC20() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const { token } = await loadFixture(deployToken);

    const stakingERC20 = await ethers.getContractFactory("StakingERC20");
    const stakingErc20 = await stakingERC20.deploy(token);

    return { stakingErc20, owner, otherAccount, token };
  }

  describe('deployment', function() {
    it("should check if owner and token address is set", async function() {
        const { stakingErc20, owner, token, otherAccount } = await loadFixture(deployStakingERC20);

        expect(await stakingErc20.owner()).to.equal(owner);
        expect(await stakingErc20.tokenAddress()).to.equal(token);
    });
  })

  describe('', function() {
    it("", async function() {

    });

    
  })
})
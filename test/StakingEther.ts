import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

describe("StakingEther", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployStakingEther() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const stakingEthContract = await ethers.getContractFactory("StakingEther");
    const stakingEther = await stakingEthContract.deploy({value: 100});

    return { stakingEther, owner, otherAccount };
  }

  describe("deployment", function() {
    it("should set the owner address correctly", async function() {
        const { owner, stakingEther } = await loadFixture(deployStakingEther);

        expect(await stakingEther.owner()).to.equal(owner);
    })
  })
})
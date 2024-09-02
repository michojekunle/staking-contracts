import {
  loadFixture,
  time,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("StakingEther", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployStakingEther() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const stakingEthContract = await ethers.getContractFactory("StakingEther");
    const stakingEther = await stakingEthContract.deploy({
      value: ethers.parseEther("10"),
    });

    return { stakingEther, owner, otherAccount };
  }

  describe("deployment", function () {
    it("should set the owner address correctly", async function () {
      const { owner, stakingEther } = await loadFixture(deployStakingEther);

      expect(await stakingEther.owner()).to.equal(owner);
    });

    it("should revert when trying to deploy the contract with 0 ether", async function () {
      const stakingEthContract = await ethers.getContractFactory(
        "StakingEther"
      );
      expect(
        stakingEthContract.deploy({ value: ethers.parseEther("0") })
      ).to.be.revertedWithCustomError(
        stakingEthContract,
        "ZeroAmountNotAllowed"
      );
    });
  });

  describe("stake", function () {
    it("should revert with error if the owner tries to stake in the contract", async function () {
      const { stakingEther } = await loadFixture(deployStakingEther);

      expect(
        stakingEther.stake(30, { value: ethers.parseEther("1") })
      ).to.be.revertedWithCustomError(
        stakingEther,
        "OwnerCannotStakeInContract"
      );
    });

    it("should revert with error if zero ether is passed", async function () {
      const { stakingEther, otherAccount } = await loadFixture(
        deployStakingEther
      );

      expect(
        stakingEther
          .connect(otherAccount)
          .stake(30, { value: ethers.parseEther("0") })
      ).to.be.revertedWithCustomError(stakingEther, "ZeroAmountNotAllowed");
    });

    it("should revert with error if max duration is exceeded", async function () {
      const { stakingEther, otherAccount } = await loadFixture(
        deployStakingEther
      );

      expect(
        stakingEther
          .connect(otherAccount)
          .stake(5.6863e6, { value: ethers.parseEther("2") })
      ).to.be.revertedWithCustomError(
        stakingEther,
        "MaximumStakingDurationExceeded"
      );
    });

    it("should create new stake for user", async function () {
      const { stakingEther, otherAccount } = await loadFixture(
        deployStakingEther
      );

      const duration = 60;
      await stakingEther
        .connect(otherAccount)
        .stake(duration, { value: ethers.parseEther("0.7") });

      const userStakes = await stakingEther
        .connect(otherAccount)
        .getUserStakes();

      const timeCreated = Math.floor(new Date().getTime() / 1000);

      expect(userStakes.length).to.equal(1);

      expect(userStakes[0].startTime).to.be.within(
        timeCreated - 7,
        timeCreated + 7
      );

      expect(userStakes[0].endTime).to.be.within(
        timeCreated + duration - 7,
        timeCreated + duration + 7
      );

      expect(userStakes[0].isWithdrawn).to.equal(false);

      setTimeout(
        async () =>
          expect(
            await stakingEther.connect(otherAccount).getCurrentStakeBalance(0)
          ).to.be.greaterThan(userStakes[0].amount),
        5000
      );
    });

    it("should revert with custom when maximum number of stakes for a user is reached", async function () {
      const { stakingEther, otherAccount } = await loadFixture(
        deployStakingEther
      );

      await stakingEther
        .connect(otherAccount)
        .stake(15, { value: ethers.parseEther("0.23") });

      await stakingEther
        .connect(otherAccount)
        .stake(23, { value: ethers.parseEther("0.23") });

      await stakingEther
        .connect(otherAccount)
        .stake(56, { value: ethers.parseEther("0.23") });

      const userStakes = await stakingEther
        .connect(otherAccount)
        .getUserStakes();

      expect(userStakes.length).to.equal(3);

      expect(
        stakingEther
          .connect(otherAccount)
          .stake(62, { value: ethers.parseEther("0.25") })
      ).to.be.revertedWithCustomError(
        stakingEther,
        "MaximumNumberOfStakesForUserReached"
      );
    });

    it("should emit an event when the stake is created", async function () {
      const { stakingEther, otherAccount } = await loadFixture(
        deployStakingEther
      );

      await expect(
        stakingEther
          .connect(otherAccount)
          .stake(200, { value: ethers.parseEther("0.5") })
      ).to.emit(stakingEther, "StakeDeposited");
    });
  });

  describe("withdraw", function () {
    it("should revert with error if user stake doesn't exist", async function () {
      const { stakingEther } = await loadFixture(deployStakingEther);

      expect(stakingEther.withdraw(0)).to.be.revertedWithCustomError(
        stakingEther,
        "UserStakeDoesNotExist"
      );
    });

    it("should revert with error if stake is already withdrawn", async function () {
      const { stakingEther, otherAccount } = await loadFixture(
        deployStakingEther
      );

      await stakingEther
        .connect(otherAccount)
        .stake(10, { value: ethers.parseEther("0.2") });

      // Simulate time passing, if necessary (e.g., to accumulate rewards)
      // Hardhat provides a way to increase the time in tests
      await ethers.provider.send("evm_increaseTime", [12000]); // Increase time by 12 seconds
      await ethers.provider.send("evm_mine"); // Mine a new block to apply the time increase

      await stakingEther.connect(otherAccount).withdraw(0);

      await expect(
        stakingEther.connect(otherAccount).withdraw(0)
      ).to.be.revertedWithCustomError(stakingEther, "StakeAlreadyWithdrawn");
    });

    it("should revert with error if stake time has not ended", async function () {
      const { stakingEther, otherAccount } = await loadFixture(
        deployStakingEther
      );

      await stakingEther
        .connect(otherAccount)
        .stake(10, { value: ethers.parseEther("0.2") });

      expect(
        stakingEther.connect(otherAccount).withdraw(0)
      ).to.be.revertedWithCustomError(stakingEther, "StakeTimeHasNotEnded");
    });

    it("should withdraw staked amount with expected reward", async function () {
      const { stakingEther, otherAccount } = await loadFixture(
        deployStakingEther
      );

      let balanceBefore, balanceAfter;
      // before staking and withdrawal
      balanceBefore = await ethers.provider.getBalance(otherAccount.address);

      const stakeTx = await stakingEther
        .connect(otherAccount)
        .stake(10, { value: ethers.parseEther("0.2") });

      const stakeTxReceipt = await stakeTx.wait();

      // Calculate the gas cost of the withdraw transaction
      const gasUsedStake = stakeTxReceipt!.gasUsed;
      const effectiveGasPriceStake =
        stakeTx.gasPrice || BigInt("1000");
      const gasCostStake = gasUsedStake * effectiveGasPriceStake;

      await ethers.provider.send("evm_increaseTime", [15000]); // Increase time by 15 seconds
      await ethers.provider.send("evm_mine"); // Mine a new block to apply the time increase

      // Withdraw the staked amount
      const withdrawTx = await stakingEther.connect(otherAccount).withdraw(0);
      const withdrawTxReceipt = await withdrawTx.wait(); // Wait for the transaction to be mined

      // Calculate the gas cost of the withdraw transaction
      const gasUsed = withdrawTxReceipt!.gasUsed;
      const effectiveGasPrice =
        withdrawTx.gasPrice || BigInt("1000");
      const gasCost = gasUsed * effectiveGasPrice;

      // Get the balance after withdrawal
      balanceAfter = await ethers.provider.getBalance(otherAccount.address);

      console.log(
        "Balance after withdrawal + gas costs:",
        ethers.formatEther(balanceAfter + gasCost + gasCostStake),
        "Balance before withdrawal:",
        ethers.formatEther(balanceBefore),
        "Gas Cost",
        ethers.formatEther(gasCost),
        "Gas Cost Stake",
        ethers.formatEther(gasCostStake)
      );

      // Check that the balance after withdrawal is greater than the balance before (considering gas fees)
      expect(balanceAfter + gasCost + gasCostStake).to.be.gt(balanceBefore);
    });

    it("should emit an event when the stake is withdrawn", async function () {
      const { stakingEther, otherAccount } = await loadFixture(
        deployStakingEther
      );

      await stakingEther
        .connect(otherAccount)
        .stake(10, { value: ethers.parseEther("0.2") });

      // Simulate time passing, if necessary (e.g., to accumulate rewards)
      // Hardhat provides a way to increase the time in tests
      await ethers.provider.send("evm_increaseTime", [12000]); // Increase time by 12 seconds
      await ethers.provider.send("evm_mine"); // Mine a new block to apply the time increase

      await expect(stakingEther.connect(otherAccount).withdraw(0)).to.emit(
        stakingEther,
        "StakeWithdrawn"
      );
    });
  });
});

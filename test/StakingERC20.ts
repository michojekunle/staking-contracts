import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

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

  describe("deployment", function () {
    it("should check if owner and token address is set", async function () {
      const { stakingErc20, owner, token } = await loadFixture(
        deployStakingERC20
      );

      expect(await stakingErc20.owner()).to.equal(owner);
      expect(await stakingErc20.tokenAddress()).to.equal(token);
    });
  });

  describe("depositIntoContract", function () {
    it("should revert with custom error if the signer is not the owner of the contract", async function () {
      const { stakingErc20, token, otherAccount } = await loadFixture(
        deployStakingERC20
      );
      await token.transfer(otherAccount, ethers.parseUnits("40", 18));

      const depositAmount = ethers.parseUnits("20", 18);

      await expect(
        stakingErc20.connect(otherAccount).depositIntoContract(depositAmount)
      ).to.be.revertedWithCustomError(stakingErc20, "YouAreNotTheOwner");
    });

    it("should revert if the zero(0) amount is passed", async function () {
      const { stakingErc20 } = await loadFixture(deployStakingERC20);

      const depositAmount = ethers.parseUnits("0", 18);

      await expect(
        stakingErc20.depositIntoContract(depositAmount)
      ).to.be.revertedWithCustomError(stakingErc20, "ZeroAmountNotAllowed");
    });

    it("should deposit into contract successfully", async function () {
      const { stakingErc20, owner, token, otherAccount } = await loadFixture(
        deployStakingERC20
      );

      await token.approve(stakingErc20, ethers.parseUnits("5", 18));

      const depositAmount = ethers.parseUnits("2", 18);

      await stakingErc20.depositIntoContract(depositAmount);
      const contractBalanceAfterDeposit = await token.balanceOf(stakingErc20);

      expect(contractBalanceAfterDeposit).to.be.equal(depositAmount);
    });
  });

  describe("stake", function () {
    it("should revert with error if the owner tries to stake in the contract", async function () {
      const { stakingErc20, owner, token, otherAccount } = await loadFixture(
        deployStakingERC20
      );

      expect(
        stakingErc20.stake(ethers.parseEther("0.2"), 60)
      ).to.be.revertedWithCustomError(
        stakingErc20,
        "OwnerCannotStakeInContract"
      );
    });

    it("should revert with error if zero ether is passed", async function () {
      const { stakingErc20, otherAccount } = await loadFixture(
        deployStakingERC20
      );

      expect(
        stakingErc20.connect(otherAccount).stake(ethers.parseEther("0.2"), 60)
      ).to.be.revertedWithCustomError(stakingErc20, "ZeroAmountNotAllowed");
    });

    it("should revert with error if max duration is exceeded", async function () {
      const { stakingErc20, otherAccount } = await loadFixture(
        deployStakingERC20
      );

      expect(
        stakingErc20
          .connect(otherAccount)
          .stake(ethers.parseEther("0.7"), 5.6863e6)
      ).to.be.revertedWithCustomError(
        stakingErc20,
        "MaximumStakingDurationExceeded"
      );
    });

    it("should create new stake for user", async function () {
      const { stakingErc20, token, otherAccount } = await loadFixture(
        deployStakingERC20
      );

      await token.transfer(otherAccount, ethers.parseUnits("20", 18));
      await token
        .connect(otherAccount)
        .approve(stakingErc20, ethers.parseUnits("10", 18));

      const depositAmount = ethers.parseUnits("2", 18);

      //   const contractBalanceAfterDeposit = await token.balanceOf(stakingErc20);
      const duration = 60;

      await stakingErc20.connect(otherAccount).stake(depositAmount, duration);

      const userStakes = await stakingErc20
        .connect(otherAccount)
        .getUserStakes();

      const timeCreated = Math.floor(new Date().getTime() / 1000);

      expect(userStakes.length).to.equal(1);

      expect(userStakes[0].startTime).to.be.within(
        timeCreated - 5,
        timeCreated + 5
      );

      expect(userStakes[0].endTime).to.be.within(
        timeCreated + duration - 5,
        timeCreated + duration + 5
      );

      expect(userStakes[0].isWithdrawn).to.equal(false);

      setTimeout(
        async () =>
          expect(
            await stakingErc20.connect(otherAccount).getCurrentStakeBalance(0)
          ).to.be.greaterThan(userStakes[0].amount),
        5000
      );
    });

    it("should revert with custom error when maximum number of stakes for a user is reached", async function () {
      const { stakingErc20, token, otherAccount } = await loadFixture(
        deployStakingERC20
      );

      await token.transfer(otherAccount, ethers.parseUnits("20", 18));
      await token
        .connect(otherAccount)
        .approve(stakingErc20, ethers.parseUnits("10", 18));

      await stakingErc20
        .connect(otherAccount)
        .stake(ethers.parseEther("0.2"), 15);

      await stakingErc20
        .connect(otherAccount)
        .stake(ethers.parseEther("0.2"), 23);

      await stakingErc20
        .connect(otherAccount)
        .stake(ethers.parseEther("0.2"), 56);

      const userStakes = await stakingErc20
        .connect(otherAccount)
        .getUserStakes();

      expect(userStakes.length).to.equal(3);

      expect(
        stakingErc20.connect(otherAccount).stake(ethers.parseEther("0.24"), 62)
      ).to.be.revertedWithCustomError(
        stakingErc20,
        "MaximumNumberOfStakesForUserReached"
      );
    });

    it("should emit an event when the stake is created", async function () {
      const { stakingErc20, token, otherAccount } = await loadFixture(
        deployStakingERC20
      );

      await token.transfer(otherAccount, ethers.parseUnits("20", 18));
      await token
        .connect(otherAccount)
        .approve(stakingErc20, ethers.parseUnits("10", 18));

      await expect(
        stakingErc20.connect(otherAccount).stake(ethers.parseEther("0.12"), 200)
      ).to.emit(stakingErc20, "StakeDeposited");
    });
  });

  describe("withdraw", function () {
    it("should revert with error if user stake doesn't exist", async function () {
      const { stakingErc20 } = await loadFixture(deployStakingERC20);

      expect(stakingErc20.withdraw(0)).to.be.revertedWithCustomError(
        stakingErc20,
        "UserHasNoStakes"
      );
    });

    it("should revert with error if stake is already withdrawn", async function () {
      const { stakingErc20, token, otherAccount } = await loadFixture(
        deployStakingERC20
      );

      await token.transfer(otherAccount, ethers.parseUnits("20", 18));
      await token
        .connect(otherAccount)
        .approve(stakingErc20, ethers.parseUnits("10", 18));

      await stakingErc20
        .connect(otherAccount)
        .stake(ethers.parseEther("0.112"), 10);

      setTimeout(async () => {
        await stakingErc20.connect(otherAccount).withdraw(0);
      }, 12);

      setTimeout(async () => {
        await expect(
          stakingErc20.connect(otherAccount).withdraw(0)
        ).to.be.revertedWithCustomError(stakingErc20, "StakeAlreadyWithdrawn");
      }, 12);
    });

    it("should revert with error if stake time has not ended", async function () {
      const { stakingErc20, token, otherAccount } = await loadFixture(
        deployStakingERC20
      );

      await token.transfer(otherAccount, ethers.parseUnits("20", 18));
      await token
        .connect(otherAccount)
        .approve(stakingErc20, ethers.parseUnits("10", 18));

      await stakingErc20
        .connect(otherAccount)
        .stake(ethers.parseEther("0.05"), 10);

      expect(
        stakingErc20.connect(otherAccount).withdraw(0)
      ).to.be.revertedWithCustomError(stakingErc20, "StakeTimeHasNotEnded");
    });

    it("should withdraw staked amount with expected reward", async function () {
      const { stakingErc20, token, otherAccount } = await loadFixture(
        deployStakingERC20
      );
      let balanceBefore, balanceAfter;
      balanceBefore = await token.balanceOf(otherAccount);

      await token.transfer(otherAccount, ethers.parseUnits("20", 18));
      await token
        .connect(otherAccount)
        .approve(stakingErc20, ethers.parseUnits("10", 18));

      await stakingErc20
        .connect(otherAccount)
        .stake(ethers.parseEther("0.3"), 10);

      setTimeout(async () => {
        await expect(stakingErc20.connect(otherAccount).withdraw(0));
        balanceAfter = await ethers.provider.getBalance(otherAccount.address);
        expect(balanceAfter).to.be.greaterThan(balanceBefore);
      }, 12);
    });

    it("should emit an event when the stake is withdrawn", async function () {
      const { stakingErc20, token, otherAccount } = await loadFixture(
        deployStakingERC20
      );

      await token.transfer(otherAccount, ethers.parseUnits("20", 18));
      await token
        .connect(otherAccount)
        .approve(stakingErc20, ethers.parseUnits("10", 18));

      await stakingErc20
        .connect(otherAccount)
        .stake(ethers.parseEther("0.32"), 10);

      setTimeout(async () => {
        await expect(stakingErc20.connect(otherAccount).withdraw(0)).to.emit(
          stakingErc20,
          "StakeWithdrawn"
        );
      }, 12);
    });
  });
});

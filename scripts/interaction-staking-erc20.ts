import { ethers } from "hardhat";

async function main() {
  const [deployer, otherAccount] = await ethers.getSigners();

  const web3CXITokenAddress = "0x072D37C74404d375Fa8B069C8aF50C0950DbF351";
  const web3CXI = await ethers.getContractAt("IERC20", web3CXITokenAddress);

  const stakingErc20ContractAddress =
    "0x0caf939944B6E7043905Da9aF7F0a70865c6E594";
  const stakingErc20 = await ethers.getContractAt(
    "IStakingERC20",
    stakingErc20ContractAddress
  );

  console.log("starting");
  // transfer tokens to dummy accounts
  const transferTx = await web3CXI.transfer(
    otherAccount,
    ethers.parseUnits("50", 18)
  );
  transferTx.wait();

  console.log("starting after transferring");

  // approve staking contract to spend token from otherAccount
  const approvalAmount = ethers.parseUnits("20", 18);
  const approvalTx = await web3CXI
    .connect(otherAccount)
    .approve(stakingErc20, approvalAmount);
  approvalTx.wait();

  console.log("After approval", approvalTx);

  // stake in the contract
  const stakeAmount = ethers.parseUnits("10", 18);
  const stakeTx = await stakingErc20
    .connect(otherAccount)
    .stake(stakeAmount, 100);

  console.log("Stake transaction starting...");
  console.log("stakeTx", stakeTx);
  stakeTx.wait();

  setTimeout(async () => {
    console.log("Withdraw Tx starting...");
    const withdrawTx = await stakingErc20.connect(otherAccount).withdraw(0);

    console.log("withdrawTx", withdrawTx);
    withdrawTx.wait();
  }, 100000);
}

main().catch((error: any) => {
  console.error(error);
  process.exitCode = 1;
});

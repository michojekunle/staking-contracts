import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const tokenAddress = ""

const StakingERC20Module = buildModule("StakingERC20Module", (m) => {

  const stakingERC20 = m.contract("StakingERC20", [tokenAddress]);

  return { stakingERC20 };
});

export default StakingERC20Module;

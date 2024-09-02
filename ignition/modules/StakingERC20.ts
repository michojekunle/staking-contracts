import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const tokenAddress = "0x072D37C74404d375Fa8B069C8aF50C0950DbF351";

const StakingERC20Module = buildModule("StakingERC20Module", (m) => {
  const stakingERC20 = m.contract("StakingERC20", [tokenAddress]);

  return { stakingERC20 };
});

export default StakingERC20Module;

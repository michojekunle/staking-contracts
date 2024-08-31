import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const StakingEtherModule = buildModule("StakingEtherModule", (m) => {

  const stakingEther = m.contract("StakingEther", [100e18]);

  return { stakingEther };
});

export default StakingEtherModule;

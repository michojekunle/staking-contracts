import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { ethers } from "hardhat";

const StakingEtherModule = buildModule("StakingEtherModule", (m) => {

  const stakingEther = m.contract("StakingEther",[], {value: ethers.parseEther("0.002")});

  return { stakingEther };
});

export default StakingEtherModule;

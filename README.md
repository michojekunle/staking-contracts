# Ether and ERC20 Token Staking Contracts

This project contains two distinct staking contracts: one for staking Ether and another for staking an ERC20 token. Each contract allows users to stake their assets, earn rewards based on an annual percentage yield (APY), and withdraw their funds once the staking period has ended. Both contracts provide a secure and flexible staking mechanism for different asset types.

## Table of Contents
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Contract Details](#contract-details)
- [Testing](#testing)
- [Deployment](#deployment)
- [Interacting with the Deployed Contracts](#interacting-with-the-deployed-contracts)
- [Contributing](#contributing)


## Features
- Ether Staking: Stake Ether with a specified duration and earn ether rewards based on APY.
- ERC20 Token Staking: Stake ERC20 tokens with a specified duration and earn token rewards based on APY.
- Reward Mechanisms: Each contract calculates rewards based on the staked amount, APY, and duration.
- Secure Withdrawals: Withdraw staked funds and earned rewards after the staking period ends.
- Multiple Stakes: Users can have multiple active stakes, however a max of three stakes.
- Customizable Durations: Flexible staking periods with a maximum duration limit.

## Installation
Follow these steps to set up the project:

### Clone the repository:

```
git clone https://github.com/your-username/staking-project.git
cd staking-project
```

### Install dependencies:

`npm install`

Ensure you have the following installed:

- Node.js
- Hardhat
- Ethers.js

## Usage

- Staking Ether: To stake Ether in the Ether staking contract, users must call the stake function with the amount of Ether and the staking duration.
  
  ```
  function stake(uint64 _duration) external payable;
  ```

- Staking ERC20 Tokens: For staking ERC20 tokens, users must first approve the token amount and then call the stake function on the ERC20 staking contract.
  
  ```
  function stake(uint256 _amount, uint64 _duration) external;
  ```

- Withdrawing Stake and Rewards: Once the staking period is complete, users can withdraw their stake and rewards by specifying the stake ID.
  
  ```
  function withdraw(uint8 _userStakeId) external;
  ```

- Viewing Stake Information: Users can view all their active stakes by calling the getUserStakes function.
  ```
  function getUserStakes() external view returns (Stake[] memory);
  ```

## Contract Details
- Stake Structure: Both contracts use the following structure to store staking information:
  
  ```
  struct Stake {
      uint256 amount;         // Amount of Ether or ERC20 tokens staked
      uint256 endReward;      // Calculated reward at the end of the staking period
      bool isWithdrawn;       // Flag to indicate whether the stake has been withdrawn
      uint256 endTime;        // End time of the staking period
      uint256 startTime;      // Start time of the staking period
  }
  ```

- Errors
  Custom errors are used for gas optimization and improved readability:
  
  ```
  ZeroAmountNotAllowed()
  ZeroAddressNotAllowed()
  UserHasNoStakes()
  StakeAlreadyWithdrawn()
  StakeTimeHasNotEnded()
  MaximumNumberOfStakesForUserReached()
  MaximumStakingDurationExceeded()
  WithdrawalFailed()
  ```

## Testing
Unit tests ensure that the contracts behave as expected. Tests for both Ether and ERC20 staking contracts are located in the test directory.

### Running Tests
Run the following command to execute the tests:
```
npx hardhat test
```

## Deployment
You can deploy both the Ether and ERC20 staking contracts to the lisk-spolia testnet.

### Prerequisites
- An Ethereum development environment like Hardhat.
- An ERC-20 token contract deployed or an existing token contract address.
- A wallet with sufficient funds for deployment and funding the stakingEther contract.

### Deployment Steps

1. **Set up your hardhat config and .env:** 

   - Make sure to have the necessary dependencies installed

     Note: This hardhat config has setup lisk-sepolia network only, you can add other networks if you want to deploy on them
  
     ```
     require("@nomicfoundation/hardhat-toolbox");
     const dotenv = require("dotenv");
     dotenv.config();
     
     /** @type import('hardhat/config').HardhatUserConfig */
     module.exports = {
       solidity: "0.8.24",
       networks: {
         // for testnet
         "lisk-sepolia": {
           url: "https://rpc.sepolia-api.lisk.com",
           accounts: [process.env.WALLET_KEY],
           gasPrice: 1000000000,
         },
       },
       etherscan: {
         // Use "123" as a placeholder, because Blockscout doesn't need a real API key, and Hardhat will complain if this property isn't set.
         apiKey: {
           "lisk-sepolia": "123",
         },
         customChains: [
           {
             network: "lisk-sepolia",
             chainId: 4202,
             urls: {
               apiURL: "https://sepolia-blockscout.lisk.com/api",
               browserURL: "https://sepolia-blockscout.lisk.com",
             },
           },
         ],
       },
       sourcify: {
         enabled: false,
       },
     };
     ```

  - set up your `.env`, in your `.env`
     ```
     WALLET_KEY=""
     ```
     
2. **Update the Deployment modules:**
   
   - StakingEther Deployment module
   Update your ignition modules (e.g., `ignition/modules/StakingEther.ts`) with the amount of ether you want to deposit in your contract on deployment
  
   Example:
   ```
    import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
    import { ethers } from "hardhat";
    
    const StakingEtherModule = buildModule("StakingEtherModule", (m) => {
    
      const stakingEther = m.contract("StakingEther",[], {value: ethers.parseEther("0.002")});
    
      return { stakingEther };
    });
    
   export default StakingEtherModule;
   ```

   - StakingERC20 Deployment module
   
   Update your ignition modules (e.g., `ignition/modules/StakingERC20.ts`) with the following parameters:
   - `tokenAddress`: The address of the ERC-20 token.
  
   Example:
    ```
    import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
    
    const tokenAddress = "0xyourtokenaddress";
    
    const StakingERC20Module = buildModule("StakingERC20Module", (m) => {
      const stakingERC20 = m.contract("StakingERC20", [tokenAddress]);
    
      return { stakingERC20 };
    });
    
    export default StakingERC20Module;
    ```

4. **Deploy the Contract:**

   Deploy the contract using Hardhat:

   ```
   npx hardhat ignition deploy ignition/modules/<name-of-your-module> --network lisk-sepolia
   ```

5. **Verify the Deployment:**

   Once deployed, note the contract address. You can verify the contract on Etherscan or blockscout if deployed on lisk-sepolia using:

   ```
   npx hardhat verify --network lisk-sepolia <your-contract-address> <...args>
   ```

- *Note: &lt;...args&gt; are the arguments passed to the constructor of your contract when it is being deployed*

## Interacting with the Deployed Contracts
You can use scripts to interact with the deployed contracts after they are live.
The interaction scripts for this repository can be found in the scripts directory
To run scripts that interact with the contracts:

Staking Ether:
```
npx hardhat run scripts/interaction-staking-ether.ts --network lisk-sepolia
```
Staking ERC20 Tokens:
```
npx hardhat run scripts/interaction-staking-erc20.ts --network lisk-sepolia
```

## Contributing
Contributions are welcome! Fork the repository, make changes, and submit a pull request.

```
Thank you for reading through I really hope this helps, Happy Hacking! 🤗
```

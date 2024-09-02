// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.20;

interface IStakingEther {
    struct Stake {
        uint256 amount;
        uint256 endReward;
        bool isWithdrawn;
        uint256 endTime;
        uint256 startTime;
    }

    function stake(uint64 _duration) external payable;

    function withdraw(uint8 _userStakeId) external payable;

    function getCurrentStakeBalance(
        uint8 _userStakeId
    ) external view returns (uint256);

    function getUserStakes() external view returns (Stake[] memory);
}

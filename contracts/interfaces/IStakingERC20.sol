// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.20;

interface IStakingERC20 {
    struct Stake {
        uint256 amount;
        uint256 endReward;
        bool isWithdrawn;
        uint256 endTime;
        uint256 startTime;
    }

    function depositIntoContract(uint256 _amount) external;

    function stake(uint256 _amount, uint64 _duration) external;

    function withdraw(uint8 _userStakeId) external;

    function getCurrentStakeBalance(
        uint8 _userStakeId
    ) external view returns (uint256);

    function getUserStakes() external view returns (Stake[] memory);
}

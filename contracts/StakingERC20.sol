// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract StakingEther {
    address public owner;
    uint8 constant APY = 7;
    uint32 constant MAX_DURATION = 2.628e6; // Maximum duration in seconds (about 1 month)

    struct Stake {
        uint256 amount;
        uint256 endReward;
        bool isWithdrawn;
        uint256 endTime;
        uint256 startTime;
    }

    mapping(address => Stake[]) private stakes;

    // errors
    error ZeroAmountNotAllowed();
    error ZeroAddressNotAllowed();
    error StakeTimeHasNotEnded();
    error UserHasNoStakes();
    error StakeAlreadyWithdrawn();
    error MaximumNumberOfStakesForUserReached();
    error MaximumStakingDurationExceeded();
    error WithdrawalFailed();
    error OwnerCannotStakeInContract();
    error StakeTimeHasEnded();

    // events
    event StakeDeposited();
    event StakeWithdrawn();

    constructor() payable {
        owner = msg.sender;
        if (msg.value <= 0) revert ZeroAmountNotAllowed();
    }

    function stake(uint64 _duration) external payable {
        if (msg.sender == address(0)) revert ZeroAddressNotAllowed();
        if(msg.sender == owner) revert OwnerCannotStakeInContract();
        if (msg.value <= 0) revert ZeroAmountNotAllowed();
        if (stakes[msg.sender].length >= 3)
            revert MaximumNumberOfStakesForUserReached();
        if (_duration > MAX_DURATION) revert MaximumStakingDurationExceeded();

        uint256 endTime = block.timestamp + _duration;
        Stake memory newStake = Stake(
            msg.value,
            calculateReward(msg.value, APY, endTime - block.timestamp),
            false,
            endTime,
            block.timestamp
        );

        stakes[msg.sender].push(newStake);
        emit StakeDeposited();
    }

    function withdraw(uint8 _userStakeId) external payable {
        if (msg.sender == address(0)) revert ZeroAddressNotAllowed();
        if (
            stakes[msg.sender].length == 0 ||
            _userStakeId >= stakes[msg.sender].length
        ) revert UserHasNoStakes();

        Stake storage userStake = stakes[msg.sender][_userStakeId];
        if(userStake.isWithdrawn) revert StakeAlreadyWithdrawn();
        if (userStake.endTime > block.timestamp) revert StakeTimeHasNotEnded();

        userStake.isWithdrawn = true;

        (bool sent, ) = msg.sender.call{value: userStake.endReward}("");
        if(!sent) revert WithdrawalFailed();
        emit StakeWithdrawn();
    }

    function getCurrentStakeBalance(
        uint8 _userStakeId
    ) external view returns (uint256) {
        if (msg.sender == address(0)) revert ZeroAddressNotAllowed();
        if (
            stakes[msg.sender].length == 0 ||
            _userStakeId >= stakes[msg.sender].length
        ) revert UserHasNoStakes();

        Stake memory userStake = stakes[msg.sender][_userStakeId];
        if (userStake.endTime < block.timestamp) revert StakeTimeHasEnded();

        uint256 elapsedTime = block.timestamp - userStake.startTime;
        return calculateReward(userStake.amount, APY, elapsedTime);
    }

    function getUserStakes() external view returns (Stake[] memory) {
        if (msg.sender == address(0)) revert ZeroAddressNotAllowed();
        if (stakes[msg.sender].length == 0) revert UserHasNoStakes();

        return stakes[msg.sender];
    }

    function calculateReward(
        uint256 _principal,
        uint8 _rate,
        uint256 _time
    ) private pure returns (uint256) {
        return _principal + (_principal * _rate * _time) / (100 * 365 * 24 * 60 * 60);
    }
}
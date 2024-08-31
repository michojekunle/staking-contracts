// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract StakingERC20 {
    address public owner;
    uint8 constant APY = 7;
    uint32 constant MAX_DURATION = 2.628e6; // Maximum duration in seconds (about 1 month)
    address public tokenAddress;

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
    event DepositIntoContractSuccessful(address indexed sender, uint256 amount);

    constructor(address _tokenAddress) {
        owner = msg.sender;
        tokenAddress = _tokenAddress;
    }

    function depositIntoContract(uint256 _amount) external {
        require(msg.sender != address(0), "zero addres detected");
        require(msg.sender == owner, "you're not the owner");

        require(_amount > 0, "can't deposit zero");

        uint256 _userTokenBalance = IERC20(tokenAddress).balanceOf(msg.sender);

        require(
            _userTokenBalance >= _amount,
            "insufficient amount of tokens for sender"
        );

        IERC20(tokenAddress).transferFrom(msg.sender, address(this), _amount);

        emit DepositIntoContractSuccessful(msg.sender, _amount);
    }

    function stake(uint256 _amount, uint64 _duration) external {
        if (msg.sender == address(0)) revert ZeroAddressNotAllowed();
        if (msg.sender == owner) revert OwnerCannotStakeInContract();
        if (_amount <= 0) revert ZeroAmountNotAllowed();
        if (stakes[msg.sender].length >= 3)
            revert MaximumNumberOfStakesForUserReached();
        if (_duration > MAX_DURATION) revert MaximumStakingDurationExceeded();

        uint256 _userTokenBalance = IERC20(tokenAddress).balanceOf(msg.sender);

        require(
            _userTokenBalance >= _amount,
            "insufficient amount of tokens for sender"
        );

        IERC20(tokenAddress).transferFrom(msg.sender, address(this), _amount);

        uint256 endTime = block.timestamp + _duration;
        Stake memory newStake = Stake(
            _amount,
            calculateReward(_amount, APY, _duration),
            false,
            endTime,
            block.timestamp
        );

        stakes[msg.sender].push(newStake);
        emit StakeDeposited();
    }

    function withdraw(uint8 _userStakeId) external {
        if (msg.sender == address(0)) revert ZeroAddressNotAllowed();
        if (
            stakes[msg.sender].length == 0 ||
            _userStakeId >= stakes[msg.sender].length
        ) revert UserHasNoStakes();

        Stake storage userStake = stakes[msg.sender][_userStakeId];
        if (userStake.isWithdrawn) revert StakeAlreadyWithdrawn();
        if (userStake.endTime > block.timestamp) revert StakeTimeHasNotEnded();

        userStake.isWithdrawn = true;

        IERC20(tokenAddress).transfer(msg.sender, userStake.endReward);

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
        return
            _principal +
            (_principal * _rate * _time) /
            (100 * 365 * 24 * 60 * 60);
    }
}

import { ethers } from 'hardhat';

async function main() {
    const stakingEtherContractAddress = "0x06Deec8D71871629Cae17dbDaE9132a24A4Ed2Cb"
    const stakingEther = await ethers.getContractAt('IStakingEther', stakingEtherContractAddress);
    console.log("starting transaction");

    // send tokens to a different account to stake -- reason because owner cannot stake in the contract
    const [deployer, _, otherAccount] = await ethers.getSigners();


    // stake tokens
    const stakeAmount = ethers.parseUnits("1", 15);
    const stakeTx = await stakingEther.connect(otherAccount).stake(100, {value: stakeAmount});
    
    console.log(stakeTx);
    stakeTx.wait();

    // withdraw 
    setTimeout(async () => {
        const withdrawTx = await stakingEther.connect(otherAccount).withdraw(0);
        
        console.log(withdrawTx);
        withdrawTx.wait();
    }, 100000)
}

main().catch((error: any) => {
    console.error(error);
    process.exitCode = 1;
})
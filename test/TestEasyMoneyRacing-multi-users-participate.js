const EasyMoneyRacing = artifacts.require("./EasyMoneyRacing");
const helper = require("../utils/timeAdvanceUtils");

const {
    BN,
    expectEvent,
    expectRevert,
  } = require('@openzeppelin/test-helpers');
const { web3 } = require("@openzeppelin/test-helpers/src/setup");


contract("EasyMoneyRacing", (accounts) => {
    let easyMoneyRacing;
    let endBlock;
    let deployedBlock;
    let snapshotContainer = new Object();
    before("deploy EasyMoneyRacing Contract", async() => {
        easyMoneyRacing = await EasyMoneyRacing.new({from:accounts[0]});
    });

    it("End block expect to be deployed block + 100.", async () => {
        endBlock = (await easyMoneyRacing.endBlock.call()).toNumber();
        const txBlock = await EasyMoneyRacing.web3.eth.getTransaction(easyMoneyRacing.transactionHash);
        deployedBlock = txBlock.blockNumber;
        console.log("End block number     :" + endBlock);
        console.log("Deployed block number:" + txBlock.blockNumber);
        assert.strictEqual(txBlock.blockNumber + 100, endBlock, "Contract did not meet the expect");
    });

    describe("Test Senario 3: Multiple users participate in the race.", async () => {

        before("Snapshot before test senario", async() => {
            snapshot = await helper.takeSnapshot();
            snapshotContainer.deployed = snapshot['result'];
        });

        after("Revert to block before test senario", async() => {
            await helper.revertToSnapshot(snapshotContainer.deployed);
        });

        describe("Time before race end: Multiple users participate in the race.", async () => {

            before("Snapshot before test senario", async() => {
                for(let i = 0; i< 25; i++){
                    await easyMoneyRacing.sendMoney({value:1000 + i,  from: accounts[i]});
                }
                for(let i = 25; i< 50; i++){
                    await easyMoneyRacing.sendMoney({value:1049 - i,  from: accounts[i]});
                }
                for(let i = 0; i< 25; i++){
                    await easyMoneyRacing.sendMoney({value:1000 - i,  from: accounts[i]});
                }
                for(let i = 25; i< 49; i++){
                    await easyMoneyRacing.sendMoney({value:1049 - i,  from: accounts[i]});
                }
            });

            it("Multi users participate: Get total participate", async() => {
                let output = (await easyMoneyRacing.getTotalParticipate({ from: accounts[0]})).toNumber();
                assert.strictEqual(output, 50, "output should have been 50");
            });
            
            it("Multi users participate: Get total participate money", async() => {
                let output = (await easyMoneyRacing.getTotalMoney({ from: accounts[0]})).toNumber();
                assert.strictEqual(output, (1024+976)/2*50, "output should have been " + ((1024+976)/2*50));
            });

        });

        describe("Time at and after race end: User participate in the race.", async () => {
            beforeEach(async() => {
                snapshot = await helper.takeSnapshot();
                snapshotContainer.participateEndBlock = snapshot['result'];
            });

            afterEach(async() => {
                await helper.revertToSnapshot(snapshotContainer.participateEndBlock);
                // console.log("Reverted to Block number:" + await web3.eth.getBlockNumber());
            });

            it("Multi users participate: The user paticipate can retrive money", async() => {
                const txReceipt = await easyMoneyRacing.retrieveMoney({ from: accounts[12]});
                await expectEvent(
                    txReceipt,
                    "Retrive",
                    {userAddress : accounts[12], amount: new BN(988), name: ""}
                );
            });
            
            it("Multi users participate: The winner can retrive money", async() => {
                const txReceipt = await easyMoneyRacing.retrieveMoney({ from: accounts[24]});
                await expectEvent(
                    txReceipt,
                    "Retrive",
                    {userAddress : accounts[24], amount: new BN(976), name: ""}
                );
            });

            it("Multi users participate: Not the winner can't set Name", async() => {
                await expectRevert(
                    easyMoneyRacing.setName("not winner", { from: accounts[10]}),
                    "Only winner can set name."
                );
            });

            it("Multi users participate: The winner can set Name", async() => {
                const txReceipt = await easyMoneyRacing.setName("winner", { from: accounts[24]});
                await expectEvent(
                    txReceipt,
                    "Retrive",
                    {userAddress : accounts[24], amount: new BN(976), name: "winner"}
                );
            });

            it("Multi users participate: Get total participate after retrieve money and set name", async() => {
                await easyMoneyRacing.retrieveMoney({ from: accounts[12]});
                const txReceipt = await easyMoneyRacing.setName("winner", { from: accounts[24]});
                await expectEvent(
                    txReceipt,
                    "Retrive",
                    {userAddress : accounts[24], amount: new BN(976), name: "winner"}
                );
                let output = (await easyMoneyRacing.getTotalParticipate({ from: accounts[0]})).toNumber();
                assert.strictEqual(output, 50, "output should have been 50");
            });
            
            it("Multi users participate: Get total participate money after retrieve money and set name", async() => {
                await easyMoneyRacing.retrieveMoney({ from: accounts[12]});
                const txReceipt = await easyMoneyRacing.setName("winner", { from: accounts[24]});
                await expectEvent(
                    txReceipt,
                    "Retrive",
                    {userAddress : accounts[24], amount: new BN(976), name: "winner"}
                );
                let output = (await easyMoneyRacing.getTotalMoney({ from: accounts[0]})).toNumber();
                assert.strictEqual(output, (1024+976)/2*50, "output should have been " + ((1024+976)/2*50));
            });
        });
    });
});
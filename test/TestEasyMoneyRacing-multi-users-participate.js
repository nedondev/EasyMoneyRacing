//time advance ref: https://github.com/ejwessel/TimeContract
const EasyMoneyRacing = artifacts.require("./EasyMoneyRacing");
const helper = require("../utils/timeAdvanceUtils");

// https://github.com/OpenZeppelin/openzeppelin-test-helpers
const {
    BN,
    expectEvent,
    expectRevert, // Assertions for transactions that should fail
  } = require('@openzeppelin/test-helpers');
const { web3 } = require("@openzeppelin/test-helpers/src/setup");


contract("EasyMoneyRacing", (accounts) => {
    let easyMoneyRacing;
    let endBlock;
    let deployedBlock;
    // let snapshot = {};
    let snapshotContainer = new Object();
    // What is before after beforeeach aftereach?
    // https://stackoverflow.com/questions/21418580/what-is-the-difference-between-before-and-beforeeach
    before("deploy EasyMoneyRacing Contract", async() => {
        // easyMoneyRacing = await EasyMoneyRacing.new();
        // easyMoneyRacing = await EasyMoneyRacing.deployed();
        easyMoneyRacing = await EasyMoneyRacing.new({from:accounts[0]});
        // Snapshot can be used only once. https://spectrum.chat/trufflesuite/ganache/why-can-a-snapshot-only-be-used-once~250c8770-0ca3-4a54-9ded-8975740048eb
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
                    await easyMoneyRacing.sendMoney({value:1000 + i,  from: accounts[i]});
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
                assert.strictEqual(output, (1000+1024)/2*50, "output should have been " + ((1000+1024)/2*50));
            });

        });

        // Transactions in a block have execution order.
        // https://ethereum.stackexchange.com/questions/79907/order-of-transactions-in-the-same-block
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
                    {userAddress : accounts[12], amount: new BN(1012), name: ""}
                );
            });
            
            it("Multi users participate: The winner can retrive money", async() => {
                const txReceipt = await easyMoneyRacing.retrieveMoney({ from: accounts[24]});
                await expectEvent(
                    txReceipt,
                    "Retrive",
                    {userAddress : accounts[24], amount: new BN(1024), name: ""}
                );
            });

            it("Multi users participate: Not the winner can't set Name", async() => {
                await expectRevert(
                    easyMoneyRacing.setName("not winner", { from: accounts[10]}),
                    "Only winner can set name."
                );
            });

            it("Multi users participate: Not the winner can't set Name(without Math utils)", async() => {
                await expectRevert(
                    easyMoneyRacing.setNameWithoutMathUtils("not winner", { from: accounts[10]}),
                    "Only winner can set name."
                );
            });

            it("Multi users participate: The winner can set Name", async() => {
                const txReceipt = await easyMoneyRacing.setName("winner", { from: accounts[24]});
                await expectEvent(
                    txReceipt,
                    "Retrive",
                    {userAddress : accounts[24], amount: new BN(1024), name: "winner"}
                );
            });

            it("Multi users participate: Not winner can't set Name(without Math utils)", async() => {
                const txReceipt = await easyMoneyRacing.setNameWithoutMathUtils("winner", { from: accounts[24]});
                await expectEvent(
                    txReceipt,
                    "Retrive",
                    {userAddress : accounts[24], amount: new BN(1024), name: "winner"}
                );
            });
            
            it("Multi users participate: Get total participate after retrieve money and set name", async() => {
                await easyMoneyRacing.retrieveMoney({ from: accounts[12]});
                await easyMoneyRacing.setName("winner", { from: accounts[24]});
                let output = (await easyMoneyRacing.getTotalParticipate({ from: accounts[0]})).toNumber();
                assert.strictEqual(output, 50, "output should have been 50");
            });
            
            it("Multi users participate: Get total participate after retrieve money and set name(without Math utils)", async() => {
                await easyMoneyRacing.retrieveMoney({ from: accounts[12]});
                await easyMoneyRacing.setNameWithoutMathUtils("winner", { from: accounts[24]});
                let output = (await easyMoneyRacing.getTotalParticipate({ from: accounts[0]})).toNumber();
                assert.strictEqual(output, 50, "output should have been 50");
            });

            it("Multi users participate: Get total participate money after retrieve money and set name", async() => {
                await easyMoneyRacing.retrieveMoney({ from: accounts[12]});
                await easyMoneyRacing.setName("winner", { from: accounts[24]});
                let output = (await easyMoneyRacing.getTotalMoney({ from: accounts[0]})).toNumber();
                assert.strictEqual(output, (1000+1024)/2*50, "output should have been " + ((1000+1024)/2*50));
            });
            
            it("Multi users participate: Get total participate money after retrieve money and set name(without Math utils)", async() => {
                await easyMoneyRacing.retrieveMoney({ from: accounts[12]});
                await easyMoneyRacing.setNameWithoutMathUtils("winner", { from: accounts[24]});
                let output = (await easyMoneyRacing.getTotalMoney({ from: accounts[0]})).toNumber();
                assert.strictEqual(output, (1000+1024)/2*50, "output should have been " + ((1000+1024)/2*50));
            });
        });
    });
});
//time advance ref: https://github.com/ejwessel/TimeContract
const EasyMoneyRacing = artifacts.require("./EasyMoneyRacing");
const helper = require("../utils/timeAdvanceUtils");

// https://github.com/OpenZeppelin/openzeppelin-test-helpers
const {
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


    // Groups test: https://betterprogramming.pub/a-few-tips-for-unit-testing-ethereum-smart-contract-in-solidity-d804062068fb
    describe("Test Senario 1: no participate in the race.", async () => {

        before("Snapshot before test senario", async() => {
            snapshot = await helper.takeSnapshot();
            snapshotContainer.deployed = snapshot['result'];
        });

        after("Revert to block before test senario", async() => {
            await helper.revertToSnapshot(snapshotContainer.deployed);
        });

        describe("Time before race end: no participate in the race.", async () => {

            beforeEach(async() => {
                // console.log("Block number: " + await web3.eth.getBlockNumber());
            });

            it("Non-participate: Retrive money", async() => {
                // https://docs.openzeppelin.com/test-helpers/0.5/api#expect-revert
                await expectRevert(
                    easyMoneyRacing.retrieveMoney({ from: accounts[0]}),
                    "Race still going."
                );
            });
            
            it("Non-participate: Set name", async() => {
                await expectRevert(
                    easyMoneyRacing.setName({ from: accounts[0]}),
                    "Race still going."
                );
            });

            it("Non-participate: Set name without math utils", async() => {
                await expectRevert(
                    easyMoneyRacing.setNameWithoutMathUtils({ from: accounts[0]}),
                    "Race still going."
                );
            });

            it("Non-participate: Get total participate", async() => {
                let output = (await easyMoneyRacing.getTotalParticipate({ from: accounts[0]})).toNumber();
                // assert.strictEqual vs assert.equal
                // https://www.w3schools.com/nodejs/met_assert_equal.asp
                assert.strictEqual(output, 0, "output should have been 0");
            });
            
            it("Non-participate: Get total participate money", async() => {
                let output = (await easyMoneyRacing.getTotalMoney({ from: accounts[0]})).toNumber();
                assert.strictEqual(output, 0, "output should have been 0");
            });

            it("Non-participate: Show winner name", async() => {
                let output = await easyMoneyRacing.showWinner({ from: accounts[0]});
                assert.strictEqual(output, "Race still going.", "output shoul show a warning");
            });

        });


        describe("Time at race end: No participate in the race.", async () => {
            
            before("Revert to block after deployed and advance until block before end race.", async() => {
                await helper.revertToSnapshot(snapshotContainer.deployed);
                snapshot = await helper.takeSnapshot();
                snapshotContainer.deployed = snapshot['result'];

                // console.log("Reverted to Block number:" + await web3.eth.getBlockNumber());
                while ( await web3.eth.getBlockNumber() < endBlock - 1 ) {
                    await helper.advanceBlock();
                }
                // console.log("Advanced to Block number:" + await web3.eth.getBlockNumber());
            });
            
            beforeEach(async() => {
                snapshot = await helper.takeSnapshot();
                snapshotContainer.noparticipateEndBlock = snapshot['result'];
            });

            afterEach(async() => {
                await helper.revertToSnapshot(snapshotContainer.noparticipateEndBlock);
                // console.log("Reverted to Block number:" + await web3.eth.getBlockNumber());
            });

            it("Non-participate: Send money", async() => {
                await expectRevert(
                    easyMoneyRacing.sendMoney({ from: accounts[0]}),
                    "Race have ended."
                );
            });

            it("Non-participate: Retrive money", async() => {
                await expectRevert(
                    easyMoneyRacing.retrieveMoney({ from: accounts[0]}),
                    "User did not participate."
                );
            });
            
            it("Non-participate: Set name", async() => {
                await expectRevert(
                    easyMoneyRacing.setName({ from: accounts[0]}),
                    "User did not participate."
                );
            });

            it("Non-participate: Set name without math utils", async() => {
                await expectRevert(
                    easyMoneyRacing.setNameWithoutMathUtils({ from: accounts[0]}),
                    "User did not participate."
                );
            });

            describe("Test call command.", async () => {

                before(async() => {
                    // Advance another block to end block.
                    await helper.advanceBlock();
                    // console.log("Advanced to Block number:" + await web3.eth.getBlockNumber());
                });

                it("Non-participate: Get total participate", async() => {
                    let output = (await easyMoneyRacing.getTotalParticipate({ from: accounts[0]})).toNumber();
                    assert.strictEqual(output, 0, "output should have been 0");
                });
                
                it("Non-participate: Get total participate money", async() => {
                    let output = (await easyMoneyRacing.getTotalMoney({ from: accounts[0]})).toNumber();
                    assert.strictEqual(output, 0, "output should have been 0");
                });

                it("Non-participate: Show winner name", async() => {
                    let output = await easyMoneyRacing.showWinner({ from: accounts[0]});
                    assert.strictEqual(output, "", "output should show a warning");
                });
            });

        });
        
        describe("Time after race end: no participate in the race.", async () => {
            
            before("Revert to block after deployed and advance until block before end race.", async() => {
                await helper.advanceBlock();
            });
            
            it("Non-participate: Send money", async() => {
                await expectRevert(
                    easyMoneyRacing.sendMoney({ from: accounts[0]}),
                    "Race have ended."
                );
            });

            it("Non-participate: Retrive money", async() => {
                await expectRevert(
                    easyMoneyRacing.retrieveMoney({ from: accounts[0]}),
                    "User did not participate."
                );
            });
            
            it("Non-participate: Set name", async() => {
                await expectRevert(
                    easyMoneyRacing.setName({ from: accounts[0]}),
                    "User did not participate."
                );
            });

            it("Non-participate: Set name without math utils", async() => {
                await expectRevert(
                    easyMoneyRacing.setNameWithoutMathUtils({ from: accounts[0]}),
                    "User did not participate."
                );
            });

            describe("Test call command.", async () => {

                it("Non-participate: Get total participate", async() => {
                    await helper.advanceBlock();
                    let output = (await easyMoneyRacing.getTotalParticipate({ from: accounts[0]})).toNumber();
                    assert.strictEqual(output, 0, "output should have been 0");
                });
                
                it("Non-participate: Get total participate money", async() => {
                    let output = (await easyMoneyRacing.getTotalMoney({ from: accounts[0]})).toNumber();
                    assert.strictEqual(output, 0, "output should have been 0");
                });

                it("Non-participate: Show winner name", async() => {
                    let output = await easyMoneyRacing.showWinner({ from: accounts[0]});
                    assert.strictEqual(output, "", "output should show a warning");
                });
            });

        });

    });
});
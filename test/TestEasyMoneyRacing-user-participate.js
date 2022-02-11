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

    describe("Test Senario 2: A user participate in the race.", async () => {

        before("Snapshot before test senario", async() => {
            snapshot = await helper.takeSnapshot();
            snapshotContainer.deployed = snapshot['result'];
        });

        after("Revert to block before test senario", async() => {
            await helper.revertToSnapshot(snapshotContainer.deployed);
        });

        describe("Time before race end: User participate in the race.", async () => {
            describe("A user participate: Send money", async () => {
                it("Not send money", async() => {
                    await expectRevert(
                        easyMoneyRacing.sendMoney({ from: accounts[0]}),
                        "No money have been sent."
                    );
                });

                it("Send money", async() => {
                    const txReceipt = await easyMoneyRacing.sendMoney({value:10,  from: accounts[0]});
                    await expectEvent(
                        txReceipt,
                        "Participate",
                        {userAddress : accounts[0], amount : new BN(10)}
                    );
                });

                it("Send money same account (should the old balance replaced in version 0.0.1)", async() => {
                    const txReceipt = await easyMoneyRacing.sendMoney({value:15,  from: accounts[0]});
                    await expectEvent(
                        txReceipt,
                        "Participate",
                        {userAddress : accounts[0], amount : new BN(15)}
                    );
                });
            });

            describe("A User participate: Retrive money", async () => {
                it("User without money sent", async() => {
                    await expectRevert(
                        easyMoneyRacing.retrieveMoney({ from: accounts[1]}),
                        "Race still going."
                    );
                });
                
                it("User with money sent", async() => {
                    await expectRevert(
                        easyMoneyRacing.retrieveMoney({ from: accounts[0]}),
                        "Race still going."
                    );
                });
            });
            
            describe("A user participate: Set name", async () => {
                it("User without money sent", async() => {
                    await expectRevert(
                        easyMoneyRacing.setName({ from: accounts[1]}),
                        "Race still going."
                    );
                });
                
                it("User with most money sent", async() => {
                    await expectRevert(
                        easyMoneyRacing.setName({ from: accounts[0]}),
                        "Race still going."
                    );
                });
            });
            
            describe("A user participate: Set name without math utils", async () => {
                it("User without money sent", async() => {
                    await expectRevert(
                        easyMoneyRacing.setNameWithoutMathUtils({ from: accounts[1]}),
                        "Race still going."
                    );
                });
                
                it("User with most money sent", async() => {
                    await expectRevert(
                        easyMoneyRacing.setNameWithoutMathUtils({ from: accounts[0]}),
                        "Race still going."
                    );
                });
            });

            describe("Test call command.", async () => {

                it("A user participate: get total participate", async() => {
                    await helper.advanceBlock();
                    let output = (await easyMoneyRacing.getTotalParticipate({ from: accounts[0]})).toNumber();
                    assert.strictEqual(output, 1, "output should have been 1");
                });
                
                it("A user participate: get total participate money", async() => {
                    let output = (await easyMoneyRacing.getTotalMoney({ from: accounts[0]})).toNumber();
                    assert.strictEqual(output, 15, "output should have been 15");
                });

                it("A user participate: show winner name", async() => {
                    let output = await easyMoneyRacing.showWinner({ from: accounts[0]});
                    assert.strictEqual(output, "Race still going.", "output should show a warning");
                });
            });

        });

        describe("Time at race end: User participate in the race.", async () => {
            
            before("Advance to the block before end race.", async() => {
                while ( await web3.eth.getBlockNumber() < endBlock - 1 ) {
                    await helper.advanceBlock();
                }
                // console.log("Advanced to Block number:" + await web3.eth.getBlockNumber());
            });
            
            beforeEach(async() => {
                snapshot = await helper.takeSnapshot();
                snapshotContainer.participateEndBlock = snapshot['result'];
            });

            afterEach(async() => {
                await helper.revertToSnapshot(snapshotContainer.participateEndBlock);
                // console.log("Reverted to Block number:" + await web3.eth.getBlockNumber());
            });

            describe("A user participate: Send money", async () => {

                beforeEach(async() => {
                    snapshot = await helper.takeSnapshot();
                    snapshotContainer.participateEndBlock = snapshot['result'];
                });

                afterEach(async() => {
                    await helper.revertToSnapshot(snapshotContainer.participateEndBlock);
                    // console.log("Reverted to Block number:" + await web3.eth.getBlockNumber());
                });

                it("Not send money", async() => {
                    await expectRevert(
                        easyMoneyRacing.sendMoney({ from: accounts[0]}),
                        "Race have ended."
                    );
                });

                it("Send money", async() => {
                    it("Not send money", async() => {
                        await expectRevert(
                            easyMoneyRacing.sendMoney({value:10,  from: accounts[0]}),
                            "Race have ended."
                        );
                    });
                });
            });

            describe("A User participate: Retrive money", async () => {

                beforeEach(async() => {
                    snapshot = await helper.takeSnapshot();
                    snapshotContainer.participateEndBlock = snapshot['result'];
                });

                afterEach(async() => {
                    await helper.revertToSnapshot(snapshotContainer.participateEndBlock);
                    // console.log("Reverted to Block number:" + await web3.eth.getBlockNumber());
                });

                it("User without money sent", async() => {
                    await expectRevert(
                        easyMoneyRacing.retrieveMoney({ from: accounts[1]}),
                        "User did not participate."
                    );
                });
                
                it("User with money sent", async() => {
                    const txReceipt = await easyMoneyRacing.retrieveMoney({ from: accounts[0]});
                    await expectEvent(
                        txReceipt,
                        "Retrive",
                        {userAddress : accounts[0], amount: new BN(15), name: ""}
                    );
                });
            });
            
            describe("A user participate: Set name", async () => {

                beforeEach(async() => {
                    snapshot = await helper.takeSnapshot();
                    snapshotContainer.participateEndBlock = snapshot['result'];
                });

                afterEach(async() => {
                    await helper.revertToSnapshot(snapshotContainer.participateEndBlock);
                    // console.log("Reverted to Block number:" + await web3.eth.getBlockNumber());
                });

                it("User without money sent", async() => {
                    await expectRevert(
                        easyMoneyRacing.setName("", { from: accounts[1]}),
                        "User did not participate."
                    );
                });
                
                it("User with most money sent", async() => {
                    const txReceipt = await easyMoneyRacing.setName("", { from: accounts[0]});
                    await expectEvent(
                        txReceipt,
                        "Retrive",
                        {userAddress : accounts[0], amount: new BN(15), name: ""}
                    );
                });

                it("User with most money sent set name", async() => {
                    const txReceipt = await easyMoneyRacing.setName("winner", { from: accounts[0]});
                    await expectEvent(
                        txReceipt,
                        "Retrive",
                        {userAddress : accounts[0], amount: new BN(15), name: "winner"}
                    );
                });

                it("User with most money sent set name multiple times", async() => {
                    await easyMoneyRacing.setName("winner", { from: accounts[0]});
                    await expectRevert(
                        easyMoneyRacing.setName("winner", { from: accounts[0]}),
                        "Money have retrieved."
                    );
                });

                it("User with most money retrive money set name", async() => {
                    await easyMoneyRacing.retrieveMoney( { from: accounts[0]});
                    await expectRevert(
                        easyMoneyRacing.setName("winner", { from: accounts[0]}),
                        "Money have retrieved."
                    );
                });
            });
            
            describe("A user participate: Set name without math utils", async () => {
                beforeEach(async() => {
                    snapshot = await helper.takeSnapshot();
                    snapshotContainer.participateEndBlock = snapshot['result'];
                });

                afterEach(async() => {
                    await helper.revertToSnapshot(snapshotContainer.participateEndBlock);
                    // console.log("Reverted to Block number:" + await web3.eth.getBlockNumber());
                });

                it("User without money sent", async() => {
                    await expectRevert(
                        easyMoneyRacing.setNameWithoutMathUtils("", { from: accounts[1]}),
                        "User did not participate."
                    );
                });
                
                it("User with most money sent", async() => {
                    const txReceipt = await easyMoneyRacing.setNameWithoutMathUtils({ from: accounts[0]});
                    await expectEvent(
                        txReceipt,
                        "Retrive",
                        {userAddress : accounts[0], amount: new BN(15), name: ""}
                    );
                });

                it("User with most money sent set name", async() => {
                    const txReceipt = await easyMoneyRacing.setNameWithoutMathUtils("winner", { from: accounts[0]});
                    await expectEvent(
                        txReceipt,
                        "Retrive",
                        {userAddress : accounts[0], amount: new BN(15), name: "winner"}
                    );
                });

                it("User with most money sent set name multiple times", async() => {
                    await easyMoneyRacing.setNameWithoutMathUtils("winner", { from: accounts[0]});
                    await expectRevert(
                        easyMoneyRacing.setNameWithoutMathUtils("winner", { from: accounts[0]}),
                        "Money have retrieved."
                    );
                });

                it("User with most money sent retrieve and set name multiple times", async() => {
                    await easyMoneyRacing.retrieveMoney({ from: accounts[0]});
                    await expectRevert(
                        easyMoneyRacing.setNameWithoutMathUtils("winner", { from: accounts[0]}),
                        "Money have retrieved."
                    );
                });
            });

            describe("Test call command.", async () => {

                beforeEach(async() => {
                    snapshot = await helper.takeSnapshot();
                    snapshotContainer.participateEndBlock = snapshot['result'];
                });

                afterEach(async() => {
                    await helper.revertToSnapshot(snapshotContainer.participateEndBlock);
                    // console.log("Reverted to Block number:" + await web3.eth.getBlockNumber());
                });

                it("User participate: Get total participate", async() => {
                    await helper.advanceBlock();
                    let output = (await easyMoneyRacing.getTotalParticipate({ from: accounts[0]})).toNumber();
                    assert.strictEqual(output, 1, "output should have been 1");
                });
                
                it("User participate: Get total participate money", async() => {
                    await helper.advanceBlock();
                    let output = (await easyMoneyRacing.getTotalMoney({ from: accounts[0]})).toNumber();
                    assert.strictEqual(output, 15, "output should have been 15");
                });

                it("User participate: Show winner name(without winner have set name)", async() => {
                    await helper.advanceBlock();
                    let output = await easyMoneyRacing.showWinner({ from: accounts[0]});
                    assert.strictEqual(output, "", "output should show a warning");
                });

                it("User participate: Show winner name(with winner have set name)", async() => {
                    await easyMoneyRacing.setNameWithoutMathUtils("winner", { from: accounts[0]});
                    let output = await easyMoneyRacing.showWinner({ from: accounts[0]});
                    assert.strictEqual(output, "winner", "output should show a warning");
                });
            });

        });

        describe("Time after race end: User participate in the race.", async () => {
            
            before("Advance to the block before end race.", async() => {
                while ( await web3.eth.getBlockNumber() < endBlock ) {
                    await helper.advanceBlock();
                }
                // console.log("Advanced to Block number:" + await web3.eth.getBlockNumber());
            });
            
            beforeEach(async() => {
                snapshot = await helper.takeSnapshot();
                snapshotContainer.participateEndBlock = snapshot['result'];
            });

            afterEach(async() => {
                await helper.revertToSnapshot(snapshotContainer.participateEndBlock);
                // console.log("Reverted to Block number:" + await web3.eth.getBlockNumber());
            });

            describe("A user participate: Send money", async () => {

                beforeEach(async() => {
                    snapshot = await helper.takeSnapshot();
                    snapshotContainer.participateEndBlock = snapshot['result'];
                });

                afterEach(async() => {
                    await helper.revertToSnapshot(snapshotContainer.participateEndBlock);
                    // console.log("Reverted to Block number:" + await web3.eth.getBlockNumber());
                });

                it("Not send money", async() => {
                    await expectRevert(
                        easyMoneyRacing.sendMoney({ from: accounts[0]}),
                        "Race have ended."
                    );
                });

                it("Send money", async() => {
                    it("Not send money", async() => {
                        await expectRevert(
                            easyMoneyRacing.sendMoney({value:10,  from: accounts[0]}),
                            "Race have ended."
                        );
                    });
                });
            });

            describe("A User participate: Retrive money", async () => {

                beforeEach(async() => {
                    snapshot = await helper.takeSnapshot();
                    snapshotContainer.participateEndBlock = snapshot['result'];
                });

                afterEach(async() => {
                    await helper.revertToSnapshot(snapshotContainer.participateEndBlock);
                    // console.log("Reverted to Block number:" + await web3.eth.getBlockNumber());
                });

                it("User without money sent", async() => {
                    await expectRevert(
                        easyMoneyRacing.retrieveMoney({ from: accounts[1]}),
                        "User did not participate."
                    );
                });
                
                it("User with money sent", async() => {
                    const txReceipt = await easyMoneyRacing.retrieveMoney({ from: accounts[0]});
                    await expectEvent(
                        txReceipt,
                        "Retrive",
                        {userAddress : accounts[0], amount: new BN(15), name: ""}
                    );
                });
            });
            
            describe("A user participate: Set name", async () => {

                beforeEach(async() => {
                    snapshot = await helper.takeSnapshot();
                    snapshotContainer.participateEndBlock = snapshot['result'];
                });

                afterEach(async() => {
                    await helper.revertToSnapshot(snapshotContainer.participateEndBlock);
                    // console.log("Reverted to Block number:" + await web3.eth.getBlockNumber());
                });

                it("User without money sent", async() => {
                    await expectRevert(
                        easyMoneyRacing.setName("", { from: accounts[1]}),
                        "User did not participate."
                    );
                });
                
                it("User with most money sent", async() => {
                    const txReceipt = await easyMoneyRacing.setName("", { from: accounts[0]});
                    await expectEvent(
                        txReceipt,
                        "Retrive",
                        {userAddress : accounts[0], amount: new BN(15), name: ""}
                    );
                });

                it("User with most money sent set name", async() => {
                    const txReceipt = await easyMoneyRacing.setName("winner", { from: accounts[0]});
                    await expectEvent(
                        txReceipt,
                        "Retrive",
                        {userAddress : accounts[0], amount: new BN(15), name: "winner"}
                    );
                });

                it("User with most money sent set name multiple times", async() => {
                    await easyMoneyRacing.setName("winner", { from: accounts[0]});
                    await expectRevert(
                        easyMoneyRacing.setName("winner", { from: accounts[0]}),
                        "Money have retrieved."
                    );
                });

                it("User with most money retrive money set name", async() => {
                    await easyMoneyRacing.retrieveMoney( { from: accounts[0]});
                    await expectRevert(
                        easyMoneyRacing.setName("winner", { from: accounts[0]}),
                        "Money have retrieved."
                    );
                });
            });
            
            describe("A user participate: Set name without math utils", async () => {
                beforeEach(async() => {
                    snapshot = await helper.takeSnapshot();
                    snapshotContainer.participateEndBlock = snapshot['result'];
                });

                afterEach(async() => {
                    await helper.revertToSnapshot(snapshotContainer.participateEndBlock);
                    // console.log("Reverted to Block number:" + await web3.eth.getBlockNumber());
                });

                it("User without money sent", async() => {
                    await expectRevert(
                        easyMoneyRacing.setNameWithoutMathUtils("", { from: accounts[1]}),
                        "User did not participate."
                    );
                });
                
                it("User with most money sent", async() => {
                    const txReceipt = await easyMoneyRacing.setNameWithoutMathUtils({ from: accounts[0]});
                    await expectEvent(
                        txReceipt,
                        "Retrive",
                        {userAddress : accounts[0], amount: new BN(15), name: ""}
                    );
                });

                it("User with most money sent set name", async() => {
                    const txReceipt = await easyMoneyRacing.setNameWithoutMathUtils("winner", { from: accounts[0]});
                    await expectEvent(
                        txReceipt,
                        "Retrive",
                        {userAddress : accounts[0], amount: new BN(15), name: "winner"}
                    );
                });

                it("User with most money sent set name multiple times", async() => {
                    await easyMoneyRacing.setNameWithoutMathUtils("winner", { from: accounts[0]});
                    await expectRevert(
                        easyMoneyRacing.setNameWithoutMathUtils("winner", { from: accounts[0]}),
                        "Money have retrieved."
                    );
                });

                it("User with most money sent retrieve and set name multiple times", async() => {
                    await easyMoneyRacing.retrieveMoney({ from: accounts[0]});
                    await expectRevert(
                        easyMoneyRacing.setNameWithoutMathUtils("winner", { from: accounts[0]}),
                        "Money have retrieved."
                    );
                });
            });

            describe("Test call command.", async () => {

                beforeEach(async() => {
                    snapshot = await helper.takeSnapshot();
                    snapshotContainer.participateEndBlock = snapshot['result'];
                });

                afterEach(async() => {
                    await helper.revertToSnapshot(snapshotContainer.participateEndBlock);
                    // console.log("Reverted to Block number:" + await web3.eth.getBlockNumber());
                });

                it("User participate: Get total participate", async() => {
                    await helper.advanceBlock();
                    let output = (await easyMoneyRacing.getTotalParticipate({ from: accounts[0]})).toNumber();
                    assert.strictEqual(output, 1, "output should have been 1");
                });
                
                it("User participate: Get total participate money", async() => {
                    await helper.advanceBlock();
                    let output = (await easyMoneyRacing.getTotalMoney({ from: accounts[0]})).toNumber();
                    assert.strictEqual(output, 15, "output should have been 15");
                });

                it("User participate: Show winner name(without winner have set name)", async() => {
                    await helper.advanceBlock();
                    let output = await easyMoneyRacing.showWinner({ from: accounts[0]});
                    assert.strictEqual(output, "", "output should show a warning");
                });

                it("User participate: Show winner name(with winner have set name)", async() => {
                    await easyMoneyRacing.setNameWithoutMathUtils("winner", { from: accounts[0]});
                    let output = await easyMoneyRacing.showWinner({ from: accounts[0]});
                    assert.strictEqual(output, "winner", "output should show a warning");
                });
            });

        });
    });
});
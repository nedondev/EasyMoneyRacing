// contracts/EasyMoneyRacing.sol
// SPDX-License-Identifier: GPL-3.0
// version 0.0.1 
// [x] 1 race/contract race will end in block(x) by x specify in contract code.
// [x] After race end no one will be able to participate the race.
// [x] All users participate will be able to retrive money back when race end. (protect against barrow other participated money)
// [x] The race winner will be able to retrive money with name set to blockchain. (Can be only set 1 time) 
// [x] The winner will not be able to set name if The winner choose to only retrived money.
// [x] In this version will be a bug that a participate that send money again will replace their record.
// [x] The replaced money will remain in contract without retrieve replaced money function implement.
// [x] The money replaced bug will be solved in version 0.1.0 and so on.
// [x] Write unit test for none participate competition.
// [x] Write unit test with ganache revert after test for non participate competition.
pragma solidity 0.8.11; 

// Changed from 'import "@openzeppelin/contracts/utils/math/Math.sol";' to avoid editor error.
import "../node_modules/@openzeppelin/contracts/utils/math/Math.sol";

contract EasyMoneyRacing {

    // Mapping tutorial: https://medium.com/coinmonks/solidity-tutorial-all-about-mappings-29a12269ee14
    struct UserData {
        // User participated money amount
        uint256 money;
        // User retrived money status
        bool retriveStatus;
    }

    // dictionary that maps addresses to user data
    mapping (address => UserData) private usersData;
    
    // Participate user address
    address[] private usersAddress;

    // Set default end block
    // https://docs.soliditylang.org/en/v0.4.24/units-and-global-variables.html
    // block.number =  the block that the contract is mined in.
    uint public endBlock = block.number + 100;
    
    // For version before 0.1.0: Just for record all money contract received.
    uint256 public totalSentMoney = 0;

    // Set default end block
    string public winnerName;

    // Events - publicize actions to external listeners
    event Participate(address indexed userAddress, uint amount);
    event Retrive(address indexed userAddress, uint amount, string name);

    constructor(){
    }

    // external https://ethereum.stackexchange.com/questions/19380/external-vs-public-best-practices
    // https://docs.soliditylang.org/en/v0.8.11/contracts.html#:~:text=External%20functions%20are%20part%20of,other%20contracts%20and%20via%20transactions.
    function sendMoney() external payable {
        require(block.number < endBlock, "Race have ended.");
        require(msg.value > 0, "No money have been sent.");
        
        // Record account in array for looping
        if (0 == usersData[msg.sender].money) {
            usersAddress.push(msg.sender);
        }

        // For version: 0.1.0
        // usersData[msg.sender].money = usersData[msg.sender].money + msg.value;
        usersData[msg.sender].money = msg.value;
        
        totalSentMoney += msg.value;

        // Broadcast participate event
        emit Participate(msg.sender, msg.value); // fire event

        // no return
        // https://stackoverflow.com/questions/36807720/how-to-get-return-values-when-function-with-argument-is-called
        // https://medium.com/coinmonks/return-values-in-solidity-contracts-2a034b31d553
    }

    function retrieveMoney() external {
        require(block.number >= endBlock, "Race still going.");
        require(usersData[msg.sender].money > 0, "User did not participate.");
        // the require statement below didn't filter non participate user.
        // default value in mapping will exist and bool will be false
        require(usersData[msg.sender].retriveStatus == false, "Money have retrieved.");
        usersData[msg.sender].retriveStatus = true;

        // Revert on failed
        // cast object type to payable
        // https://stackoverflow.com/questions/67341914/error-send-and-transfer-are-only-available-for-objects-of-type-address-payable
        payable(msg.sender).transfer(usersData[msg.sender].money);

        // Broadcast retrive event
        emit Retrive(msg.sender, usersData[msg.sender].money, ""); // fire event
    }

    // one participate gas: 66558
    // 100 participate gas: 564832
    // Should fix by find winner when reveice money from participation
    function setName(string memory name) external {
        require(block.number >= endBlock, "Race still going.");
        require(usersData[msg.sender].money > 0, "User did not participate.");
        require(usersData[msg.sender].retriveStatus == false, "Money have retrieved.");
        address winner = usersAddress[0];
        uint256 mostMoney = usersData[usersAddress[0]].money;
        for(uint256 userIndex = 1; userIndex < usersAddress.length; userIndex++) {
            uint256 previousMostMoney = mostMoney;
            mostMoney = Math.max(mostMoney, usersData[usersAddress[userIndex]].money);
            if (previousMostMoney != mostMoney)
            {
                winner = usersAddress[userIndex];
            }
        }
        require(msg.sender == winner, "Only winner can set name.");
        winnerName = name;
        usersData[msg.sender].retriveStatus = true;

        // Revert on failed
        // cast object type to payable
        // https://stackoverflow.com/questions/67341914/error-send-and-transfer-are-only-available-for-objects-of-type-address-payable
        payable(msg.sender).transfer(usersData[msg.sender].money);

        // Broadcast retrive event
        emit Retrive(msg.sender, usersData[msg.sender].money, name); // fire event
    }
    
    // set Name without using openzippelin math utils
    // one participate gas: 66558
    // 100 participate gas: 580764
    function setNameWithoutMathUtils(string memory name) external {
        require(block.number >= endBlock, "Race still going");
        require(usersData[msg.sender].money > 0, "User did not participate.");
        require(usersData[msg.sender].retriveStatus == false, "Money have retrieved.");
        address winner = usersAddress[0];
        uint256 mostMoney = usersData[usersAddress[0]].money;
        for(uint256 userIndex = 1; userIndex < usersAddress.length; userIndex++) {
            if (mostMoney < usersData[usersAddress[userIndex]].money) {
                mostMoney = usersData[usersAddress[userIndex]].money;
                winner = usersAddress[userIndex];
            }
        }
        require(msg.sender == winner, "Only winner can set name.");
        winnerName = name;
        usersData[msg.sender].retriveStatus = true;

        // Revert on failed
        // cast object type to payable
        // https://stackoverflow.com/questions/67341914/error-send-and-transfer-are-only-available-for-objects-of-type-address-payable
        payable(msg.sender).transfer(usersData[msg.sender].money);

        // Broadcast retrive event
        emit Retrive(msg.sender, usersData[msg.sender].money, name); // fire event
    }

    function getTotalParticipate() public view returns(uint256) {
        return usersAddress.length;
    }
    
    function getTotalMoney() public view returns(uint256) {
        uint256 totalMoney = 0;
        for(uint256 userIndex; userIndex < usersAddress.length; userIndex++)
        {
            totalMoney += usersData[usersAddress[userIndex]].money;
        }
        return totalMoney;
    }
    
    function showWinner() public view returns(string memory) {
        if (block.number < endBlock)
        {
            return "Race still going.";
        }
        return winnerName;
    }
}
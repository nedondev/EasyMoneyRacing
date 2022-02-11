// contracts/EasyMoneyRacing.sol
// SPDX-License-Identifier: GPL-3.0
// version 0.0.1 
pragma solidity 0.8.11; 

import "../node_modules/@openzeppelin/contracts/utils/math/Math.sol";

contract EasyMoneyRacing {

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
        emit Participate(msg.sender, msg.value);
    }

    function retrieveMoney() external {
        require(block.number >= endBlock, "Race still going.");
        require(usersData[msg.sender].money > 0, "User did not participate.");
        require(usersData[msg.sender].retriveStatus == false, "Money have retrieved.");
        usersData[msg.sender].retriveStatus = true;

        // Revert on failed
        payable(msg.sender).transfer(usersData[msg.sender].money);

        // Broadcast retrive event
        emit Retrive(msg.sender, usersData[msg.sender].money, "");
    }

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
        payable(msg.sender).transfer(usersData[msg.sender].money);

        // Broadcast retrive event
        emit Retrive(msg.sender, usersData[msg.sender].money, name);
    }
    
    // set Name without using openzippelin math utils
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

        payable(msg.sender).transfer(usersData[msg.sender].money);

        // Broadcast retrive event
        emit Retrive(msg.sender, usersData[msg.sender].money, name);
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
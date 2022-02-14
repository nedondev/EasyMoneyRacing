# EasyMoneyRacing

A smart contract that have people to racing their money against other and the winner can engrave their name to the blockchain.

# Requirement

- unix-like system

- node or nvm (https://github.com/nvm-sh/nvm)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
source ~/.bashrc
nvm install --lts
```

- truffle (https://github.com/trufflesuite/truffle)

```bash
npm install -g truffle 
```

You may need to run this if on MacOS or Linux

```bash
sudo npm install -g truffle
```
For WSL that not use subsystem path and execute without root permission.

```bash
sudo chown <username>:<username> .
```

- ganache (https://github.com/trufflesuite/ganache)

```bash
npm install ganache --global
```

# Init Project

- Start ganache

```bash
ganache -a 100
```

- Clone this project

```bash
git clone https://github.com/nedondev/EasyMoneyRacing
```

```bash
cd EasyMoneyRacing
```

# Verify Project will work correctly

```bash
truffle test
```

# Deploy Project

```bash
truffle migrate
```

# Interact with deployed EasyMoneyRacing contract

```bash
truffle console
```

- Get deployed contract.

```javascript
const contract = await EasyMoneyRacing.at('<contract-address>');
```

- Use deployed contract.

```javascript
contract.<method-name>()
```

Example:

```javascript
contract.getTotalMoney()
```
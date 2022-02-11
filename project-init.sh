#!/bin/bash

truffle init && \
npm install @truffle/hdwallet-provider && \
npm install dotenv && \
npm install ganache-time-traveler && \
npm install @openzeppelin/contracts && \
npm install --save-dev @openzeppelin/test-helpers

require("dotenv").config();

require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");

require("hardhat-deploy");

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
    solidity: {
        compilers: [
            { version: "0.8.8" },
            { version: "0.6.6" }
        ],
    },
    networks: {
        ropsten: {
            url: process.env.ROPSTEN_URL || "",
            blockConfirmations: 6,
            accounts:
                process.env.PRIVATE_KEY !== undefined
                    ? [process.env.PRIVATE_KEY]
                    : [],
        },
    },
    gasReporter: {
        // enabled: process.env.REPORT_GAS !== undefined,
        enabled: true,
        currency: "USD",
        outputFile: "gas-report.txt",
        noColors: true,
    },
    etherscan: {
        apiKey: process.env.ETHERSCAN_API_KEY,
    },
    namedAccounts: {
        deployer: {
            default: 0,
            // 4: 1 refers to the network. 4 is rinkeby. 31337 would be hardhat
        },
        user: {
            default: 1,
        },
    },
};

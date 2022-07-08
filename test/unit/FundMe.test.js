const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async () => {
          let fundMe;
          let deployer;
          let mockV3Aggregator;
          const sendValue = ethers.utils.parseEther("1");
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer;
              await deployments.fixture(["all"]);
              fundMe = await ethers.getContract("FundMe", deployer);
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              );
          });
          describe("constructor", async () => {
              it("sets the aggregator addresses correctly", async () => {
                  const response = await fundMe.getPriceFeed();
                  assert.equal(response, mockV3Aggregator.address);
              });
          });

          describe("fund", async function () {
              it("It fails if you dont send enough ETH", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "You need to spend more ETH!"
                  );
              });
              it("Updates the amount funded data structure", async function () {
                  await fundMe.fund({ value: sendValue });
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  );
                  assert.equal(response.toString(), sendValue.toString());
              });
              it("adds funder to an array of getFunder", async function () {
                  await fundMe.fund({ value: sendValue });
                  const funder = await fundMe.getFunder(0);
                  assert.equal(funder, deployer);
              });
          });

          describe("withdraw", async function () {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue });
              });

              it("withdraw ETH from a single founder", async function () {
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address);
                  const ownerStartingBalance = await fundMe.provider.getBalance(
                      deployer
                  );
                  const transactionResponse = await fundMe.withdraw();
                  const transactionReceipt = await transactionResponse.wait(1);

                  const { gasUsed, effectiveGasPrice } = transactionReceipt;
                  const gasCost = gasUsed.mul(effectiveGasPrice);

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );

                  const endingOwnerBalance = await fundMe.provider.getBalance(
                      deployer
                  );
                  assert.equal(endingFundMeBalance, 0);

                  assert.equal(
                      startingFundMeBalance
                          .add(ownerStartingBalance)
                          .toString(),
                      endingOwnerBalance.add(gasCost).toString()
                  );
              });
          });

          it("allows us to withdraw with multiple getFunder", async function () {
              const accounts = await ethers.getSigners();
              for (let i = 1; i < 6; i++) {
                  const fundMeConnectedContract = await fundMe.connect(
                      accounts[i]
                  );
                  await fundMeConnectedContract.fund({ value: sendValue });
              }
              const startingFundMeBalance = await fundMe.provider.getBalance(
                  fundMe.address
              );
              const ownerStartingBalance = await fundMe.provider.getBalance(
                  deployer
              );

              const transactionResponse = await fundMe.withdraw();
              const transactionReceipt = await transactionResponse.wait(1);
              const { gasUsed, effectiveGasPrice } = transactionReceipt;
              const gasCost = gasUsed.mul(effectiveGasPrice);

              const endingFundMeBalance = await fundMe.provider.getBalance(
                  fundMe.address
              );

              const endingOwnerBalance = await fundMe.provider.getBalance(
                  deployer
              );

              assert.equal(endingFundMeBalance, 0);
              assert.equal(
                  startingFundMeBalance.add(ownerStartingBalance).toString(),
                  endingOwnerBalance.add(gasCost).toString()
              );

              await expect(fundMe.getFunder(0)).to.be.reverted;
              for (i = 1; i < 6; i++) {
                  assert.equal(
                      await fundMe.getAddressToAmountFunded(
                          accounts[i].address
                      ),
                      0
                  );
              }
          });

          it("only allows the owner to withdraw", async function () {
              const accounts = await ethers.getSigners();
              const attack = accounts[1];
              const attackConnectedContract = await fundMe.connect(
                  attack.address
              );
              await expect(attackConnectedContract.withdraw()).to.be.reverted;
          });

          it("cheaper withdraw", async function () {
              const accounts = await ethers.getSigners();
              for (let i = 1; i < 6; i++) {
                  const fundMeConnectedContract = await fundMe.connect(
                      accounts[i]
                  );
                  await fundMeConnectedContract.fund({ value: sendValue });
              }
              const startingFundMeBalance = await fundMe.provider.getBalance(
                  fundMe.address
              );
              const ownerStartingBalance = await fundMe.provider.getBalance(
                  deployer
              );

              const transactionResponse = await fundMe.cheaperWithdraw();
              const transactionReceipt = await transactionResponse.wait(1);
              const { gasUsed, effectiveGasPrice } = transactionReceipt;
              const gasCost = gasUsed.mul(effectiveGasPrice);

              const endingFundMeBalance = await fundMe.provider.getBalance(
                  fundMe.address
              );

              const endingOwnerBalance = await fundMe.provider.getBalance(
                  deployer
              );

              assert.equal(endingFundMeBalance, 0);
              assert.equal(
                  startingFundMeBalance.add(ownerStartingBalance).toString(),
                  endingOwnerBalance.add(gasCost).toString()
              );

              await expect(fundMe.getFunder(0)).to.be.reverted;
              for (i = 1; i < 6; i++) {
                  assert.equal(
                      await fundMe.getAddressToAmountFunded(
                          accounts[i].address
                      ),
                      0
                  );
              }
          });
      });

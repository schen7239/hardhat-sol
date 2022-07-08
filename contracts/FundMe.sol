// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";

error FundMe__NotOwner();
/** @title A contract for crowdfunding
 *  @author Me
 *  @notice Note to people
 *  @dev Note to devs
 */
contract FundMe {
    using PriceConverter for uint256;

    mapping(address => uint256) private s_addressToAmountFunded;
    address[] private s_funders;
    AggregatorV3Interface private s_priceFeed;

    // Could we make this constant?  /* hint: no! We should make it immutable! */
    address private immutable  i_owner;
    uint256 public constant MINIMUM_USD = 50 * 10 ** 18;
    
    constructor(address _priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(_priceFeedAddress);
    }

    /**
     *  @notice Function purpose
     *  @dev Dev note
     *  @ param params if there are any
     *  @ return fldjsl if there is a return type
     */
    function fund() public payable {
        require(msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD, "You need to spend more ETH!");
        // require(PriceConverter.getConversionRate(msg.value) >= MINIMUM_USD, "You need to spend more ETH!");
        s_addressToAmountFunded[msg.sender] += msg.value;
        s_funders.push(msg.sender);
    }
    
    function getVersion() public view returns (uint256){ 
        return s_priceFeed.version();
    }
    
    modifier onlyOwner {
        // require(msg.sender == owner);
        if (msg.sender != i_owner) revert FundMe__NotOwner();
        _;
    }
    
    function withdraw() payable onlyOwner public {
        for (uint256 funderIndex=0; funderIndex < s_funders.length; funderIndex++){
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        // // transfer
        // payable(msg.sender).transfer(address(this).balance);
        // // send
        // bool sendSuccess = payable(msg.sender).send(address(this).balance);
        // require(sendSuccess, "Send failed");
        // call
        (bool callSuccess, ) = payable(msg.sender).call{value: address(this).balance}("");
        require(callSuccess, "Call failed");
    }

    function cheaperWithdraw() public payable onlyOwner {
        address[] memory funders = s_funders;
        // mappings cant be in memory
        for (uint256 funderIndex = 0; funderIndex < funders.length; funderIndex++) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        (bool success, ) = i_owner.call{value: address(this).balance}("");
        require(success);
    }

    fallback() external payable {
        fund();
    }

    receive() external payable {
        fund();
    }

    function getOwner() public view returns(address) {
        return i_owner;
    }
    function getFunder(uint256 index) public view returns(address) {
        return s_funders[index];
    }
    function getAddressToAmountFunded(address funderAddress) public view returns(uint256) {
        return s_addressToAmountFunded[funderAddress];
    }
    function getPriceFeed() public view returns(AggregatorV3Interface) {
        return s_priceFeed;
    }
}
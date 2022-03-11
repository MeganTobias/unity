// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../tokens/AssetToken.sol";

/**
 * @title DAOGovernance
 * @dev Decentralized governance contract for platform decisions
 * @author DeFi Asset Management Team
 */
contract DAOGovernance is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    
    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        uint256 forVotes;
        uint256 againstVotes;
        bool executed;
        bool canceled;
        mapping(address => bool) hasVoted;
        mapping(address => uint256) votes;
    }
    
    struct VotingPower {
        uint256 balance;
        uint256 delegatedFrom;
        uint256 delegatedTo;
        address delegate;
        uint256 lastUpdate;
    }
    
    mapping(uint256 => Proposal) public proposals;
    mapping(address => VotingPower) public votingPowers;
    mapping(address => address) public delegates;
    
    uint256 public proposalCounter;
    uint256 public votingDelay = 1 days;
    uint256 public votingPeriod = 3 days;
    uint256 public proposalThreshold = 1000000 * 10**18; // 1M tokens
    uint256 public quorumThreshold = 10000000 * 10**18; // 10M tokens
    
    AssetToken public assetToken;
    
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        uint256 startTime,
        uint256 endTime
    );
    
    event VoteCast(
        address indexed voter,
        uint256 indexed proposalId,
        bool support,
        uint256 votes
    );
    
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCanceled(uint256 indexed proposalId);
    event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate);
    event VotingPowerUpdated(address indexed account, uint256 newPower);
    
    constructor(address _assetToken) {
        assetToken = AssetToken(_assetToken);
    }
    
    modifier onlyProposer(uint256 proposalId) {
        require(proposals[proposalId].proposer == msg.sender, "DAOGovernance: not the proposer");
        _;
    }
    
    function propose(
        string memory title,
        string memory description,
        bytes memory calldata
    ) external returns (uint256) {
        require(assetToken.balanceOf(msg.sender) >= proposalThreshold, "DAOGovernance: insufficient voting power");
        
        proposalCounter++;
        Proposal storage proposal = proposals[proposalCounter];
        proposal.id = proposalCounter;
        proposal.proposer = msg.sender;
        proposal.title = title;
        proposal.description = description;
        proposal.startTime = block.timestamp + votingDelay;
        proposal.endTime = block.timestamp + votingDelay + votingPeriod;
        proposal.executed = false;
        proposal.canceled = false;
        
        emit ProposalCreated(proposalCounter, msg.sender, title, proposal.startTime, proposal.endTime);
        return proposalCounter;
    }
    
    function vote(uint256 proposalId, bool support) external {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp >= proposal.startTime, "DAOGovernance: voting not started");
        require(block.timestamp <= proposal.endTime, "DAOGovernance: voting ended");
        require(!proposal.hasVoted[msg.sender], "DAOGovernance: already voted");
        
        uint256 votingPower = getVotingPower(msg.sender);
        require(votingPower > 0, "DAOGovernance: no voting power");
        
        proposal.hasVoted[msg.sender] = true;
        proposal.votes[msg.sender] = votingPower;
        
        if (support) {
            proposal.forVotes += votingPower;
        } else {
            proposal.againstVotes += votingPower;
        }
        
        emit VoteCast(msg.sender, proposalId, support, votingPower);
    }
    
    function execute(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp > proposal.endTime, "DAOGovernance: voting not ended");
        require(!proposal.executed, "DAOGovernance: proposal already executed");
        require(!proposal.canceled, "DAOGovernance: proposal canceled");
        require(proposal.forVotes > proposal.againstVotes, "DAOGovernance: proposal not passed");
        require(proposal.forVotes + proposal.againstVotes >= quorumThreshold, "DAOGovernance: quorum not met");
        
        proposal.executed = true;
        emit ProposalExecuted(proposalId);
    }
    
    function cancel(uint256 proposalId) external onlyProposer(proposalId) {
        Proposal storage proposal = proposals[proposalId];
        require(!proposal.executed, "DAOGovernance: proposal already executed");
        require(!proposal.canceled, "DAOGovernance: proposal already canceled");
        require(block.timestamp < proposal.endTime, "DAOGovernance: voting ended");
        
        proposal.canceled = true;
        emit ProposalCanceled(proposalId);
    }
    
    function delegate(address delegatee) external {
        require(delegatee != msg.sender, "DAOGovernance: self-delegation not allowed");
        
        address currentDelegate = delegates[msg.sender];
        delegates[msg.sender] = delegatee;
        
        _moveVotingPower(currentDelegate, delegatee, getVotingPower(msg.sender));
        
        emit DelegateChanged(msg.sender, currentDelegate, delegatee);
    }
    
    function _moveVotingPower(address from, address to, uint256 amount) internal {
        if (from != address(0)) {
            votingPowers[from].balance -= amount;
            emit VotingPowerUpdated(from, votingPowers[from].balance);
        }
        
        if (to != address(0)) {
            votingPowers[to].balance += amount;
            emit VotingPowerUpdated(to, votingPowers[to].balance);
        }
    }
    
    function getVotingPower(address account) public view returns (uint256) {
        return assetToken.balanceOf(account);
    }
    
    function getProposal(uint256 proposalId) external view returns (
        uint256 id,
        address proposer,
        string memory title,
        string memory description,
        uint256 startTime,
        uint256 endTime,
        uint256 forVotes,
        uint256 againstVotes,
        bool executed,
        bool canceled
    ) {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.id,
            proposal.proposer,
            proposal.title,
            proposal.description,
            proposal.startTime,
            proposal.endTime,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.executed,
            proposal.canceled
        );
    }
    
    function updateVotingDelay(uint256 newDelay) external onlyOwner {
        votingDelay = newDelay;
    }
    
    function updateVotingPeriod(uint256 newPeriod) external onlyOwner {
        votingPeriod = newPeriod;
    }
    
    function updateProposalThreshold(uint256 newThreshold) external onlyOwner {
        proposalThreshold = newThreshold;
    }
    
    function updateQuorumThreshold(uint256 newThreshold) external onlyOwner {
        quorumThreshold = newThreshold;
    }
}

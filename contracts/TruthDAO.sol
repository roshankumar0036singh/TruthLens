// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./openzeppelin/access/Ownable.sol";
import "./openzeppelin/utils/ReentrancyGuard.sol";
import "./TruthLensReputation.sol";

/**
 * @title TruthDAO
 * @dev Governance and Dispute Resolution for TruthLens AI verdicts.
 * Users can stake SHM (or a TRUTH token) to challenge AI-driven fact-checks.
 */
contract TruthDAO is Ownable {
    TruthLensReputation public reputationSBT;
    
    struct Dispute {
        string articleUrl;
        string originalVerdict;
        address challenger;
        uint256 stakeAmount;
        uint256 upvotes;
        uint256 downvotes;
        uint256 startTime;
        bool resolved;
        string finalVerdict;
    }

    struct FactCheckRequest {
        string articleUrl;
        address requester;
        uint256 rewardAmount;
        address fulfilledBy;
        string result;
        bool completed;
        uint256 minReputation;
    }

    mapping(uint256 => Dispute) public disputes;
    uint256 public disputeCount;
    mapping(uint256 => FactCheckRequest) public requests;
    uint256 public requestCount;

    uint256 public constant VOTING_PERIOD = 3 days;
    uint256 public constant MIN_STAKE = 10 ether; // 10 SHM

    event DisputeCreated(uint256 indexed id, string url, address challenger);
    event Voted(uint256 indexed disputeId, address indexed voter, bool support);
    event Resolved(uint256 indexed disputeId, string finalVerdict);
    event FactCheckRequested(uint256 indexed requestId, string url, uint256 reward);
    event FactCheckFulfilled(uint256 indexed requestId, address indexed guardian, string result);

    constructor(address _reputationSBT, address initialOwner) Ownable(initialOwner) {
        reputationSBT = TruthLensReputation(_reputationSBT);
    }

    /**
     * @dev DeFact: Request a manual fact-check for a specific URL.
     */
    function requestFactCheck(string memory _url, uint256 _minRep) public payable {
        require(msg.value > 0, "Reward must be greater than zero.");
        
        uint256 id = requestCount++;
        requests[id] = FactCheckRequest({
            articleUrl: _url,
            requester: msg.sender,
            rewardAmount: msg.value,
            fulfilledBy: address(0),
            result: "",
            completed: false,
            minReputation: _minRep
        });

        emit FactCheckRequested(id, _url, msg.value);
    }

    /**
     * @dev DeFact: Truth Guardians fulfill a fact-check request.
     */
    function fulfillFactCheck(uint256 _requestId, string memory _result) public {
        FactCheckRequest storage r = requests[_requestId];
        require(!r.completed, "Already completed.");
        require(reputationSBT.balanceOf(msg.sender) >= r.minReputation, "Insufficient reputation to fulfill this request.");

        r.completed = true;
        r.fulfilledBy = msg.sender;
        r.result = _result;

        // Payout reward to the guardian
        payable(msg.sender).transfer(r.rewardAmount);

        emit FactCheckFulfilled(_requestId, msg.sender, _result);
    }

    /**
     * @dev Create a dispute for an AI verdict. Requires staking SHM.
     */
    function createDispute(string memory _url, string memory _verdict) public payable {
        require(msg.value >= MIN_STAKE, "Insufficient stake to challenge analysis.");
        
        uint256 id = disputeCount++;
        disputes[id] = Dispute({
            articleUrl: _url,
            originalVerdict: _verdict,
            challenger: msg.sender,
            stakeAmount: msg.value,
            upvotes: 0,
            downvotes: 0,
            startTime: block.timestamp,
            resolved: false,
            finalVerdict: ""
        });

        emit DisputeCreated(id, _url, msg.sender);
    }

    /**
     * @dev Vote on a dispute. Weight is determined by user's Soulbound Reputation (SBT).
     */
    function vote(uint256 _disputeId, bool _support) public {
        Dispute storage d = disputes[_disputeId];
        require(!d.resolved, "Dispute already resolved.");
        require(block.timestamp < d.startTime + VOTING_PERIOD, "Voting period has ended.");
        
        uint256 weight = reputationSBT.balanceOf(msg.sender);
        require(weight > 0, "No reputation detected. Earn badges to vote in the DAO.");

        if (_support) {
            d.upvotes += weight;
        } else {
            d.downvotes += weight;
        }

        emit Voted(_disputeId, msg.sender, _support);
    }

    /**
     * @dev Resolve a dispute. If community agrees with challenger, rewards are distributed.
     * If community agrees with AI, the stake is sent to the DAO treasury.
     */
    function resolveDispute(uint256 _disputeId) public onlyOwner {
        Dispute storage d = disputes[_disputeId];
        require(!d.resolved, "Already resolved.");
        require(block.timestamp >= d.startTime + VOTING_PERIOD, "Voting still in progress.");

        d.resolved = true;
        if (d.upvotes > d.downvotes) {
            d.finalVerdict = "CHALLENGE_SUCCESS";
            // Return stake and reward from treasury in production
            payable(d.challenger).transfer(d.stakeAmount); 
        } else {
            d.finalVerdict = "AI_VERDICT_UPHELD";
            // Stake is kept in the contract (DAO treasury)
        }

        emit Resolved(_disputeId, d.finalVerdict);
    }

    // Emergency withdraw for owner
    function withdrawTreasury() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}

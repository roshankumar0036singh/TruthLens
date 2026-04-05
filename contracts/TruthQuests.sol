// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./openzeppelin/access/Ownable.sol";
import "./openzeppelin/utils/ReentrancyGuard.sol";

/**
 * @title TruthQuests
 * @dev Manages truth-checking bounties ("Quests"). 
 * Humans provide evidence for AI-uncertain claims to earn rewards.
 */
contract TruthQuests is Ownable, ReentrancyGuard {
    
    enum QuestStatus { OPEN, IN_REVIEW, RESOLVED, CANCELLED }

    struct Evidence {
        address submitter;
        string contentUrl; // IPFS/Arweave link to proof
        string description;
        uint256 timestamp;
        uint256 upvotes;
    }

    struct Quest {
        bytes32 claimId;      // Hash of the claim/text
        string context;      // Description of the claim
        uint256 bounty;      // Reward in native token (SHM)
        QuestStatus status;
        address resolver;    // The user who provided the winning evidence
        uint256 evidenceCount;
        mapping(uint256 => Evidence) evidenceList;
    }

    mapping(bytes32 => Quest) public quests;
    bytes32[] public activeQuests;

    event QuestCreated(bytes32 indexed claimId, uint256 bounty);
    event EvidenceSubmitted(bytes32 indexed claimId, uint256 evidenceId, address submitter);
    event QuestResolved(bytes32 indexed claimId, address winner, uint256 reward);

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Creates a new verification quest with a bounty.
     */
    function createQuest(bytes32 _claimId, string memory _context) public payable onlyOwner {
        require(quests[_claimId].claimId == bytes32(0), "Quest already exists for this claim.");
        
        Quest storage newQuest = quests[_claimId];
        newQuest.claimId = _claimId;
        newQuest.context = _context;
        newQuest.bounty = msg.value;
        newQuest.status = QuestStatus.OPEN;
        
        activeQuests.push(_claimId);
        emit QuestCreated(_claimId, msg.value);
    }

    /**
     * @dev Users submit evidence for an open quest.
     */
    function submitEvidence(bytes32 _claimId, string memory _contentUrl, string memory _description) public nonReentrant {
        require(quests[_claimId].status == QuestStatus.OPEN, "Quest is not open for submissions.");
        
        Quest storage q = quests[_claimId];
        uint256 evidenceId = q.evidenceCount;
        
        q.evidenceList[evidenceId] = Evidence({
            submitter: msg.sender,
            contentUrl: _contentUrl,
            description: _description,
            timestamp: block.timestamp,
            upvotes: 0
        });
        
        q.evidenceCount++;
        emit EvidenceSubmitted(_claimId, evidenceId, msg.sender);
    }

    /**
     * @dev Resolves a quest and pays out the bounty to the winner.
     */
    function resolveQuest(bytes32 _claimId, uint256 _winningEvidenceId) public onlyOwner nonReentrant {
        Quest storage q = quests[_claimId];
        require(q.status == QuestStatus.OPEN || q.status == QuestStatus.IN_REVIEW, "Quest is already resolved.");
        require(_winningEvidenceId < q.evidenceCount, "Invalid evidence ID.");

        Evidence storage winner = q.evidenceList[_winningEvidenceId];
        q.status = QuestStatus.RESOLVED;
        q.resolver = winner.submitter;

        // Payout bounty
        (bool success, ) = payable(winner.submitter).call{value: q.bounty}("");
        require(success, "Bounty payout failed.");

        emit QuestResolved(_claimId, winner.submitter, q.bounty);
    }

    function getEvidence(bytes32 _claimId, uint256 _evidenceId) public view returns (address, string memory, string memory, uint256, uint256) {
        Evidence storage e = quests[_claimId].evidenceList[_evidenceId];
        return (e.submitter, e.contentUrl, e.description, e.timestamp, e.upvotes);
    }
}

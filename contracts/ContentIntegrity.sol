// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./openzeppelin/access/Ownable.sol";
import "./openzeppelin/utils/ReentrancyGuard.sol";

/**
 * @title ContentIntegrity
 * @dev On-chain registry for cryptographic content hashes. 
 * Allows publishers to "sign" their articles at the point of publication.
 */
contract ContentIntegrity is Ownable {
    
    struct Anchor {
        string contentHash;
        address author;
        uint256 timestamp;
        bool exists;
    }

    // Mapping from a unique Article ID (e.g. slug hash) to its Anchor
    mapping(bytes32 => Anchor) public anchors;

    event ContentAnchored(bytes32 indexed articleId, string contentHash, address author);

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Anchors a content hash on Shardeum.
     * @param _articleId A unique identifier for the piece of content.
     * @param _contentHash The SHA-256 hash of the content (signed-ish).
     */
    function anchorContent(bytes32 _articleId, string memory _contentHash) public {
        require(!anchors[_articleId].exists, "Content already anchored for this ID.");
        
        anchors[_articleId] = Anchor({
            contentHash: _contentHash,
            author: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });

        emit ContentAnchored(_articleId, _contentHash, msg.sender);
    }

    /**
     * @dev Fetches the anchoring details for a given ID.
     */
    function verifyContent(bytes32 _articleId) public view returns (string memory, address, uint256) {
        require(anchors[_articleId].exists, "No anchor found for this content.");
        Anchor storage a = anchors[_articleId];
        return (a.contentHash, a.author, a.timestamp);
    }
}

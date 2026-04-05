// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./openzeppelin/token/ERC721/ERC721.sol";
import "./openzeppelin/token/ERC721/extensions/ERC721Enumerable.sol";
import "./openzeppelin/token/ERC721/extensions/ERC721URIStorage.sol";
import "./openzeppelin/access/Ownable.sol";

/**
 * @title TruthLensReputation (SBT)
 * @dev A soulbound token (non-transferable NFT) representing fact-checking reputation.
 */
contract TruthLensReputation is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    event ReputationMinted(address indexed to, uint256 tokenId, string rank);

    constructor(address initialOwner) 
        ERC721("TruthLens Reputation", "TLR") 
        Ownable(initialOwner)
    {}

    /**
     * @dev Non-transferable logic: revert every transfer except minting.
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert("TruthLens Reputation tokens are Soulbound and non-transferable.");
        }
        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Mint a reputation badge to a deserving fact-checker.
     */
    function mintReputationBadge(address to, string memory rank, string memory uri) 
        public 
        onlyOwner 
        returns (uint256)
    {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        emit ReputationMinted(to, tokenId, rank);
        return tokenId;
    }

    // Overrides required by Solidity

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

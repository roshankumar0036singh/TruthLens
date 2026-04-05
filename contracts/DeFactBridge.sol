// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./TruthDAO.sol";
import "./openzeppelin/access/Ownable.sol";

/**
 * @title DeFactBridge
 * @dev Facilitates interaction between the TruthLens backend (Oracle-like) 
 * and the decentralized DAO fact-checking process.
 */
contract DeFactBridge is Ownable {
    TruthDAO public dao;

    event BackendSynced(uint256 indexed requestId, string status);

    constructor(address _dao, address initialOwner) Ownable(initialOwner) {
        dao = TruthDAO(_dao);
    }

    /**
     * @dev Fetches state from DAO and validates it for the backend.
     * This allows the backend to know which decentralized checks are ready to be 
     * aggregated into the main TruthLens score.
     */
    function getRequestStatus(uint256 _requestId) public view returns (
        bool completed, 
        address guardian, 
        string memory result
    ) {
        (
            , // articleUrl
            , // requester
            , // rewardAmount
            address fulfilledBy,
            string memory res,
            bool isDone,
            // minReputation
        ) = dao.requests(_requestId);
        
        return (isDone, fulfilledBy, res);
    }
    
    // In a production environment, this contract would handle 
    // automated slashing or verification logic triggered by backend signals.
}

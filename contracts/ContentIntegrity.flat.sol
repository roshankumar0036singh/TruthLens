// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// OpenZeppelin Contracts (last updated v5.0.0) (access/Ownable.sol)

// OpenZeppelin Contracts (last updated v5.0.0) (utils/Context.sol)

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }
}

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * The initial owner is set to the address provided by the deployer. This can
 * later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    /**
     * @dev The caller account is not authorized to perform an operation.
     */
    error OwnableUnauthorizedAccount(address account);

    /**
     * @dev The owner is not a valid owner account. (eg. `address(0)`)
     */
    error OwnableInvalidOwner(address owner);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the address provided by the deployer as the initial owner.
     */
    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby disabling any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

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

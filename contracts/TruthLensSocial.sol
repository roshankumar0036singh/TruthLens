// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TruthLensSocial {
    struct SharedNews {
        uint256 id;
        address submitter;
        string contentUrl;
        string assertion; // "TRUE", "FAKE"
        uint256 upvotes;
        uint256 downvotes;
        uint256 timestamp;
    }

    uint256 public nextNewsId;
    mapping(uint256 => SharedNews) public allNews;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event NewsShared(uint256 indexed id, address indexed submitter, string contentUrl, string assertion);
    event VoteCast(uint256 indexed id, address indexed voter, bool isUpvote);

    function shareNews(string memory _contentUrl, string memory _assertion) public {
        uint256 newsId = nextNewsId++;
        allNews[newsId] = SharedNews({
            id: newsId,
            submitter: msg.sender,
            contentUrl: _contentUrl,
            assertion: _assertion,
            upvotes: 0,
            downvotes: 0,
            timestamp: block.timestamp
        });

        emit NewsShared(newsId, msg.sender, _contentUrl, _assertion);
    }

    function voteOnNews(uint256 _id, bool _isUpvote) public {
        require(_id < nextNewsId, "News item does not exist.");
        require(!hasVoted[_id][msg.sender], "Already voted on this item.");

        if (_isUpvote) {
            allNews[_id].upvotes++;
        } else {
            allNews[_id].downvotes++;
        }

        hasVoted[_id][msg.sender] = true;
        emit VoteCast(_id, msg.sender, _isUpvote);
    }

    function getNews(uint256 _id) public view returns (SharedNews memory) {
        return allNews[_id];
    }
}

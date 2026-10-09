// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

/// @notice Provenance and designated-reviewer receipts; does not prove AI correctness.
contract AgentProofRegistry {
    enum Status { None, Pending, Accepted, Rejected, Revoked }
    struct Agent { address owner; bytes32 metadataHash; }
    struct Receipt {
        bytes32 agentId;
        bytes32 taskId;
        bytes32 inputHash;
        bytes32 outputHash;
        bytes32 policyHash;
        address reviewer;
        uint64 publishedAt;
        uint64 expiresAt;
        Status status;
        bytes32 reviewEvidenceHash;
    }
    mapping(bytes32 => Agent) public agents;
    mapping(bytes32 => Receipt) private receipts;
    mapping(address => uint256) public nonces;

    error InvalidCommitment();
    error InvalidReviewer();
    error InvalidExpiry();
    error NotAgentOwner();
    error NotReviewer();
    error DuplicateReceipt();
    error NotPending();
    error ReceiptExpired();
    error AlreadyRevoked();

    event AgentRegistered(bytes32 indexed agentId, address indexed owner, bytes32 metadataHash);
    event ReceiptPublished(bytes32 indexed receiptId, bytes32 indexed agentId, bytes32 indexed taskId, address reviewer, bytes32 outputHash);
    event ReceiptReviewed(bytes32 indexed receiptId, address indexed reviewer, bool accepted, bytes32 evidenceHash);
    event ReceiptRevoked(bytes32 indexed receiptId, address indexed owner);

    function registerAgent(bytes32 metadataHash) external returns (bytes32 agentId) {
        if (metadataHash == bytes32(0)) revert InvalidCommitment();
        agentId = keccak256(abi.encode(block.chainid, address(this), msg.sender, nonces[msg.sender]++));
        agents[agentId] = Agent(msg.sender, metadataHash);
        emit AgentRegistered(agentId, msg.sender, metadataHash);
    }

    function publishReceipt(bytes32 agentId, bytes32 taskId, bytes32 inputHash, bytes32 outputHash,
        bytes32 policyHash, address reviewer, uint64 expiresAt) external returns (bytes32 receiptId) {
        if (agents[agentId].owner != msg.sender) revert NotAgentOwner();
        if (taskId == bytes32(0) || inputHash == bytes32(0) || outputHash == bytes32(0) || policyHash == bytes32(0)) revert InvalidCommitment();
        if (reviewer == address(0) || reviewer == msg.sender) revert InvalidReviewer();
        if (expiresAt <= block.timestamp) revert InvalidExpiry();
        receiptId = keccak256(abi.encode(block.chainid, address(this), agentId, taskId));
        if (receipts[receiptId].status != Status.None) revert DuplicateReceipt();
        receipts[receiptId] = Receipt(agentId, taskId, inputHash, outputHash, policyHash,
            reviewer, uint64(block.timestamp), expiresAt, Status.Pending, bytes32(0));
        emit ReceiptPublished(receiptId, agentId, taskId, reviewer, outputHash);
    }

    function reviewReceipt(bytes32 receiptId, bool accepted, bytes32 evidenceHash) external {
        Receipt storage r = receipts[receiptId];
        if (r.reviewer != msg.sender) revert NotReviewer();
        if (r.status != Status.Pending) revert NotPending();
        if (block.timestamp > r.expiresAt) revert ReceiptExpired();
        if (evidenceHash == bytes32(0)) revert InvalidCommitment();
        r.status = accepted ? Status.Accepted : Status.Rejected;
        r.reviewEvidenceHash = evidenceHash;
        emit ReceiptReviewed(receiptId, msg.sender, accepted, evidenceHash);
    }

    function revokeReceipt(bytes32 receiptId) external {
        Receipt storage r = receipts[receiptId];
        if (agents[r.agentId].owner != msg.sender) revert NotAgentOwner();
        if (r.status == Status.Revoked) revert AlreadyRevoked();
        r.status = Status.Revoked;
        emit ReceiptRevoked(receiptId, msg.sender);
    }

    function getReceipt(bytes32 receiptId) external view returns (Receipt memory) {
        return receipts[receiptId];
    }
}

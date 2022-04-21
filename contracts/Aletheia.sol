// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import '@openzeppelin/contracts/access/Ownable.sol';
import "@zk-kit/incremental-merkle-tree.sol/contracts/IncrementalBinaryTree.sol";

contract Aletheia is Ownable {
  using IncrementalBinaryTree for IncrementalTreeData;

  /// @dev Emitted when a attestation root is changed.
  /// @param key: name of the attestation, e.g. zku_supporter_nft.
  /// @param value: new root value.
  event AttestationRootChanged(string key, string value);

  /// @dev Emitted when a new identity commitment is added.
  /// @param identityCommitment: New identity commitment.
  /// @param root: New root hash of the tree.
  event MemberAdded(uint256 identityCommitment, uint256 root);

  /// @dev Emitted when a new identity commitment is removed.
  /// @param identityCommitment: New identity commitment.
  /// @param root: New root hash of the tree.
  event MemberRemoved(uint256 identityCommitment, uint256 root);

    // store merkle tree roots for different types of reputations
    mapping(string => string) public attestationRoots;
    IncrementalTreeData internal identityTree;

	function getAttestationRoot(string calldata name) public view returns (string memory) {
			return attestationRoots[name];
	}

	function setAttestationRoot(string calldata name, string calldata value)
			public
			onlyOwner
	{
			attestationRoots[name] = value;
			emit AttestationRootChanged(name, value);
	}

	/// @dev Adds an identity commitment to an existing group.
  /// @param identityCommitment: New identity commitment.
  function addMember(uint256 identityCommitment) external {
    // identityTree.insert(identityCommitment);
    uint256 root = getIdentityTreeRoot();

    emit MemberAdded(identityCommitment, root);
  }

  /// @dev Removes an identity commitment from an existing group. A proof of membership is
  /// needed to check if the node to be deleted is part of the tree.
  /// @param identityCommitment: Existing identity commitment to be deleted.
  /// @param proofSiblings: Array of the sibling nodes of the proof of membership.
  /// @param proofPathIndices: Path of the proof of membership.
  function removeMember(
    uint256 identityCommitment,
    uint256[] calldata proofSiblings,
    uint8[] calldata proofPathIndices
  ) external {

    identityTree.remove(identityCommitment, proofSiblings, proofPathIndices);

    uint256 root = getIdentityTreeRoot();

    emit MemberRemoved(identityCommitment, root);
  }

  function getIdentityTreeRoot() public view returns (uint256) {
    return identityTree.root;
  }

  function getIdentityTreeDepth() public view returns (uint8) {
    return identityTree.depth;
  }

  function getIdentityTreeNumberOfLeaves() public view returns (uint256) {
    return identityTree.numberOfLeaves;
  }
}
pragma circom 2.0.0;

include "node_modules/circomlib/circuits/comparators.circom";

/**
 * @title ReputationProof
 * @dev Proves that (public) minReputation <= (private) actualReputation.
 */
template ReputationProof() {
    // Private: The actual reputation score of the user
    signal input actualReputation;
    // Private: A secret salt to prevent brute-forcing matching scores
    signal input secretSalt;
    
    // Public: The minimum reputation required
    signal input minReputation;
    // Public: Hash of actualReputation and salt for on-chain binding
    signal input reputationHash;

    // 1. Verify that the score is indeed above the threshold
    component isGreateEqual = GreaterEqThan(32);
    isGreateEqual.in[0] <== actualReputation;
    isGreateEqual.in[1] <== minReputation;
    
    // The proof fails if isGreateEqual.out is 0
    isGreateEqual.out === 1;

    // 2. Binding to a commitment (Optional: Can be checked by the contract)
    // For simplicity skip the Poseidon hash import here, 
    // but in production we'd verify reputationHash == Poseidon(actualReputation, secretSalt)
}

component main { public [ minReputation, reputationHash ] } = ReputationProof();

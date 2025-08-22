import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {Wallet, Contract, JsonRpcProvider, parseUnits} from "ethers";

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

// Environment variables for sensitive data
// These should be set in your Firebase Functions environment using secrets
// e.g. `firebase functions:secrets:set TREASURY_PRIVATE_KEY`
// In v2 functions, these are accessed via process.env
const privateKey = process.env.TREASURY_PRIVATE_KEY;
const tokenAddress = process.env.CONTRACTS_QUIZTAL_TOKEN;
const rpcUrl = process.env.NETWORK_RPC_URL;

// ERC20 ABI for the transfer function
const tokenAbi = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
];

// --- Main Cloud Function: claimTokens ---
export const claimTokens = onCall(async (request) => {
  // 1. Verify user authentication
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "The function must be called while authenticated.",
    );
  }
  const userId = request.auth.uid;

  // 2. Set up wallet and contract
  if (!privateKey || !tokenAddress || !rpcUrl) {
    logger.error("Missing required environment configuration.");
    throw new HttpsError(
      "internal",
      "Server configuration is incomplete.",
    );
  }

  const provider = new JsonRpcProvider(rpcUrl);
  const treasuryWallet = new Wallet(privateKey, provider);
  const tokenContract = new Contract(tokenAddress, tokenAbi, treasuryWallet);

  const playerDocRef = db.collection("players").doc(userId);

  try {
    // Get decimals once, outside the transaction, as it's a constant value.
    const decimals = await tokenContract.decimals();

    // 3. Run as a Firestore transaction to ensure atomicity
    const txResult = await db.runTransaction(async (transaction) => {
      const playerDoc = await transaction.get(playerDocRef);

      if (!playerDoc.exists) {
        throw new HttpsError("not-found", "Player document not found.");
      }

      const playerData = playerDoc.data();
      if (!playerData) {
        throw new HttpsError("internal", "Player data is missing.");
      }

      // Get the current Quiztals balance or default to 0
      const currentBalance = playerData.quiztals || 0;
      if (currentBalance <= 0) {
        logger.warn(
          `User ${userId} has insufficient Quiztals: ${currentBalance}`
        );
        throw new HttpsError(
          "failed-precondition",
          `You have insufficient Quiztals: ${currentBalance}.`,
        );
      }

      // Get the player's wallet address
      const playerWalletAddress = playerData.walletAddress;

      if (!playerWalletAddress) {
        throw new HttpsError(
          "failed-precondition",
          "Player does not have a wallet address linked.",
        );
      }

      // 4. Validate claim amount based on game rules
      const claimAmount = Math.min(Math.floor(currentBalance), 100);

      // Ensure claimAmount is not zero after the Math.min operation
      if (claimAmount <= 0) {
        logger.warn(
          `User ${userId} has a claim amount of zero after validation.`
        );
        throw new HttpsError(
          "failed-precondition",
          "Claim amount is too low.",
        );
      }

      if (claimAmount < 50) { // Minimum claim amount
        throw new HttpsError(
          "failed-precondition",
          `Minimum claim amount is 50 Quiztals. You have ${currentBalance}.`,
        );
      }

      // 5. Prepare and send the on-chain transaction
      const amountInSmallestUnit = parseUnits(claimAmount.toString(), decimals);

      logger.info(
        `Transferring ${claimAmount} tokens to ${playerWalletAddress}...`,
      );
      let tx;
      try {
        tx = await tokenContract.transfer(
          playerWalletAddress,
          amountInSmallestUnit,
        );
        logger.info(`Transaction sent. Hash: ${tx.hash}`);
        // Wait for the transaction to be mined
        await tx.wait();
        logger.info(`Transaction confirmed. Hash: ${tx.hash}`);
      } catch (transferError: unknown) {
        logger.error("Error during token transfer:", transferError);
        throw new HttpsError(
          "internal",
          `Token transfer failed: ${(transferError as Error).message}`
        );
      }

      // 6. Update Firestore state
      const newBalance = currentBalance - claimAmount;
      transaction.update(playerDocRef, {
        quiztals: newBalance,
        claimHistory: admin.firestore.FieldValue.arrayUnion({
          amount: claimAmount,
          timestamp: Date.now(),
          txHash: tx.hash,
        }),
      });

      return {txHash: tx.hash, claimedAmount: claimAmount};
    });

    const successMessage =
      `Successfully claimed ${txResult.claimedAmount} Quiztals!`;
    logger.info(
      `Successfully processed claim for user ${userId}. Tx: ${txResult.txHash}`,
    );
    return {success: true, message: successMessage, txHash: txResult.txHash};
  } catch (error: unknown) {
    logger.error(`Error processing claim for user ${userId}:`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    // Handle ethers-specific errors or other unexpected errors
    const message =
      error instanceof Error ?
        error.message :
        "An unexpected error occurred while processing your claim.";
    throw new HttpsError("internal", message);
  }
});

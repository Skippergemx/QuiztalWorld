import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {Wallet, Contract, JsonRpcProvider, parseUnits} from "ethers";

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

// ERC20 ABI for the transfer function
const tokenAbi = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
];

// --- New Cloud Function: claimNDOODTokens ---
// A simplified version of the token claiming function
export const claimNDOODTokens = onCall({
  secrets: ["TREASURY_PRIVATE_KEY", "CONTRACTS_NDOOD_TOKEN", "NETWORK_RPC_URL"]
}, async (request) => {
  // 1. Verify user authentication
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "The function must be called while authenticated.",
    );
  }
  const userId = request.auth.uid;

  // 2. Get environment variables
  const privateKey = process.env.TREASURY_PRIVATE_KEY;
  const tokenAddress = process.env.CONTRACTS_NDOOD_TOKEN;
  const rpcUrl = process.env.NETWORK_RPC_URL;

  // 3. Check if all required environment variables are set
  logger.info("Checking environment variables...");
  logger.info(`TREASURY_PRIVATE_KEY: ${privateKey ? 'SET' : 'MISSING'}`);
  logger.info(`CONTRACTS_NDOOD_TOKEN: ${tokenAddress ? 'SET' : 'MISSING'}`);
  logger.info(`NETWORK_RPC_URL: ${rpcUrl ? 'SET' : 'MISSING'}`);
  
  if (!privateKey || !tokenAddress || !rpcUrl) {
    logger.error("Missing required environment configuration:");
    logger.error(`TREASURY_PRIVATE_KEY: ${privateKey ? 'SET' : 'MISSING'}`);
    logger.error(`CONTRACTS_NDOOD_TOKEN: ${tokenAddress ? 'SET' : 'MISSING'}`);
    logger.error(`NETWORK_RPC_URL: ${rpcUrl ? 'SET' : 'MISSING'}`);
    throw new HttpsError(
      "internal",
      "Server configuration is incomplete.",
    );
  }
  logger.info("All environment variables are set correctly.");

  try {
    // 4. Set up wallet and contract
    const provider = new JsonRpcProvider(rpcUrl);
    const treasuryWallet = new Wallet(privateKey, provider);
    const tokenContract = new Contract(tokenAddress, tokenAbi, treasuryWallet);

    // 5. Get player document
    const playerDocRef = db.collection("players").doc(userId);
    const playerDoc = await playerDocRef.get();

    if (!playerDoc.exists) {
      throw new HttpsError("not-found", "Player document not found.");
    }

    const playerData = playerDoc.data();
    if (!playerData) {
      throw new HttpsError("internal", "Player data is missing.");
    }

    // 6. Check player's NDOOD balance
    const currentBalance = playerData.ndood || playerData.quiztals || 0;
    if (currentBalance <= 0) {
      logger.warn(`User ${userId} has insufficient NDOOD: ${currentBalance}`);
      throw new HttpsError(
        "failed-precondition",
        `You have insufficient NDOOD: ${currentBalance}.`,
      );
    }

    // 7. Get player's wallet address
    const playerWalletAddress = playerData.walletAddress;
    if (!playerWalletAddress) {
      throw new HttpsError(
        "failed-precondition",
        "Player does not have a wallet address linked.",
      );
    }

    // 8. Calculate claim amount (between 50-100 NDOOD)
    const claimAmount = Math.min(Math.max(Math.floor(currentBalance), 50), 100);

    // 9. Get token decimals
    const decimals = await tokenContract.decimals();
    const amountInSmallestUnit = parseUnits(claimAmount.toString(), decimals);

    // 10. Transfer tokens
    logger.info(`Transferring ${claimAmount} NDOOD tokens to ${playerWalletAddress}...`);
    const tx = await tokenContract.transfer(
      playerWalletAddress,
      amountInSmallestUnit,
    );
    
    logger.info(`Transaction sent. Hash: ${tx.hash}`);
    
    // Wait for transaction to be mined
    await tx.wait();
    logger.info(`Transaction confirmed. Hash: ${tx.hash}`);

    // 11. Update player's balance in Firestore
    const newBalance = currentBalance - claimAmount;
    await playerDocRef.update({
      ndood: newBalance,
      quiztals: newBalance, // Keep for backward compatibility
      claimHistory: admin.firestore.FieldValue.arrayUnion({
        amount: claimAmount,
        timestamp: Date.now(),
        txHash: tx.hash,
      }),
    });

    // 12. Return success response
    const successMessage = `Successfully claimed ${claimAmount} NDOOD!`;
    logger.info(`Successfully processed claim for user ${userId}. Tx: ${tx.hash}`);
    
    return {
      success: true, 
      message: successMessage, 
      txHash: tx.hash,
      claimedAmount: claimAmount
    };

  } catch (error: unknown) {
    logger.error(`Error processing claim for user ${userId}:`, error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    // Handle other errors
    const message = error instanceof Error ? error.message : "An unexpected error occurred while processing your claim.";
    throw new HttpsError("internal", message);
  }
});
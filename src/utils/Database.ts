import { getFirestore, doc, setDoc, getDoc, collection, addDoc } from "firebase/firestore";
import { app } from './firebase'; // Firebase initialization

const db = getFirestore(app);

/**
 * Save $Quiztals to Firestore under the player document.
 * Also creates a reward history entry for tracking with NPC source.
 * @param playerId The player's unique ID
 * @param reward The amount of $Quiztals earned
 * @param source The NPC name or identifier who gave the reward
 */
export async function saveQuiztalsToDatabase(playerId: string, reward: number, source: string = "Unknown") {
  try {
    const playerRef = doc(db, "players", playerId);
    const playerDoc = await getDoc(playerRef);

    if (playerDoc.exists()) {
      const playerData = playerDoc.data();
      const newQuiztals = (playerData?.quiztals || 0) + reward;

      await setDoc(playerRef, {
        quiztals: newQuiztals,
        lastUpdated: Date.now(),
        rewardsEarned: reward
      }, { merge: true });

      console.log(`✅ Updated player "${playerId}" with +${reward} $Quiztals from ${source}. Total: ${newQuiztals}`);
    } else {
      await setDoc(playerRef, {
        quiztals: reward,
        lastUpdated: Date.now(),
        rewardsEarned: reward
      });

      console.log(`🆕 Created player "${playerId}" with ${reward} $Quiztals from ${source}.`);
    }

    const rewardHistoryRef = collection(db, "players", playerId, "rewardHistory");
    await addDoc(rewardHistoryRef, {
      amount: reward,
      timestamp: Date.now(),
      source: source
    });

    console.log(`🗃️ Logged reward history for "${playerId}" from ${source}`);

  } catch (error) {
    console.error("❌ Error saving quiztals to database:", error);
  }
}

/**
 * Save wallet address to player's document in Firestore
 * @param playerId The player's unique ID
 * @param walletAddress The connected wallet address
 */
export async function saveWalletAddress(playerId: string, walletAddress: string) {
  try {
    const playerRef = doc(db, "players", playerId);
    await setDoc(playerRef, {
      walletAddress: walletAddress,
      lastWalletUpdate: Date.now()
    }, { merge: true });

    console.log(`✅ Updated player "${playerId}" with wallet address: ${walletAddress}`);
  } catch (error) {
    console.error("❌ Error saving wallet address:", error);
    throw error;
  }
}

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
    // Validate inputs
    if (typeof reward !== 'number' || isNaN(reward)) {
      console.error("❌ Invalid reward amount:", reward);
      return;
    }

    // Validate reward amount (should be between 0.01 and 10)
    if (reward < 0.01 || reward > 10) {
      console.error("❌ Reward amount out of allowed range (0.01-10):", reward);
      return;
    }

    // Validate source
    const validSources = ["HuntBoy", "BaseSage", "MintGirl", "Moblin", "Unknown"];
    if (!validSources.includes(source)) {
      console.error("❌ Invalid source for quiztal reward:", source);
      return;
    }

    const playerRef = doc(db, "players", playerId);
    const playerDoc = await getDoc(playerRef);

    if (playerDoc.exists()) {
      const playerData = playerDoc.data();
      const currentQuiztals = playerData?.quiztals || 0;
      const currentRewardsEarned = playerData?.rewardsEarned || 0;
      const newQuiztals = currentQuiztals + reward;
      const newRewardsEarned = currentRewardsEarned + reward;

      await setDoc(playerRef, {
        quiztals: newQuiztals,
        lastUpdated: Date.now(),
        rewardsEarned: newRewardsEarned
      }, { merge: true });

      console.log(`✅ Updated player "${playerId}" with +${reward} $Quiztals from ${source}. Total: ${newQuiztals}`);
    } else {
      // New player gets initial 100 quiztals plus reward
      const initialQuiztals = 100 + reward;
      await setDoc(playerRef, {
        quiztals: initialQuiztals,
        lastUpdated: Date.now(),
        rewardsEarned: reward
      });

      console.log(`🆕 Created player "${playerId}" with ${initialQuiztals} $Quiztals from ${source} (${reward} reward + 100 initial).`);
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

/**
 * Save moblin gift box data to Firestore
 * @param playerId The player's unique ID
 * @param giftBoxData The gift box data to save
 */
export async function saveMoblinGiftBoxData(playerId: string, giftBoxData: { count: number; lastGiftTime: number }) {
  try {
    const playerRef = doc(db, "players", playerId);
    await setDoc(playerRef, {
      moblinGiftBoxes: giftBoxData
    }, { merge: true });

    console.log(`✅ Updated moblin gift box data for player "${playerId}"`);
  } catch (error) {
    console.error("❌ Error saving moblin gift box data:", error);
    throw error;
  }
}

/**
 * Load moblin gift box data from Firestore
 * @param playerId The player's unique ID
 * @returns The gift box data or null if not found
 */
export async function loadMoblinGiftBoxData(playerId: string) {
  try {
    const playerRef = doc(db, "players", playerId);
    const playerDoc = await getDoc(playerRef);

    if (playerDoc.exists()) {
      const playerData = playerDoc.data();
      return playerData.moblinGiftBoxes || null;
    }
    return null;
  } catch (error) {
    console.error("❌ Error loading moblin gift box data:", error);
    return null;
  }
}

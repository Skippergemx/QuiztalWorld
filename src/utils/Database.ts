import { doc, setDoc, getDoc, collection, addDoc, writeBatch, query, getDocs } from "firebase/firestore";
import { db } from './firebase'; // Firebase initialization
import { NFTData } from '../types/nft';


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
    } else {
      // New player gets initial 100 quiztals plus reward
      const initialQuiztals = 100 + reward;
      await setDoc(playerRef, {
        quiztals: initialQuiztals,
        lastUpdated: Date.now(),
        rewardsEarned: reward
      });

    }

    const rewardHistoryRef = collection(db, "players", playerId, "rewardHistory");
    await addDoc(rewardHistoryRef, {
      amount: reward,
      timestamp: Date.now(),
      source: source
    });


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

/**
 * Overwrites the NFTs for a player in a subcollection.
 * This ensures the stored NFTs are always in sync with the latest wallet scan.
 * @param playerId The player's unique ID
 * @param nfts The array of NFTData objects to save
 */
export async function saveNFTsToDatabase(playerId: string, nfts: NFTData[]) {
  try {
    const playerNftsRef = collection(db, "players", playerId, "nfts");

    // 1. Get a new write batch
    const batch = writeBatch(db);

    // 2. Delete all existing documents in the "nfts" subcollection
    const existingNftsSnapshot = await getDocs(query(playerNftsRef));
    existingNftsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // 3. Add new documents for each NFT
    nfts.forEach((nft) => {
      // Use a combination of collectionType and tokenId for a unique doc ID
      const nftDocRef = doc(playerNftsRef, `${nft.collectionType}-${nft.tokenId}`);
      batch.set(nftDocRef, nft);
    });

    // 4. Commit the batch
    await batch.commit();
    console.log(`✅ Successfully saved ${nfts.length} NFTs to database for player ${playerId}`);

  } catch (error) {
    console.error(`❌ Error saving NFTs to database for player ${playerId}:`, error);
    throw error; // Re-throw the error so the caller can handle it
  }
}

/**
 * Loads all NFT ownership data for a player from their subcollection.
 * This is useful for checking ownership without needing full metadata.
 * @param playerId The player's unique ID
 * @returns An array of NFT ownership data objects or null if an error occurs
 */
export async function loadNFTsFromDatabase(playerId: string): Promise<NFTData[] | null> {
  try {
    const playerNftsRef = collection(db, "players", playerId, "nfts");
    const nftsSnapshot = await getDocs(query(playerNftsRef));
    return nftsSnapshot.docs.map(doc => doc.data() as NFTData);
  } catch (error) {
    console.error(`❌ Error loading NFTs from database for player ${playerId}:`, error);
    return null;
  }
}

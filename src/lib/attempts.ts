import { collection, doc, setDoc, getDocs, updateDoc, increment, getDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { UserAttempt } from "../types";

export async function saveUserAttempt(userId: string, attempt: Omit<UserAttempt, "takenAt">): Promise<void> {
  const attemptId = attempt.attemptId;
  const path = `users/${userId}/attempts/${attemptId}`;
  const nowStr = new Date().toISOString();
  
  const fullAttempt: UserAttempt = {
    ...attempt,
    takenAt: nowStr
  };

  if (userId && userId.startsWith("virtual_sandbox_")) {
    try {
      // 1. Save to local storage list
      const existingStr = localStorage.getItem("eliteprep_sandbox_attempts");
      const list: UserAttempt[] = existingStr ? JSON.parse(existingStr) : [];
      // Replace existing with same ID if exists (re-take safety)
      const filtered = list.filter(item => item.attemptId !== attemptId);
      filtered.push(fullAttempt);
      localStorage.setItem("eliteprep_sandbox_attempts", JSON.stringify(filtered));

      // 2. Query other attempts to calculate new profile statistics
      const totalTests = filtered.length;
      const totalAccuracy = filtered.reduce((acc, curr) => acc + curr.accuracyPercent, 0);
      const avgAccuracy = totalTests > 0 ? totalAccuracy / totalTests : 0;
      const newRank = Math.max(45, Math.round(50000 - (avgAccuracy * 495)));

      // 3. Update local session state info
      const storedSession = localStorage.getItem("eliteprep_sandbox_session");
      if (storedSession) {
        const parsed = JSON.parse(storedSession);
        parsed.totalTests = totalTests;
        parsed.averageAccuracy = parseFloat(avgAccuracy.toFixed(1));
        parsed.predictedRank = newRank;
        localStorage.setItem("eliteprep_sandbox_session", JSON.stringify(parsed));
      }
      return;
    } catch (err) {
      console.error("Local sandbox save attempt failure:", err);
      return;
    }
  }

  try {
    // 1. Save detailed attempt to the subcollection
    await setDoc(doc(db, "users", userId, "attempts", attemptId), fullAttempt);

    // 2. Query other attempts to calculate new profile statistics
    const attemptsPath = `users/${userId}/attempts`;
    const snap = await getDocs(collection(db, "users", userId, "attempts"));
    const allAttempts = snap.docs.map(d => d.data() as UserAttempt);

    const totalTests = allAttempts.length;
    const totalAccuracy = allAttempts.reduce((acc, curr) => acc + curr.accuracyPercent, 0);
    const avgAccuracy = totalTests > 0 ? totalAccuracy / totalTests : 0;

    // Estimate smart predicted rank logic based on accuracy
    // Standard scale: 100% accuracy = Rank 50. 0% accuracy = Rank 50000
    // formula: 50000 - (accuracy * 499)
    const newRank = Math.max(45, Math.round(50000 - (avgAccuracy * 495)));

    // 3. Update the matching profile stats document
    let isUserAdmin = false;
    try {
      const snap = await getDoc(doc(db, "admins", userId));
      isUserAdmin = snap.exists();
    } catch (e) {
      isUserAdmin = false;
    }
    const colName = isUserAdmin ? "admins" : "users";
    const profilePath = `${colName}/${userId}`;
    await updateDoc(doc(db, colName, userId), {
      totalTests,
      averageAccuracy: parseFloat(avgAccuracy.toFixed(1)),
      predictedRank: newRank,
      updatedAt: nowStr
    });

  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getUserAttempts(userId: string): Promise<UserAttempt[]> {
  const path = `users/${userId}/attempts`;
  if (userId && userId.startsWith("virtual_sandbox_")) {
    try {
      const existingStr = localStorage.getItem("eliteprep_sandbox_attempts");
      const list: UserAttempt[] = existingStr ? JSON.parse(existingStr) : [];
      return list.sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime());
    } catch (err) {
      console.error("Local sandbox fetch attempts failure:", err);
      return [];
    }
  }

  try {
    const snap = await getDocs(collection(db, "users", userId, "attempts"));
    return snap.docs.map(doc => doc.data() as UserAttempt).sort((a, b) => {
      return new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime();
    });
  } catch (error) {
    return handleFirestoreError(error, OperationType.GET, path);
  }
}

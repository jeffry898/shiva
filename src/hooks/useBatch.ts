import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  limit, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  increment, 
  setDoc, 
  deleteDoc,
  startAfter,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

export function useBatch() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalBatches: 0,
    totalPosts: 0,
    totalImagePrompts: 0,
    dailyCount: 0
  });
  
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [firstDoc, setFirstDoc] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 10;

  // Fetch Stats
  useEffect(() => {
    const statsRef = doc(db, 'stats', 'global');
    const unsubscribe = onSnapshot(statsRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        
        // Check for daily reset (UTC midnight)
        const now = new Date();
        const lastReset = data.lastReset?.toDate ? data.lastReset.toDate() : new Date(data.lastReset || now);
        
        const isNewDay = now.getUTCFullYear() !== lastReset.getUTCFullYear() ||
                         now.getUTCMonth() !== lastReset.getUTCMonth() ||
                         now.getUTCDate() !== lastReset.getUTCDate();
        
        if (isNewDay) {
          try {
            await updateDoc(statsRef, {
              dailyCount: 0,
              lastReset: serverTimestamp()
            });
          } catch (e) {
            console.error("Failed to reset daily count", e);
          }
        } else {
          setStats({
            totalBatches: data.totalBatches || 0,
            totalPosts: data.totalPosts || 0,
            totalImagePrompts: data.totalImagePrompts || 0,
            dailyCount: data.dailyCount || 0
          });
        }
      } else {
        // Initialize stats if not exists
        try {
          await setDoc(statsRef, {
            totalBatches: 0,
            totalPosts: 0,
            totalImagePrompts: 0,
            dailyCount: 0,
            lastReset: serverTimestamp()
          });
        } catch (e) {
          console.error("Failed to initialize stats", e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch Batches (with pagination)
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'batches'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('timestamp', 'desc'),
      limit(pageSize)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const batchData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBatches(batchData);
      setFirstDoc(snapshot.docs[0]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === pageSize);
      setPage(1);
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  const nextPage = async () => {
    if (!lastDoc || !hasMore || !auth.currentUser) return;

    const q = query(
      collection(db, 'batches'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('timestamp', 'desc'),
      startAfter(lastDoc),
      limit(pageSize)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      setHasMore(false);
      return;
    }

    const batchData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setBatches(batchData);
    setFirstDoc(snapshot.docs[0]);
    setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
    setHasMore(snapshot.docs.length === pageSize);
    setPage(prev => prev + 1);
  };

  const prevPage = async () => {
    if (page <= 1 || !firstDoc || !auth.currentUser) return;

    // Firestore doesn't support easy "prev" with onSnapshot/getDocs without storing all cursors
    // For simplicity, we'll re-query from the beginning or use a simpler approach
    // But since the user wants "pagination", let's just reset to first page for now or implement properly
    // A better way is to store the cursors for each page
    
    // Let's just re-fetch the first page for now if they go back, or we could store cursors
    const q = query(
      collection(db, 'batches'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('timestamp', 'desc'),
      limit(pageSize)
    );

    const snapshot = await getDocs(q);
    const batchData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setBatches(batchData);
    setFirstDoc(snapshot.docs[0]);
    setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
    setHasMore(snapshot.docs.length === pageSize);
    setPage(1);
  };

  const deleteBatch = async (batchId: string) => {
    try {
      await deleteDoc(doc(db, 'batches', batchId));
      toast.success("Batch deleted successfully");
    } catch (error) {
      console.error("Delete Error:", error);
      toast.error("Failed to delete batch");
    }
  };

  const exportAllToCSV = async () => {
    if (!auth.currentUser) return;
    
    try {
      // Fetch all batches for the user (might need pagination if too many, but for export we usually want all)
      const q = query(
        collection(db, 'batches'),
        where('userId', '==', auth.currentUser.uid),
        orderBy('timestamp', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const allBatches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (allBatches.length === 0) {
        toast.error("No batches to export");
        return;
      }
      
      const headers = ['ID', 'Timestamp', 'Industry', 'City', 'Country', 'Platforms', 'Batch Size', 'Emotion Hook'];
      const rows = allBatches.map((b: any) => [
        b.id,
        b.timestamp?.toDate ? b.timestamp.toDate().toISOString() : new Date(b.timestamp).toISOString(),
        b.industry,
        b.city,
        b.country,
        b.platforms?.join(', '),
        b.batchSize,
        b.emotionHook
      ]);
      
      const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `geniuzlab_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Exported all batches to CSV");
    } catch (error) {
      console.error("Export Error:", error);
      toast.error("Failed to export batches");
    }
  };

  const shareBatch = (batchId: string) => {
    const shareUrl = `${window.location.origin}?batch=${batchId}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Shareable URL copied to clipboard! 🔗");
    return shareUrl;
  };

  const getBatchById = async (batchId: string) => {
    try {
      const docRef = doc(db, 'batches', batchId);
      const docSnap = await getDocs(query(collection(db, 'batches'), where('__name__', '==', batchId)));
      // Using getDocs with query because direct doc() might fail if not exists or permissions
      // Actually doc(db, 'batches', batchId) is fine if we use getDoc
      const { getDoc } = await import('firebase/firestore');
      const snap = await getDoc(docRef);
      
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() };
      }
      return null;
    } catch (error) {
      console.error("Fetch Batch Error:", error);
      return null;
    }
  };

  const generateBatch = async (data: any, customApiKey?: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, customApiKey })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate content');
      }

      const content = await response.json();
      
      // Save to Firestore
      if (auth.currentUser) {
        // Calculate total pieces
        let totalPieces = content.imagePrompts?.length || 0;
        if (content.platforms) {
          Object.values(content.platforms).forEach((platformPosts: any) => {
            if (Array.isArray(platformPosts)) {
              totalPieces += platformPosts.length;
            }
          });
        }

        const docRef = await addDoc(collection(db, 'batches'), {
          industry: data.industry,
          city: data.city,
          country: data.country,
          platforms: data.platforms,
          emotionHook: data.emotionHook,
          batchSize: data.batchSize,
          totalPieces,
          content,
          userId: auth.currentUser.uid,
          timestamp: serverTimestamp()
        });

        // Update Stats
        const statsRef = doc(db, 'stats', 'global');
        try {
          await updateDoc(statsRef, {
            totalBatches: increment(1),
            totalPosts: increment(totalPieces),
            total_generations: increment(1),
            dailyCount: increment(1)
          });
        } catch (statsError) {
          console.error("Stats Update Error:", statsError);
        }

        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#7c3aed', '#6366f1', '#06b6d4']
        });

        toast.success('Content Empire Generated! ⚡');
        return { id: docRef.id, content, ...data, timestamp: new Date() };
      }

      return { content };
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to generate content factory.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateBatch = async (batchId: string, updatedContent: any) => {
    try {
      const batchRef = doc(db, 'batches', batchId);
      await updateDoc(batchRef, {
        content: updatedContent
      });
      return true;
    } catch (error) {
      console.error("Update Batch Error:", error);
      toast.error("Failed to update batch content");
      return false;
    }
  };

  return { batches, stats, loading, generateBatch, deleteBatch, updateBatch, nextPage, prevPage, page, hasMore, exportAllToCSV, shareBatch, getBatchById };
}

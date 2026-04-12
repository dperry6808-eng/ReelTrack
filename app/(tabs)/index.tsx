
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Image, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function DashboardScreen() {
  const [catches, setCatches] = useState([]);
  const [activeTournament, setActiveTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    await Promise.all([loadCatches(), loadActiveTournament()]);
    setLoading(false);
  }

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([loadCatches(), loadActiveTournament()]);
    setRefreshing(false);
  }

  async function loadCatches() {
    const { data } = await supabase
      .from('catches')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setCatches(data);
  }

  async function loadActiveTournament() {
    const { data } = await supabase
      .from('tournaments')
      .select('*')
      .eq('is_active', true)
      .limit(1);
    if (data && data.length > 0) setActiveTournament(data[0]);
    else setActiveTournament(null);
  }

  function formatWeight(lb, oz) {
    if (!lb && !oz) return 'N/A';
    return lb + ' lb ' + oz + ' oz';
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Stats
  const totalCatches = catches.length;
  const keptFish = catches.filter(c => c.cull_status === 'Keep').length;
  const releasedFish = catches.filter(c => c.cull_status === 'Release').length;
  const tooShort = catches.filter(c => c.release_reason === 'Too Short').length;

  // Today's catches
  const today = new Date().toDateString();
  const todayCatches = catches.filter(c => new Date(c.created_at).toDateString() === today);

  // Best fish (heaviest)
  const bestFish = catches.reduce((best, c) => {
    const w = (c.weight_lb || 0) + (c.weight_oz || 0) / 16;
    const bestW = (best?.weight_lb || 0) + (best?.weight_oz || 0) / 16;
    return w > bestW ? c : best;
  }, null);

  // Recent 5 catches
  const recentCatches = catches.slice(0, 5);

  // Top lure
  const lureCounts = catches.reduce((acc, c) => {
    if (c.lure) acc[c.lure] = (acc[c.lure] || 0) + 1;
    return acc;
  }, {});
  const topLure = Object.entries(lureCounts).sort((a, b) => b[1] - a[1])[0];

  // Top lake
  const lakeCounts = catches.reduce((acc, c) => {
    if (c.lake) acc[c.lake] = (acc[c.lake] || 0) + 1;
    return acc;
  }, {});
  const topLake = Object.entries(lakeCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4a9eff" />}
    >
      <Text style={styles.header}>🎣 ReelTrack</Text>

      {/* Active Tournament Banner */}
      {activeTournament && (
        <View style={styles.tournamentBanner}>
          <View style={styles.tournamentDot} />
          <View style={styles.tournamentInfo}>
            <Text style={styles.tournamentLabel}>ACTIVE TOURNAMENT</Text>
            <Text style={styles.tournamentName}>{activeTournament.name}</Text>
            <Text style={styles.tournamentDetails}>
              {activeTournament.lake} • Limit: {activeTournament.fish_limit} fish • Min: {activeTournament.min_length}"
            </Text>
            {activeTournament.checkin_time && (
              <Text style={styles.tournamentDetails}>Check-in: {activeTournament.checkin_time}</Text>
            )}
          </View>
        </View>
      )}

      {/* Today's Stats */}
      <Text style={styles.sectionTitle}>Today</Text>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{todayCatches.length}</Text>
          <Text style={styles.statLabel}>Caught</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: '#2ecc71' }]}>{todayCatches.filter(c => c.cull_status === 'Keep').length}</Text>
          <Text style={styles.statLabel}>Kept</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: '#e74c3c' }]}>{todayCatches.filter(c => c.cull_status === 'Release').length}</Text>
          <Text style={styles.statLabel}>Released</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: '#f39c12' }]}>
            {todayCatches.reduce((sum, c) => sum + (c.weight_lb || 0) + (c.weight_oz || 0) / 16, 0).toFixed(2)}
          </Text>
          <Text style={styles.statLabel}>Lbs</Text>
        </View>
      </View>

      {/* All Time Stats */}
      <Text style={styles.sectionTitle}>All Time</Text>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{totalCatches}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: '#2ecc71' }]}>{keptFish}</Text>
          <Text style={styles.statLabel}>Kept</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: '#e74c3c' }]}>{tooShort}</Text>
          <Text style={styles.statLabel}>Too Short</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: '#f39c12' }]}>{releasedFish}</Text>
          <Text style={styles.statLabel}>Released</Text>
        </View>
      </View>

      {/* Best Fish */}
      {bestFish && (
        <>
          <Text style={styles.sectionTitle}>Personal Best</Text>
          <View style={styles.bestFishCard}>
            {bestFish.photo_url && (
              <Image source={{ uri: bestFish.photo_url }} style={styles.bestFishPhoto} resizeMode="cover" />
            )}
            <View style={styles.bestFishInfo}>
              <Text style={styles.bestFishSpecies}>{bestFish.species || 'Unknown'}</Text>
              <Text style={styles.bestFishWeight}>{formatWeight(bestFish.weight_lb, bestFish.weight_oz)}</Text>
              <Text style={styles.bestFishDetails}>
                {bestFish.lake && bestFish.lake + ' • '}{formatDate(bestFish.created_at)}
              </Text>
              {bestFish.lure && <Text style={styles.bestFishDetails}>🎣 {bestFish.lure}</Text>}
            </View>
          </View>
        </>
      )}

      {/* Top Patterns */}
      {(topLure || topLake) && (
        <>
          <Text style={styles.sectionTitle}>Top Patterns</Text>
          <View style={styles.patternsRow}>
            {topLure && (
              <View style={styles.patternCard}>
                <Text style={styles.patternIcon}>🎣</Text>
                <Text style={styles.patternValue}>{topLure[0]}</Text>
                <Text style={styles.patternLabel}>Top Lure ({topLure[1]} fish)</Text>
              </View>
            )}
            {topLake && (
              <View style={styles.patternCard}>
                <Text style={styles.patternIcon}>🌊</Text>
                <Text style={styles.patternValue}>{topLake[0]}</Text>
                <Text style={styles.patternLabel}>Top Lake ({topLake[1]} fish)</Text>
              </View>
            )}
          </View>
        </>
      )}

      {/* Recent Catches */}
      {recentCatches.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Recent Catches</Text>
          {recentCatches.map(c => (
            <View key={c.id} style={styles.recentCard}>
              {c.photo_url && (
                <Image source={{ uri: c.photo_url }} style={styles.recentPhoto} resizeMode="cover" />
              )}
              <View style={styles.recentInfo}>
                <Text style={styles.recentSpecies}>{c.species || 'Unknown'}</Text>
                <Text style={styles.recentWeight}>{formatWeight(c.weight_lb, c.weight_oz)}</Text>
                <Text style={styles.recentDetails}>{c.lake || ''}{c.lure ? ' • ' + c.lure : ''}</Text>
              </View>
              <Text style={styles.recentDate}>{formatDate(c.created_at)}</Text>
            </View>
          ))}
        </>
      )}

      {totalCatches === 0 && !loading && (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No catches yet!</Text>
          <Text style={styles.emptySubtext}>Head to Log a Catch to record your first fish.</Text>
        </View>
      )}

      <Text style={styles.pullToRefresh}>Pull down to refresh</Text>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628', padding: 16 },
  header: { fontSize: 28, color: '#fff', fontWeight: 'bold', textAlign: 'center', marginTop: 20, marginBottom: 16 },
  sectionTitle: { color: '#4a9eff', fontSize: 14, fontWeight: 'bold', marginTop: 20, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, backgroundColor: '#1a2a3a', borderRadius: 12, padding: 12, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  tournamentBanner: { backgroundColor: '#1a2a3a', borderRadius: 12, padding: 16, marginBottom: 8, borderLeftWidth: 4, borderLeftColor: '#2ecc71', flexDirection: 'row', alignItems: 'center', gap: 12 },
  tournamentDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#2ecc71' },
  tournamentInfo: { flex: 1 },
  tournamentLabel: { color: '#2ecc71', fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  tournamentName: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginTop: 2 },
  tournamentDetails: { color: '#aaa', fontSize: 13, marginTop: 2 },
  bestFishCard: { backgroundColor: '#1a2a3a', borderRadius: 12, overflow: 'hidden' },
  bestFishPhoto: { width: '100%', height: 180 },
  bestFishInfo: { padding: 14 },
  bestFishSpecies: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  bestFishWeight: { color: '#2ecc71', fontSize: 22, fontWeight: 'bold', marginTop: 4 },
  bestFishDetails: { color: '#aaa', fontSize: 13, marginTop: 4 },
  patternsRow: { flexDirection: 'row', gap: 8 },
  patternCard: { flex: 1, backgroundColor: '#1a2a3a', borderRadius: 12, padding: 14, alignItems: 'center' },
  patternIcon: { fontSize: 24, marginBottom: 8 },
  patternValue: { color: '#fff', fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  patternLabel: { color: '#888', fontSize: 11, marginTop: 4, textAlign: 'center' },
  recentCard: { backgroundColor: '#1a2a3a', borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
  recentPhoto: { width: 60, height: 60, borderRadius: 8 },
  recentInfo: { flex: 1 },
  recentSpecies: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  recentWeight: { color: '#4a9eff', fontSize: 13, marginTop: 2 },
  recentDetails: { color: '#888', fontSize: 12, marginTop: 2 },
  recentDate: { color: '#555', fontSize: 12 },
  emptyBox: { backgroundColor: '#1a2a3a', borderRadius: 12, padding: 32, alignItems: 'center', marginTop: 20 },
  emptyText: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  emptySubtext: { color: '#888', fontSize: 14, textAlign: 'center' },
  pullToRefresh: { color: '#2a3a4a', fontSize: 12, textAlign: 'center', marginTop: 16 },
});

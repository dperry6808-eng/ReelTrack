import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Image, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function TodayScreen() {
  const [catches, setCatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTournament, setActiveTournament] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Generate last 30 days for date picker
  const dates = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d;
  });

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  async function loadData() {
    setLoading(true);
    await Promise.all([loadCatches(), loadActiveTournament()]);
    setLoading(false);
  }

  async function loadCatches() {
    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(selectedDate);
    end.setHours(23, 59, 59, 999);

    // Use local timezone offset to get correct date range
    const tzOffset = start.getTimezoneOffset() * 60000;
    const localStart = new Date(start.getTime() - tzOffset).toISOString();
    const localEnd = new Date(end.getTime() - tzOffset).toISOString();

    const { data } = await supabase
      .from('catches')
      .select('*')
      .gte('created_at', localStart)
      .lte('created_at', localEnd)
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

  function formatDate(date) {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }

  function formatShortDate(date) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function formatWeight(lb, oz) {
    if (!lb && !oz) return 'N/A';
    return lb + ' lb ' + oz + ' oz';
  }

  function getTotalLbs(fish) {
    return fish.reduce((sum, c) => sum + (c.weight_lb || 0) + (c.weight_oz || 0) / 16, 0);
  }

  function isToday(date) {
    return date.toDateString() === new Date().toDateString();
  }

  // Stats
  const totalCaught = catches.length;
  const keptFish = catches.filter(c => c.cull_status === 'Keep');
  const releasedFish = catches.filter(c => c.cull_status === 'Release');
  const tooShort = catches.filter(c => c.release_reason === 'Too Short');
  const tooLight = catches.filter(c => c.release_reason === 'Too Light');
  const totalWeight = getTotalLbs(catches).toFixed(2);

  // Best 5 kept fish by weight
  const best5 = [...keptFish]
    .sort((a, b) => ((b.weight_lb || 0) + (b.weight_oz || 0) / 16) - ((a.weight_lb || 0) + (a.weight_oz || 0) / 16))
    .slice(0, 5);
  const best5Weight = getTotalLbs(best5).toFixed(2);

  // Top lure
  const lureCounts = catches.reduce((acc, c) => {
    if (c.lure) acc[c.lure] = (acc[c.lure] || 0) + 1;
    return acc;
  }, {});
  const topLure = Object.entries(lureCounts).sort((a, b) => b[1] - a[1])[0];

  // Top structure
  const structureCounts = catches.reduce((acc, c) => {
    if (c.structure) acc[c.structure] = (acc[c.structure] || 0) + 1;
    return acc;
  }, {});
  const topStructure = Object.entries(structureCounts).sort((a, b) => b[1] - a[1])[0];

  // Best single fish
  const biggestFish = catches.reduce((best, c) => {
    const w = (c.weight_lb || 0) + (c.weight_oz || 0) / 16;
    const bestW = best ? (best.weight_lb || 0) + (best.weight_oz || 0) / 16 : 0;
    return w > bestW ? c : best;
  }, null);

  async function handleShare() {
    const lake = activeTournament?.lake || catches[0]?.lake || 'Unknown Lake';
    const anglers = activeTournament ? activeTournament.angler1 + (activeTournament.angler2 ? ' & ' + activeTournament.angler2 : '') : '';
    const tournamentName = activeTournament?.name || '';

    let text = '🎣 ReelTrack Trip Summary\n';
    text += '━━━━━━━━━━━━━━━━━━\n';
    if (tournamentName) text += '🏆 ' + tournamentName + '\n';
    text += '📅 ' + formatDate(selectedDate) + '\n';
    text += '🌊 ' + lake + '\n';
    if (anglers) text += '👤 ' + anglers + '\n';
    text += '━━━━━━━━━━━━━━━━━━\n';
    text += '📊 STATS\n';
    text += 'Total Caught: ' + totalCaught + '\n';
    text += 'Total Weight: ' + totalWeight + ' lbs\n';
    if (best5.length > 0) text += 'Best 5 Bag: ' + best5Weight + ' lbs\n';
    text += '━━━━━━━━━━━━━━━━━━\n';
    if (best5.length > 0) {
      text += '🐟 BEST 5 FISH\n';
      best5.forEach((f, i) => {
        text += (i + 1) + '. ' + formatWeight(f.weight_lb, f.weight_oz);
        if (f.cull_tag) text += ' (Tag #' + f.cull_tag + ')';
        text += '\n';
      });
      text += '━━━━━━━━━━━━━━━━━━\n';
    }
    if (topLure) text += '🎣 Top Lure: ' + topLure[0] + ' (' + topLure[1] + ' fish)\n';
    const windSpeeds = catches.filter(c => c.wind_speed).map(c => c.wind_speed);
    if (windSpeeds.length > 0) text += '💨 Wind: ' + windSpeeds[0] + ' mph\n';
    const waterLevels = catches.filter(c => c.water_level).map(c => c.water_level);
    if (waterLevels.length > 0) text += '🌊 Water Level: ' + waterLevels[0] + '\n';
    if (biggestFish) text += '🏅 Big Fish: ' + formatWeight(biggestFish.weight_lb, biggestFish.weight_oz) + '\n';
    text += '\nLogged with ReelTrack 🎣';

    try {
      await Share.share({ message: text });
    } catch (e) {}
  }

  return (
    <ScrollView style={styles.container}>

      {/* Header */}
      <Text style={styles.header}>🎣 Trip Summary</Text>

      {/* Date Selector */}
      <TouchableOpacity style={styles.dateSelector} onPress={() => setShowDatePicker(!showDatePicker)}>
        <Text style={styles.dateSelectorText}>
          {isToday(selectedDate) ? "📅 Today" : "📅 " + formatShortDate(selectedDate)}
        </Text>
        <Text style={styles.dateSelectorArrow}>{showDatePicker ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <View style={styles.dateList}>
          {dates.map((d, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.dateItem, d.toDateString() === selectedDate.toDateString() && styles.dateItemActive]}
              onPress={() => { setSelectedDate(d); setShowDatePicker(false); }}
            >
              <Text style={[styles.dateItemText, d.toDateString() === selectedDate.toDateString() && styles.dateItemTextActive]}>
                {i === 0 ? 'Today — ' : ''}{formatDate(d)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Tournament Banner */}
      {activeTournament && isToday(selectedDate) && (
        <View style={styles.tournamentBanner}>
          <Text style={styles.tournamentLabel}>🏆 {activeTournament.name}</Text>
          <Text style={styles.tournamentDetails}>
            {activeTournament.lake} • {activeTournament.angler1}{activeTournament.angler2 ? ' & ' + activeTournament.angler2 : ''}
          </Text>
        </View>
      )}

      {loading && <Text style={styles.loading}>Loading...</Text>}

      {!loading && catches.length === 0 && (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No catches on this day</Text>
          <Text style={styles.emptySubtext}>Go catch some fish! 🎣</Text>
        </View>
      )}

      {!loading && catches.length > 0 && (
        <>
          {/* Date and Lake */}
          <View style={styles.tripHeader}>
            <Text style={styles.tripDate}>{formatDate(selectedDate)}</Text>
            {catches[0]?.lake && <Text style={styles.tripLake}>🌊 {catches[0].lake}</Text>}
          </View>

          {/* Main Stats */}
          <View style={styles.mainStatsRow}>
            <View style={styles.mainStatCard}>
              <Text style={styles.mainStatNum}>{totalCaught}</Text>
              <Text style={styles.mainStatLabel}>Total Caught</Text>
            </View>
            <View style={styles.mainStatCard}>
              <Text style={[styles.mainStatNum, { color: '#2ecc71' }]}>{totalWeight}</Text>
              <Text style={styles.mainStatLabel}>Total lbs</Text>
            </View>
            {best5.length > 0 && (
              <View style={styles.mainStatCard}>
                <Text style={[styles.mainStatNum, { color: '#f39c12' }]}>{best5Weight}</Text>
                <Text style={styles.mainStatLabel}>Best 5 lbs</Text>
              </View>
            )}
          </View>

          {/* Secondary Stats */}
          <View style={styles.secondaryStatsRow}>
            <View style={styles.secondaryStatBox}>
              <Text style={[styles.secondaryStatNum, { color: '#2ecc71' }]}>{keptFish.length}</Text>
              <Text style={styles.secondaryStatLabel}>Kept</Text>
            </View>
            <View style={styles.secondaryStatBox}>
              <Text style={[styles.secondaryStatNum, { color: '#f39c12' }]}>{tooLight.length}</Text>
              <Text style={styles.secondaryStatLabel}>Too Light</Text>
            </View>
            <View style={styles.secondaryStatBox}>
              <Text style={[styles.secondaryStatNum, { color: '#e74c3c' }]}>{tooShort.length}</Text>
              <Text style={styles.secondaryStatLabel}>Too Short</Text>
            </View>
            <View style={styles.secondaryStatBox}>
              <Text style={[styles.secondaryStatNum, { color: '#888' }]}>{releasedFish.length}</Text>
              <Text style={styles.secondaryStatLabel}>Released</Text>
            </View>
          </View>

          {/* Best 5 Fish */}
          {best5.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>🐟 Best 5 Fish — {best5Weight} lbs</Text>
              {best5.map((f, i) => (
                <View key={f.id} style={styles.fishCard}>
                  {f.photo_url && (
                    <Image source={{ uri: f.photo_url }} style={styles.fishPhoto} resizeMode="cover" />
                  )}
                  <View style={styles.fishInfo}>
                    <View style={styles.fishRankRow}>
                      <Text style={styles.fishRank}>#{i + 1}</Text>
                      {f.cull_tag && <Text style={styles.fishTag}>Tag #{f.cull_tag}</Text>}
                    </View>
                    <Text style={styles.fishWeight}>{formatWeight(f.weight_lb, f.weight_oz)}</Text>
                    <Text style={styles.fishSpecies}>{f.species || 'Unknown'}</Text>
                    {f.lure && <Text style={styles.fishDetail}>🎣 {f.lure}</Text>}
                    {f.structure && <Text style={styles.fishDetail}>🏞 {f.structure}</Text>}
                    {f.wind_speed && <Text style={styles.fishDetail}>💨 {f.wind_speed} mph</Text>}
                    {f.water_level && <Text style={styles.fishDetail}>🌊 {f.water_level}</Text>}
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Patterns */}
          {(topLure || topStructure || biggestFish) && (
            <>
              <Text style={styles.sectionTitle}>📊 Patterns</Text>
              <View style={styles.patternsGrid}>
                {topLure && (
                  <View style={styles.patternCard}>
                    <Text style={styles.patternIcon}>🎣</Text>
                    <Text style={styles.patternValue}>{topLure[0]}</Text>
                    <Text style={styles.patternLabel}>Top Lure ({topLure[1]} fish)</Text>
                  </View>
                )}
                {topStructure && (
                  <View style={styles.patternCard}>
                    <Text style={styles.patternIcon}>🏞</Text>
                    <Text style={styles.patternValue}>{topStructure[0]}</Text>
                    <Text style={styles.patternLabel}>Top Structure ({topStructure[1]} fish)</Text>
                  </View>
                )}
                {biggestFish && (
                  <View style={styles.patternCard}>
                    <Text style={styles.patternIcon}>🏅</Text>
                    <Text style={styles.patternValue}>{formatWeight(biggestFish.weight_lb, biggestFish.weight_oz)}</Text>
                    <Text style={styles.patternLabel}>Biggest Fish</Text>
                  </View>
                )}
              </View>
            </>
          )}

          {/* All Catches */}
          <Text style={styles.sectionTitle}>📋 All Catches ({totalCaught})</Text>
          {catches.map((c, i) => (
            <View key={c.id} style={styles.catchRow}>
              <View style={styles.catchNum}>
                <Text style={styles.catchNumText}>{totalCaught - i}</Text>
              </View>
              <View style={styles.catchInfo}>
                <Text style={styles.catchSpecies}>{c.species || 'Unknown'}</Text>
                <Text style={styles.catchWeight}>{formatWeight(c.weight_lb, c.weight_oz)}</Text>
                {c.lure && <Text style={styles.catchDetail}>{c.lure}</Text>}
              {c.wind_speed && <Text style={styles.catchDetail}>💨 {c.wind_speed} mph</Text>}
              {c.water_level && <Text style={styles.catchDetail}>🌊 {c.water_level}</Text>}
              </View>
              {c.cull_status && (
                <View style={[styles.catchBadge, {
                  backgroundColor: c.cull_status === 'Keep' ? '#2ecc7133' : '#e74c3c33',
                  borderColor: c.cull_status === 'Keep' ? '#2ecc71' : '#e74c3c'
                }]}>
                  <Text style={[styles.catchBadgeText, { color: c.cull_status === 'Keep' ? '#2ecc71' : '#e74c3c' }]}>
                    {c.cull_status === 'Keep' ? (c.cull_tag ? 'Tag #' + c.cull_tag : 'Kept') : (c.release_reason || 'Released')}
                  </Text>
                </View>
              )}
            </View>
          ))}

          {/* Share Button */}
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Text style={styles.shareBtnText}>📤 Share Trip Summary</Text>
          </TouchableOpacity>
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628', padding: 16 },
  header: { fontSize: 24, color: '#fff', fontWeight: 'bold', textAlign: 'center', marginTop: 20, marginBottom: 16 },
  dateSelector: { backgroundColor: '#1a2a3a', padding: 14, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  dateSelectorText: { color: '#4a9eff', fontSize: 16, fontWeight: 'bold' },
  dateSelectorArrow: { color: '#4a9eff', fontSize: 14 },
  dateList: { backgroundColor: '#1a2a3a', borderRadius: 10, marginBottom: 12, overflow: 'hidden' },
  dateItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#0a1628' },
  dateItemActive: { backgroundColor: '#4a9eff' },
  dateItemText: { color: '#fff', fontSize: 14 },
  dateItemTextActive: { fontWeight: 'bold' },
  tournamentBanner: { backgroundColor: '#1a2a3a', borderRadius: 10, padding: 14, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#f39c12' },
  tournamentLabel: { color: '#f39c12', fontSize: 16, fontWeight: 'bold' },
  tournamentDetails: { color: '#aaa', fontSize: 13, marginTop: 4 },
  loading: { color: '#888', textAlign: 'center', marginTop: 40 },
  emptyBox: { backgroundColor: '#1a2a3a', borderRadius: 12, padding: 40, alignItems: 'center', marginTop: 20 },
  emptyText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  emptySubtext: { color: '#888', fontSize: 14, marginTop: 8 },
  tripHeader: { alignItems: 'center', marginBottom: 16 },
  tripDate: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  tripLake: { color: '#4a9eff', fontSize: 14, marginTop: 4 },
  mainStatsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  mainStatCard: { flex: 1, backgroundColor: '#1a2a3a', borderRadius: 12, padding: 14, alignItems: 'center' },
  mainStatNum: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  mainStatLabel: { fontSize: 11, color: '#888', marginTop: 4, textAlign: 'center' },
  secondaryStatsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  secondaryStatBox: { flex: 1, backgroundColor: '#1a2a3a', borderRadius: 10, padding: 10, alignItems: 'center' },
  secondaryStatNum: { fontSize: 20, fontWeight: 'bold' },
  secondaryStatLabel: { fontSize: 10, color: '#888', marginTop: 2 },
  sectionTitle: { color: '#4a9eff', fontSize: 14, fontWeight: 'bold', marginTop: 20, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  fishCard: { backgroundColor: '#1a2a3a', borderRadius: 12, marginBottom: 10, overflow: 'hidden', flexDirection: 'row' },
  fishPhoto: { width: 100, height: 100 },
  fishInfo: { flex: 1, padding: 12 },
  fishRankRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  fishRank: { color: '#f39c12', fontSize: 18, fontWeight: 'bold' },
  fishTag: { color: '#4a9eff', fontSize: 12, backgroundColor: '#0a1628', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  fishWeight: { color: '#2ecc71', fontSize: 20, fontWeight: 'bold' },
  fishSpecies: { color: '#fff', fontSize: 13, marginTop: 2 },
  fishDetail: { color: '#888', fontSize: 12, marginTop: 2 },
  patternsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  patternCard: { flex: 1, minWidth: '30%', backgroundColor: '#1a2a3a', borderRadius: 10, padding: 12, alignItems: 'center' },
  patternIcon: { fontSize: 20, marginBottom: 6 },
  patternValue: { color: '#fff', fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
  patternLabel: { color: '#888', fontSize: 11, marginTop: 4, textAlign: 'center' },
  catchRow: { backgroundColor: '#1a2a3a', borderRadius: 10, padding: 12, marginBottom: 6, flexDirection: 'row', alignItems: 'center', gap: 10 },
  catchNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#0a1628', alignItems: 'center', justifyContent: 'center' },
  catchNumText: { color: '#4a9eff', fontSize: 12, fontWeight: 'bold' },
  catchInfo: { flex: 1 },
  catchSpecies: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  catchWeight: { color: '#4a9eff', fontSize: 13 },
  catchDetail: { color: '#888', fontSize: 12 },
  catchBadge: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  catchBadgeText: { fontSize: 11, fontWeight: 'bold' },
  shareBtn: { backgroundColor: '#4a9eff', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  shareBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { supabase } from '@/lib/supabase';

export default function HistoryScreen() {
  const [catches, setCatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCatches();
  }, []);

  async function loadCatches() {
    setLoading(true);
    const { data, error } = await supabase
      .from('catches')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      alert('Error loading catches: ' + error.message);
    } else {
      setCatches(data || []);
    }
    setLoading(false);
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function formatWeight(lb, oz) {
    if (!lb && !oz) return 'No weight';
    return lb + ' lb ' + oz + ' oz';
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>My Catch History</Text>
      <Text style={styles.subheader}>{catches.length} total catches</Text>

      <TouchableOpacity style={styles.refreshBtn} onPress={loadCatches}>
        <Text style={styles.refreshText}>Refresh</Text>
      </TouchableOpacity>

      {loading && (
        <Text style={styles.loading}>Loading catches...</Text>
      )}

      {!loading && catches.length === 0 && (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No catches yet!</Text>
          <Text style={styles.emptySubtext}>Head to Log a Catch to record your first fish.</Text>
        </View>
      )}

      {catches.map(c => (
        <View key={c.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.species}>{c.species || 'Unknown Species'}</Text>
            <Text style={styles.date}>{formatDate(c.created_at)}</Text>
          </View>
          <View style={styles.cardBody}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Weight</Text>
              <Text style={styles.statValue}>{formatWeight(c.weight_lb, c.weight_oz)}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Length</Text>
              <Text style={styles.statValue}>{c.length ? c.length + '"' : 'N/A'}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Lake</Text>
              <Text style={styles.statValue}>{c.lake || 'N/A'}</Text>
            </View>
          </View>
          {c.lure && (
            <Text style={styles.lure}>Lure: {c.lure}</Text>
          )}
          {c.notes && (
            <Text style={styles.notes}>{c.notes}</Text>
          )}
        </View>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628', padding: 16 },
  header: { fontSize: 24, color: '#fff', fontWeight: 'bold', textAlign: 'center', marginTop: 20 },
  subheader: { color: '#4a9eff', textAlign: 'center', fontSize: 14, marginBottom: 16 },
  refreshBtn: { backgroundColor: '#1a2a3a', padding: 10, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  refreshText: { color: '#4a9eff', fontSize: 14, fontWeight: 'bold' },
  loading: { color: '#888', textAlign: 'center', marginTop: 40, fontSize: 16 },
  emptyBox: { backgroundColor: '#1a2a3a', borderRadius: 12, padding: 32, alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  emptySubtext: { color: '#888', fontSize: 14, textAlign: 'center' },
  card: { backgroundColor: '#1a2a3a', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  species: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  date: { color: '#888', fontSize: 14 },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  stat: { alignItems: 'center' },
  statLabel: { color: '#888', fontSize: 12, marginBottom: 4 },
  statValue: { color: '#4a9eff', fontSize: 14, fontWeight: 'bold' },
  lure: { color: '#aaa', fontSize: 14, marginTop: 4 },
  notes: { color: '#888', fontSize: 13, marginTop: 4, fontStyle: 'italic' },
});
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export default function DashboardScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>🎣 ReelTrack</Text>
      <Text style={styles.welcome}>Welcome back, Angler!</Text>

      <View style={styles.grid}>
        <TouchableOpacity style={[styles.card, styles.cardBlue]}>
          <Text style={styles.cardIcon}>🏆</Text>
          <Text style={styles.cardTitle}>Start Tournament</Text>
          <Text style={styles.cardSub}>Set up a new tournament</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, styles.cardGreen]}>
          <Text style={styles.cardIcon}>🐟</Text>
          <Text style={styles.cardTitle}>Log a Catch</Text>
          <Text style={styles.cardSub}>Record your fish</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, styles.cardPurple]}>
          <Text style={styles.cardIcon}>📊</Text>
          <Text style={styles.cardTitle}>My History</Text>
          <Text style={styles.cardSub}>View past catches</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, styles.cardOrange]}>
          <Text style={styles.cardIcon}>🤖</Text>
          <Text style={styles.cardTitle}>AI Predictions</Text>
          <Text style={styles.cardSub}>What's biting today</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsBox}>
        <Text style={styles.statsTitle}>Today's Stats</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>0</Text>
            <Text style={styles.statLabel}>Fish Caught</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>0</Text>
            <Text style={styles.statLabel}>Total Weight</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>0</Text>
            <Text style={styles.statLabel}>Tournaments</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628', padding: 16 },
  header: { fontSize: 28, color: '#fff', fontWeight: 'bold', textAlign: 'center', marginTop: 20 },
  welcome: { color: '#4a9eff', textAlign: 'center', fontSize: 16, marginBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', padding: 20, borderRadius: 12, marginBottom: 16 },
  cardBlue: { backgroundColor: '#1a3a5c' },
  cardGreen: { backgroundColor: '#1a3a2a' },
  cardPurple: { backgroundColor: '#2a1a3a' },
  cardOrange: { backgroundColor: '#3a2a1a' },
  cardIcon: { fontSize: 32, marginBottom: 8 },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  cardSub: { color: '#888', fontSize: 12 },
  statsBox: { backgroundColor: '#1a2a3a', borderRadius: 12, padding: 20, marginTop: 8 },
  statsTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statNum: { color: '#4a9eff', fontSize: 28, fontWeight: 'bold' },
  statLabel: { color: '#888', fontSize: 12, marginTop: 4 },
});
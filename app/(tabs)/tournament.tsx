import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export default function TournamentScreen() {
  const [tournamentName, setTournamentName] = useState('');
  const [lakeName, setLakeName] = useState('');
  const [boatNumber, setBoatNumber] = useState('');
  const [angler1, setAngler1] = useState('');
  const [angler2, setAngler2] = useState('');
  const [takeoffTime, setTakeoffTime] = useState('');
  const [checkInTime, setCheckInTime] = useState('');
  const [fishLimit, setFishLimit] = useState('5');
  const [minLength, setMinLength] = useState('12');
  const [useWeight, setUseWeight] = useState(true);

  function handleStart() {
    if (!tournamentName || !lakeName || !angler1) {
      alert('Please fill in Tournament Name, Lake, and at least Angler 1');
      return;
    }
    alert('Tournament Started! Good luck on the water!');
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>🏆 Tournament Setup</Text>

      <Text style={styles.label}>Tournament Name</Text>
      <TextInput style={styles.input} placeholder="e.g. Spring Bass Classic" placeholderTextColor="#555" value={tournamentName} onChangeText={setTournamentName} />

      <Text style={styles.label}>Lake Name</Text>
      <TextInput style={styles.input} placeholder="e.g. Chickamauga Lake" placeholderTextColor="#555" value={lakeName} onChangeText={setLakeName} />

      <Text style={styles.label}>Boat Number</Text>
      <TextInput style={styles.input} placeholder="e.g. 42" placeholderTextColor="#555" value={boatNumber} onChangeText={setBoatNumber} keyboardType="numeric" />

      <Text style={styles.label}>Angler 1 Name</Text>
      <TextInput style={styles.input} placeholder="Your name" placeholderTextColor="#555" value={angler1} onChangeText={setAngler1} />

      <Text style={styles.label}>Angler 2 Name (Partner)</Text>
      <TextInput style={styles.input} placeholder="Partner name (optional)" placeholderTextColor="#555" value={angler2} onChangeText={setAngler2} />

      <Text style={styles.label}>Take Off Time</Text>
      <TextInput style={styles.input} placeholder="e.g. 6:00 AM" placeholderTextColor="#555" value={takeoffTime} onChangeText={setTakeoffTime} />

      <Text style={styles.label}>Check In Time</Text>
      <TextInput style={styles.input} placeholder="e.g. 2:00 PM" placeholderTextColor="#555" value={checkInTime} onChangeText={setCheckInTime} />

      <Text style={styles.label}>Fish Limit</Text>
      <TextInput style={styles.input} placeholder="5" placeholderTextColor="#555" value={fishLimit} onChangeText={setFishLimit} keyboardType="numeric" />

      <Text style={styles.label}>Minimum Length (inches)</Text>
      <TextInput style={styles.input} placeholder="12" placeholderTextColor="#555" value={minLength} onChangeText={setMinLength} keyboardType="numeric" />

      <Text style={styles.label}>Scoring Type</Text>
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, useWeight && styles.toggleActive]}
          onPress={() => setUseWeight(true)}>
          <Text style={[styles.toggleText, useWeight && styles.toggleTextActive]}>⚖️ Weight</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, !useWeight && styles.toggleActive]}
          onPress={() => setUseWeight(false)}>
          <Text style={[styles.toggleText, !useWeight && styles.toggleTextActive]}>📏 Length</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleStart}>
        <Text style={styles.buttonText}>🎣 Start Tournament</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628', padding: 16 },
  header: { fontSize: 24, color: '#fff', fontWeight: 'bold', textAlign: 'center', marginTop: 20, marginBottom: 24 },
  label: { color: '#4a9eff', fontSize: 14, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#1a2a3a', color: '#fff', padding: 14, borderRadius: 10, fontSize: 16 },
  toggleRow: { flexDirection: 'row', gap: 12 },
  toggleBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#1a2a3a', alignItems: 'center' },
  toggleActive: { backgroundColor: '#4a9eff' },
  toggleText: { color: '#888', fontSize: 16, fontWeight: 'bold' },
  toggleTextActive: { color: '#fff' },
  button: { backgroundColor: '#4a9eff', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 24 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
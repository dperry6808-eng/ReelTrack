import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export default function LogCatchScreen() {
  const [species, setSpecies] = useState('Largemouth Bass');
  const [weightLb, setWeightLb] = useState('');
  const [weightOz, setWeightOz] = useState('');
  const [length, setLength] = useState('');
  const [lure, setLure] = useState('');
  const [notes, setNotes] = useState('');

  function handleSave() {
    alert('Fish logged!');
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Log a Catch</Text>
      <Text style={styles.label}>Species</Text>
      <TextInput style={styles.input} value={species} onChangeText={setSpecies} placeholderTextColor="#555" />
      <Text style={styles.label}>Weight (lbs)</Text>
      <TextInput style={styles.input} placeholder="Pounds" placeholderTextColor="#555" value={weightLb} onChangeText={setWeightLb} keyboardType="numeric" />
      <Text style={styles.label}>Weight (oz)</Text>
      <TextInput style={styles.input} placeholder="Ounces" placeholderTextColor="#555" value={weightOz} onChangeText={setWeightOz} keyboardType="numeric" />
      <Text style={styles.label}>Length (inches)</Text>
      <TextInput style={styles.input} placeholder="Length" placeholderTextColor="#555" value={length} onChangeText={setLength} keyboardType="numeric" />
      <Text style={styles.label}>Lure Used</Text>
      <TextInput style={styles.input} placeholder="Lure name and color" placeholderTextColor="#555" value={lure} onChangeText={setLure} />
      <Text style={styles.label}>Notes</Text>
      <TextInput style={[styles.input, styles.notesInput]} placeholder="Notes..." placeholderTextColor="#555" value={notes} onChangeText={setNotes} multiline />
      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save Catch</Text>
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
  notesInput: { height: 100, textAlignVertical: 'top' },
  button: { backgroundColor: '#2ecc71', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 24 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
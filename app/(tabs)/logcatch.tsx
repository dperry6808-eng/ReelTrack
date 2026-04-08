import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { supabase } from '@/lib/supabase';

export default function LogCatchScreen() {
  const [species, setSpecies] = useState('Largemouth Bass');
  const [weightLb, setWeightLb] = useState('');
  const [weightOz, setWeightOz] = useState('');
  const [length, setLength] = useState('');
  const [lure, setLure] = useState('');
  const [lake, setLake] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (!weightLb && !length) {
      alert('Please enter at least a weight or length');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('catches').insert({
      species,
      weight_lb: parseFloat(weightLb) || 0,
      weight_oz: parseFloat(weightOz) || 0,
      length: parseFloat(length) || 0,
      lure,
      lake,
      notes,
    });
    setSaving(false);
    if (error) {
      alert('Error saving: ' + error.message);
    } else {
      setSaved(true);
      setWeightLb('');
      setWeightOz('');
      setLength('');
      setLure('');
      setNotes('');
      setTimeout(() => setSaved(false), 3000);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Log a Catch</Text>

      {saved && (
        <View style={styles.successBox}>
          <Text style={styles.successText}>Fish saved to database!</Text>
        </View>
      )}

      <Text style={styles.label}>Species</Text>
      <TextInput style={styles.input} value={species} onChangeText={setSpecies} placeholderTextColor="#555" />

      <Text style={styles.label}>Lake Name</Text>
      <TextInput style={styles.input} placeholder="Lake name" placeholderTextColor="#555" value={lake} onChangeText={setLake} />

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

      <TouchableOpacity style={styles.button} onPress={handleSave} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Save Catch'}</Text>
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
  successBox: { backgroundColor: '#1a3a2a', borderWidth: 2, borderColor: '#2ecc71', borderRadius: 10, padding: 16, marginBottom: 16 },
  successText: { color: '#2ecc71', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
});
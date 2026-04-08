import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export default function CullScreen() {
  const [weightLb, setWeightLb] = useState('');
  const [weightOz, setWeightOz] = useState('');
  const [minLength, setMinLength] = useState('12');
  const [fishLength, setFishLength] = useState('');
  const [livewell, setLivewell] = useState([]);
  const [message, setMessage] = useState('Enter your first fish to get started');
  const [messageColor, setMessageColor] = useState('#4a9eff');

  const limit = 5;

  function getTotalWeight(fish) {
    return fish.reduce((sum, f) => sum + f.lb + f.oz / 16, 0);
  }

  function getLightest(fish) {
    return fish.reduce((min, f) => {
      const w = f.lb + f.oz / 16;
      return w < min.weight ? { fish: f, weight: w } : min;
    }, { fish: fish[0], weight: fish[0].lb + fish[0].oz / 16 });
  }

  function handleAddFish() {
    const lb = parseFloat(weightLb) || 0;
    const oz = parseFloat(weightOz) || 0;
    const len = parseFloat(fishLength) || 0;
    const min = parseFloat(minLength) || 12;

    if (!lb && !oz) {
      setMessage('Please enter a weight!');
      setMessageColor('#e74c3c');
      return;
    }

    if (fishLength && len < min) {
      setMessage('Too short - must release this fish!');
      setMessageColor('#e74c3c');
      return;
    }

    if (livewell.length < limit) {
      const tag = livewell.length + 1;
      const newFish = { lb, oz, tag };
      const newLivewell = [...livewell, newFish];
      setLivewell(newLivewell);
      const total = getTotalWeight(newLivewell).toFixed(2);
      setMessage('Keep it! Assign Cull Tag #' + tag + ' — Total: ' + total + ' lbs');
      setMessageColor('#2ecc71');
    } else {
      const newWeight = lb + oz / 16;
      const lightest = getLightest(livewell);
      if (newWeight > lightest.weight) {
        const newLivewell = livewell.map(f =>
          f.tag === lightest.fish.tag ? { lb, oz, tag: lightest.fish.tag } : f
        );
        setLivewell(newLivewell);
        const total = getTotalWeight(newLivewell).toFixed(2);
        setMessage('Cull Tag #' + lightest.fish.tag + ' - Replace it! New total: ' + total + ' lbs');
        setMessageColor('#f39c12');
      } else {
        setMessage('Too light - release this fish! Keep your current bag.');
        setMessageColor('#e74c3c');
      }
    }

    setWeightLb('');
    setWeightOz('');
    setFishLength('');
  }

  function handleReset() {
    setLivewell([]);
    setMessage('Enter your first fish to get started');
    setMessageColor('#4a9eff');
  }

  const total = getTotalWeight(livewell).toFixed(2);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Smart Cull</Text>
      <Text style={styles.subheader}>Livewell: {livewell.length}/{limit} fish — {total} lbs</Text>

      <View style={[styles.messageBox, { borderColor: messageColor }]}>
        <Text style={[styles.messageText, { color: messageColor }]}>{message}</Text>
      </View>

      <Text style={styles.label}>Min Length (inches)</Text>
      <TextInput style={styles.input} value={minLength} onChangeText={setMinLength} keyboardType="numeric" placeholderTextColor="#555" />

      <Text style={styles.label}>Fish Length (optional)</Text>
      <TextInput style={styles.input} placeholder="Length to check minimum" placeholderTextColor="#555" value={fishLength} onChangeText={setFishLength} keyboardType="numeric" />

      <Text style={styles.label}>Fish Weight</Text>
      <View style={styles.row}>
        <View style={styles.halfInput}>
          <TextInput style={styles.input} placeholder="Pounds" placeholderTextColor="#555" value={weightLb} onChangeText={setWeightLb} keyboardType="numeric" />
        </View>
        <View style={styles.halfInput}>
          <TextInput style={styles.input} placeholder="Ounces" placeholderTextColor="#555" value={weightOz} onChangeText={setWeightOz} keyboardType="numeric" />
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleAddFish}>
        <Text style={styles.buttonText}>Add Fish to Livewell</Text>
      </TouchableOpacity>

      {livewell.length > 0 && (
        <View style={styles.livewellBox}>
          <Text style={styles.livewellTitle}>Current Livewell</Text>
          {livewell.map(f => (
            <View key={f.tag} style={styles.fishRow}>
              <Text style={styles.fishTag}>Tag #{f.tag}</Text>
              <Text style={styles.fishWeight}>{f.lb} lb {f.oz} oz</Text>
            </View>
          ))}
          <Text style={styles.totalWeight}>Total: {total} lbs</Text>
        </View>
      )}

      <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
        <Text style={styles.resetText}>Reset Livewell</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628', padding: 16 },
  header: { fontSize: 24, color: '#fff', fontWeight: 'bold', textAlign: 'center', marginTop: 20 },
  subheader: { color: '#4a9eff', textAlign: 'center', fontSize: 16, marginBottom: 16 },
  messageBox: { borderWidth: 2, borderRadius: 10, padding: 16, marginBottom: 16 },
  messageText: { fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  label: { color: '#4a9eff', fontSize: 14, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#1a2a3a', color: '#fff', padding: 14, borderRadius: 10, fontSize: 16 },
  row: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  button: { backgroundColor: '#4a9eff', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 24 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  livewellBox: { backgroundColor: '#1a2a3a', borderRadius: 10, padding: 16, marginTop: 16 },
  livewellTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  fishRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#2a3a4a' },
  fishTag: { color: '#4a9eff', fontSize: 16, fontWeight: 'bold' },
  fishWeight: { color: '#fff', fontSize: 16 },
  totalWeight: { color: '#2ecc71', fontSize: 18, fontWeight: 'bold', textAlign: 'right', marginTop: 12 },
  resetButton: { backgroundColor: '#e74c3c', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 16 },
  resetText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
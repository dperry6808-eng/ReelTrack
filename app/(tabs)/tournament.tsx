import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import TournamentResults from './tournament_results';

export default function TournamentScreen() {
  const [tournamentName, setTournamentName] = useState('');
  const [boatNumber, setBoatNumber] = useState('');
  const [angler1, setAngler1] = useState('');
  const [angler2, setAngler2] = useState('');
  const [takeoffTime, setTakeoffTime] = useState('');
  const [checkInTime, setCheckInTime] = useState('');
  const [fishLimit, setFishLimit] = useState('5');
  const [minLength, setMinLength] = useState('12');
  const [useWeight, setUseWeight] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Lake dropdown
  const [lake, setLake] = useState('');
  const [lakes, setLakes] = useState([]);
  const [showLakeDropdown, setShowLakeDropdown] = useState(false);
  const [showNewLake, setShowNewLake] = useState(false);
  const [newLake, setNewLake] = useState('');

  // Active tournament
  const [activeTournament, setActiveTournament] = useState(null);
  const [showEndWarning, setShowEndWarning] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [endedTournament, setEndedTournament] = useState(null);

  useEffect(() => {
    loadLakes();
    loadActiveTournament();
  }, []);

  async function loadLakes() {
    const { data } = await supabase.from('lakes').select('*').order('name');
    if (data) setLakes(data);
  }

  async function loadActiveTournament() {
    const { data } = await supabase
      .from('tournaments')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);
    if (data && data.length > 0) {
      setActiveTournament(data[0]);
    } else {
      setActiveTournament(null);
    }
  }

  async function saveNewLake() {
    if (!newLake.trim()) { alert('Please enter a lake name'); return; }
    const { error } = await supabase.from('lakes').insert({ name: newLake.trim() });
    if (error) { alert('Error saving lake: ' + error.message); return; }
    setLake(newLake.trim());
    setNewLake(''); setShowNewLake(false); setShowLakeDropdown(false);
    loadLakes();
  }

  async function handleStart() {
    if (!tournamentName || !lake || !angler1) {
      alert('Please fill in Tournament Name, Lake, and at least Angler 1');
      return;
    }

    // End any existing active tournament first
    await supabase.from('tournaments').update({ is_active: false }).eq('is_active', true);

    // Clear any saved livewell from previous tournament
    await AsyncStorage.removeItem('saved_livewell');
    await AsyncStorage.removeItem('saved_tournament_mode');

    setSaving(true);
    const { data, error } = await supabase.from('tournaments').insert({
      name: tournamentName,
      lake,
      boat_number: boatNumber,
      angler1,
      angler2,
      takeoff_time: takeoffTime,
      checkin_time: checkInTime,
      fish_limit: parseInt(fishLimit) || 5,
      min_length: parseFloat(minLength) || 12,
      scoring_type: useWeight ? 'weight' : 'length',
      is_active: true,
    }).select();
    setSaving(false);

    if (error) {
      alert('Error saving: ' + error.message);
    } else {
      setSaved(true);
      loadActiveTournament();
      // Clear form
      setTournamentName(''); setLake(''); setBoatNumber('');
      setAngler1(''); setAngler2(''); setTakeoffTime(''); setCheckInTime('');
      setFishLimit('5'); setMinLength('12');
      setTimeout(() => setSaved(false), 3000);
    }
  }

  async function handleEndTournament() {
    const ended = activeTournament;
    await supabase.from('tournaments').update({ is_active: false }).eq('id', activeTournament.id);
    setActiveTournament(null);
    setShowEndWarning(false);
    setEndedTournament(ended);
    setShowResults(true);
  }

  if (showResults && endedTournament) {
    return <TournamentResults tournament={endedTournament} onClose={() => { setShowResults(false); setEndedTournament(null); }} />;
  }

  return (
    <ScrollView style={styles.container}>

      {/* End Tournament Warning */}
      <Modal visible={showEndWarning} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>End Tournament?</Text>
            <Text style={styles.modalMessage}>
              This will end the active tournament.{'\n'}Log a Catch will return to normal mode.
            </Text>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#2a3a4a' }]} onPress={() => setShowEndWarning(false)}>
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#e74c3c' }]} onPress={handleEndTournament}>
                <Text style={styles.modalBtnText}>End Tournament</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Text style={styles.header}>Tournament Setup</Text>

      {/* Active Tournament Banner */}
      {activeTournament && (
        <View style={styles.activeBanner}>
          <View style={styles.activeDot} />
          <View style={styles.activeInfo}>
            <Text style={styles.activeTitle}>ACTIVE TOURNAMENT</Text>
            <Text style={styles.activeName}>{activeTournament.name}</Text>
            <Text style={styles.activeDetails}>
              {activeTournament.lake} • {activeTournament.angler1}{activeTournament.angler2 ? ' & ' + activeTournament.angler2 : ''}
            </Text>
            <Text style={styles.activeDetails}>
              Limit: {activeTournament.fish_limit} fish • Min: {activeTournament.min_length}" • {activeTournament.scoring_type === 'weight' ? 'Weight' : 'Length'} scoring
            </Text>
            {activeTournament.takeoff_time && (
              <Text style={styles.activeDetails}>
                Takeoff: {activeTournament.takeoff_time} • Check-in: {activeTournament.checkin_time}
              </Text>
            )}
          </View>
          <TouchableOpacity style={styles.endBtn} onPress={() => setShowEndWarning(true)}>
            <Text style={styles.endBtnText}>End</Text>
          </TouchableOpacity>
        </View>
      )}

      {!activeTournament && (
        <View style={styles.noActiveBox}>
          <Text style={styles.noActiveText}>No active tournament</Text>
          <Text style={styles.noActiveSubtext}>Fill in the details below to start one</Text>
        </View>
      )}

      {saved && (
        <View style={styles.successBox}>
          <Text style={styles.successText}>Tournament started! Log a Catch is ready!</Text>
        </View>
      )}

      <Text style={styles.sectionHeader}>Start New Tournament</Text>

      <Text style={styles.label}>Tournament Name</Text>
      <TextInput style={styles.input} placeholder="e.g. Spring Bass Classic" placeholderTextColor="#555" value={tournamentName} onChangeText={setTournamentName} />

      {/* Lake Dropdown */}
      <Text style={styles.label}>Lake Name</Text>
      <TouchableOpacity style={styles.dropdown} onPress={() => setShowLakeDropdown(!showLakeDropdown)}>
        <Text style={lake ? styles.dropdownSelected : styles.dropdownPlaceholder}>{lake || 'Select lake...'}</Text>
        <Text style={styles.dropdownArrow}>{showLakeDropdown ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {showLakeDropdown && (
        <View style={styles.dropdownList}>
          <TouchableOpacity style={styles.dropdownItem} onPress={() => setShowNewLake(!showNewLake)}>
            <Text style={[styles.dropdownItemText, { color: '#4a9eff' }]}>+ Add New Lake</Text>
          </TouchableOpacity>
          {showNewLake && (
            <View style={styles.inlineAdd}>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Lake name..." placeholderTextColor="#555" value={newLake} onChangeText={setNewLake} autoFocus />
              <TouchableOpacity style={styles.inlineAddBtn} onPress={saveNewLake}>
                <Text style={styles.inlineAddBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          )}
          {lakes.map(l => (
            <TouchableOpacity key={l.id} style={styles.dropdownItem} onPress={() => { setLake(l.name); setShowLakeDropdown(false); setShowNewLake(false); }}>
              <Text style={styles.dropdownItemText}>{l.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

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
        <TouchableOpacity style={[styles.toggleBtn, useWeight && styles.toggleActive]} onPress={() => setUseWeight(true)}>
          <Text style={[styles.toggleText, useWeight && styles.toggleTextActive]}>Weight</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toggleBtn, !useWeight && styles.toggleActive]} onPress={() => setUseWeight(false)}>
          <Text style={[styles.toggleText, !useWeight && styles.toggleTextActive]}>Length</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleStart} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Start Tournament'}</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628', padding: 16 },
  header: { fontSize: 24, color: '#fff', fontWeight: 'bold', textAlign: 'center', marginTop: 20, marginBottom: 16 },
  sectionHeader: { fontSize: 18, color: '#4a9eff', fontWeight: 'bold', marginTop: 24, marginBottom: 8, borderTopWidth: 1, borderTopColor: '#1a2a3a', paddingTop: 16 },
  label: { color: '#4a9eff', fontSize: 14, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#1a2a3a', color: '#fff', padding: 14, borderRadius: 10, fontSize: 16 },
  toggleRow: { flexDirection: 'row', gap: 12 },
  toggleBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#1a2a3a', alignItems: 'center' },
  toggleActive: { backgroundColor: '#4a9eff' },
  toggleText: { color: '#888', fontSize: 16, fontWeight: 'bold' },
  toggleTextActive: { color: '#fff' },
  button: { backgroundColor: '#2ecc71', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 24 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  successBox: { backgroundColor: '#1a3a2a', borderWidth: 2, borderColor: '#2ecc71', borderRadius: 10, padding: 16, marginBottom: 16 },
  successText: { color: '#2ecc71', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  activeBanner: { backgroundColor: '#1a2a3a', borderRadius: 12, padding: 16, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#2ecc71', flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  activeDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#2ecc71', marginTop: 4 },
  activeInfo: { flex: 1 },
  activeTitle: { color: '#2ecc71', fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 },
  activeName: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  activeDetails: { color: '#aaa', fontSize: 13, marginBottom: 2 },
  endBtn: { backgroundColor: '#e74c3c', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  endBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  noActiveBox: { backgroundColor: '#1a2a3a', borderRadius: 12, padding: 16, marginBottom: 16, alignItems: 'center' },
  noActiveText: { color: '#888', fontSize: 16, fontWeight: 'bold' },
  noActiveSubtext: { color: '#555', fontSize: 13, marginTop: 4 },
  dropdown: { backgroundColor: '#1a2a3a', padding: 14, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownSelected: { color: '#fff', fontSize: 16 },
  dropdownPlaceholder: { color: '#555', fontSize: 16 },
  dropdownArrow: { color: '#4a9eff', fontSize: 14 },
  dropdownList: { backgroundColor: '#1a2a3a', borderRadius: 10, marginTop: 4, overflow: 'hidden' },
  dropdownItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#0a1628' },
  dropdownItemText: { color: '#fff', fontSize: 15 },
  inlineAdd: { flexDirection: 'row', gap: 8, padding: 10, alignItems: 'center' },
  inlineAddBtn: { backgroundColor: '#4a9eff', padding: 14, borderRadius: 10 },
  inlineAddBtnText: { color: '#fff', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalBox: { backgroundColor: '#0a1628', borderWidth: 3, borderColor: '#e74c3c', borderRadius: 16, padding: 32, width: '100%', alignItems: 'center' },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  modalMessage: { color: '#aaa', fontSize: 16, textAlign: 'center', marginBottom: 24, lineHeight: 24 },
  modalBtnRow: { flexDirection: 'row', gap: 16, width: '100%' },
  modalBtn: { flex: 1, paddingVertical: 16, borderRadius: 10, alignItems: 'center' },
  modalBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

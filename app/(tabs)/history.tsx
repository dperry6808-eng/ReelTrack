import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function HistoryScreen() {
  const [catches, setCatches] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lures, setLures] = useState([]);
  const [selectedCatch, setSelectedCatch] = useState(null);
  const [showLureDropdown, setShowLureDropdown] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit fields
  const [editWeightLb, setEditWeightLb] = useState('');
  const [editWeightOz, setEditWeightOz] = useState('');
  const [editLength, setEditLength] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editLure, setEditLure] = useState('');
  const [editSpecies, setEditSpecies] = useState('');
  const [editWaterTemp, setEditWaterTemp] = useState('');

  // Filters
  const [dateFilter, setDateFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [lureFilter, setLureFilter] = useState('');
  const [structureFilter, setStructureFilter] = useState('All');
  const [depthFilter, setDepthFilter] = useState('All');
  const [lakeFilter, setLakeFilter] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('');
  const [lakes, setLakes] = useState([]);
  const [speciesList, setSpeciesList] = useState([]);
  const [showLakeDropdown, setShowLakeDropdown] = useState(false);
  const [showSpeciesDropdown, setShowSpeciesDropdown] = useState(false);

  const dateOptions = ['All', 'Today', 'This Week', 'This Month'];
  const statusOptions = ['All', 'Kept', 'Released', 'Too Short', 'Too Light'];
  const structureOptions = ['All', 'Flats', 'Points', 'Ledges', 'Stumps', 'Brush Pile', 'Rocks', 'Riprap', 'Dock', 'Creek Channel', 'Open Water'];
  const depthOptions = ['All', '0-5 ft', '5-10 ft', '10-15 ft', '15-20 ft', '20-30 ft', '30+ ft'];

  useEffect(() => {
    loadCatches();
    loadLures();
    loadLakes();
    loadSpeciesList();
  }, []);

  async function loadLakes() {
    const { data } = await supabase.from('lakes').select('*').order('name');
    if (data) setLakes(data);
  }

  async function loadSpeciesList() {
    const { data } = await supabase.from('species_list').select('*').order('name');
    if (data) setSpeciesList(data);
  }

  useEffect(() => {
    applyFilters();
  }, [catches, dateFilter, statusFilter, lakeFilter, speciesFilter, lureFilter, structureFilter, depthFilter]);

  async function loadCatches() {
    setLoading(true);
    const { data, error } = await supabase
      .from('catches')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { alert('Error loading catches: ' + error.message); }
    else { setCatches(data || []); }
    setLoading(false);
  }

  async function loadLures() {
    const { data } = await supabase.from('Lure').select('*').order('name');
    if (data) setLures(data);
  }

  function openCatch(c) {
    setSelectedCatch(c);
    setEditMode(false);
    setShowDeleteConfirm(false);
  }

  function startEdit() {
    setEditWeightLb(String(selectedCatch.weight_lb || ''));
    setEditWeightOz(String(selectedCatch.weight_oz || ''));
    setEditLength(String(selectedCatch.length || ''));
    setEditNotes(selectedCatch.notes || '');
    setEditLure(selectedCatch.lure || '');
    setEditSpecies(selectedCatch.species || '');
    setEditWaterTemp(String(selectedCatch.water_temp || ''));
    setEditMode(true);
  }

  async function saveEdit() {
    setSaving(true);
    const { error } = await supabase.from('catches').update({
      weight_lb: parseFloat(editWeightLb) || 0,
      weight_oz: parseFloat(editWeightOz) || 0,
      length: parseFloat(editLength) || 0,
      notes: editNotes,
      lure: editLure,
      species: editSpecies,
      water_temp: editWaterTemp,
    }).eq('id', selectedCatch.id);
    setSaving(false);
    if (error) { alert('Error saving: ' + error.message); return; }
    setEditMode(false);
    setSelectedCatch(null);
    loadCatches();
  }

  async function deleteCatch(id) {
    const { error } = await supabase.from('catches').delete().eq('id', id);
    if (error) { alert('Error deleting: ' + error.message); return; }
    setSelectedCatch(null);
    setShowDeleteConfirm(false);
    loadCatches();
  }

  function applyFilters() {
    let result = [...catches];
    if (dateFilter !== 'All') {
      const now = new Date();
      result = result.filter(c => {
        const date = new Date(c.created_at);
        if (dateFilter === 'Today') return date.toDateString() === now.toDateString();
        if (dateFilter === 'This Week') { const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7); return date >= weekAgo; }
        if (dateFilter === 'This Month') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        return true;
      });
    }
    if (statusFilter !== 'All') {
      result = result.filter(c => {
        if (statusFilter === 'Kept') return c.cull_status === 'Keep';
        if (statusFilter === 'Released') return c.cull_status === 'Release';
        if (statusFilter === 'Too Short') return c.release_reason === 'Too Short';
        if (statusFilter === 'Too Light') return c.release_reason === 'Too Light';
        return true;
      });
    }
    if (lakeFilter.trim() !== '') result = result.filter(c => c.lake && c.lake.toLowerCase().includes(lakeFilter.toLowerCase()));
    if (speciesFilter.trim() !== '') result = result.filter(c => c.species && c.species.toLowerCase().includes(speciesFilter.toLowerCase()));
    if (lureFilter !== '') result = result.filter(c => c.lure && c.lure.toLowerCase() === lureFilter.toLowerCase());
    if (structureFilter !== 'All') result = result.filter(c => c.structure && c.structure.toLowerCase() === structureFilter.toLowerCase());
    if (depthFilter !== 'All') result = result.filter(c => c.depth && c.depth === depthFilter);
    setFiltered(result);
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function formatWeight(lb, oz) {
    if (!lb && !oz) return 'No weight';
    return lb + ' lb ' + oz + ' oz';
  }

  function getStatusColor(c) {
    if (!c.cull_status) return '#888';
    if (c.cull_status === 'Keep') return '#2ecc71';
    if (c.release_reason === 'Too Short') return '#e74c3c';
    if (c.release_reason === 'Too Light') return '#f39c12';
    return '#e74c3c';
  }

  function getStatusLabel(c) {
    if (!c.cull_status) return '';
    if (c.cull_status === 'Keep') return c.cull_tag ? 'Tag #' + c.cull_tag : 'Kept';
    if (c.release_reason) return c.release_reason;
    return 'Released';
  }

  function clearFilters() {
    setDateFilter('All'); setStatusFilter('All'); setLakeFilter('');
    setSpeciesFilter(''); setLureFilter(''); setStructureFilter('All'); setDepthFilter('All');
  }

  const total = filtered.length;
  const kept = filtered.filter(c => c.cull_status === 'Keep').length;
  const tooShort = filtered.filter(c => c.release_reason === 'Too Short').length;
  const tooLight = filtered.filter(c => c.release_reason === 'Too Light').length;

  return (
    <ScrollView style={styles.container}>

      {/* Fish Detail / Edit Modal */}
      <Modal visible={!!selectedCatch} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.detailModal}>
            {selectedCatch && !editMode && (
              <>
                {selectedCatch.photo_url && (
                  <Image source={{ uri: selectedCatch.photo_url }} style={styles.detailPhoto} resizeMode='cover' />
                )}
                <View style={styles.detailHeader}>
                  <Text style={styles.detailSpecies}>{selectedCatch.species || 'Unknown Species'}</Text>
                  <Text style={styles.detailDate}>{formatDate(selectedCatch.created_at)}</Text>
                </View>
                {selectedCatch.cull_status && (
                  <View style={[styles.badge, { backgroundColor: getStatusColor(selectedCatch) + '33', borderColor: getStatusColor(selectedCatch), alignSelf: 'flex-start', marginBottom: 16 }]}>
                    <Text style={[styles.badgeText, { color: getStatusColor(selectedCatch) }]}>{getStatusLabel(selectedCatch)}</Text>
                  </View>
                )}
                <View style={styles.detailGrid}>
                  <View style={styles.detailItem}><Text style={styles.detailLabel}>Weight</Text><Text style={styles.detailValue}>{formatWeight(selectedCatch.weight_lb, selectedCatch.weight_oz)}</Text></View>
                  <View style={styles.detailItem}><Text style={styles.detailLabel}>Length</Text><Text style={styles.detailValue}>{selectedCatch.length ? selectedCatch.length + '"' : 'N/A'}</Text></View>
                  <View style={styles.detailItem}><Text style={styles.detailLabel}>Lake</Text><Text style={styles.detailValue}>{selectedCatch.lake || 'N/A'}</Text></View>
                  <View style={styles.detailItem}><Text style={styles.detailLabel}>Lure</Text><Text style={styles.detailValue}>{selectedCatch.lure || 'N/A'}</Text></View>
                  <View style={styles.detailItem}><Text style={styles.detailLabel}>Structure</Text><Text style={styles.detailValue}>{selectedCatch.structure || 'N/A'}</Text></View>
                  <View style={styles.detailItem}><Text style={styles.detailLabel}>Depth</Text><Text style={styles.detailValue}>{selectedCatch.depth || 'N/A'}</Text></View>
                  <View style={styles.detailItem}><Text style={styles.detailLabel}>Weather</Text><Text style={styles.detailValue}>{selectedCatch.weather || 'N/A'}</Text></View>
                  <View style={styles.detailItem}><Text style={styles.detailLabel}>Water Temp</Text><Text style={styles.detailValue}>{selectedCatch.water_temp ? selectedCatch.water_temp + '°F' : 'N/A'}</Text></View>
                  <View style={styles.detailItem}><Text style={styles.detailLabel}>Water Clarity</Text><Text style={styles.detailValue}>{selectedCatch.water_clarity || 'N/A'}</Text></View>
                  <View style={styles.detailItem}><Text style={styles.detailLabel}>GPS</Text><Text style={styles.detailValue}>{selectedCatch.latitude ? selectedCatch.latitude.toFixed(4) + ', ' + selectedCatch.longitude.toFixed(4) : 'N/A'}</Text></View>
                </View>
                {selectedCatch.notes && (
                  <View style={styles.detailNotes}>
                    <Text style={styles.detailLabel}>Notes</Text>
                    <Text style={styles.detailNotesText}>{selectedCatch.notes}</Text>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionBtnRow}>
                  <TouchableOpacity style={styles.editBtn} onPress={startEdit}>
                    <Text style={styles.editBtnText}>✏️ Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => setShowDeleteConfirm(true)}>
                    <Text style={styles.deleteBtnText}>🗑 Delete</Text>
                  </TouchableOpacity>
                </View>

                {/* Delete Confirmation */}
                {showDeleteConfirm && (
                  <View style={styles.confirmBox}>
                    <Text style={styles.confirmText}>Are you sure you want to delete this catch?</Text>
                    <View style={styles.confirmBtnRow}>
                      <TouchableOpacity style={styles.confirmCancelBtn} onPress={() => setShowDeleteConfirm(false)}>
                        <Text style={styles.confirmCancelText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.confirmDeleteBtn} onPress={() => deleteCatch(selectedCatch.id)}>
                        <Text style={styles.confirmDeleteText}>Yes, Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <TouchableOpacity style={styles.closeBtn} onPress={() => { setSelectedCatch(null); setShowDeleteConfirm(false); }}>
                  <Text style={styles.closeBtnText}>Close</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Edit Mode */}
            {selectedCatch && editMode && (
              <>
                <Text style={styles.editTitle}>Edit Catch</Text>

                <Text style={styles.editLabel}>Species</Text>
                <TextInput style={styles.editInput} value={editSpecies} onChangeText={setEditSpecies} placeholderTextColor="#555" />

                <Text style={styles.editLabel}>Weight (lbs)</Text>
                <TextInput style={styles.editInput} value={editWeightLb} onChangeText={setEditWeightLb} keyboardType="numeric" placeholderTextColor="#555" />

                <Text style={styles.editLabel}>Weight (oz)</Text>
                <TextInput style={styles.editInput} value={editWeightOz} onChangeText={setEditWeightOz} keyboardType="numeric" placeholderTextColor="#555" />

                <Text style={styles.editLabel}>Length (inches)</Text>
                <TextInput style={styles.editInput} value={editLength} onChangeText={setEditLength} keyboardType="numeric" placeholderTextColor="#555" />

                <Text style={styles.editLabel}>Lure</Text>
                <TextInput style={styles.editInput} value={editLure} onChangeText={setEditLure} placeholderTextColor="#555" />

                <Text style={styles.editLabel}>Water Temp (F)</Text>
                <TextInput style={styles.editInput} value={editWaterTemp} onChangeText={setEditWaterTemp} keyboardType="numeric" placeholderTextColor="#555" />

                <Text style={styles.editLabel}>Notes</Text>
                <TextInput style={[styles.editInput, { height: 80, textAlignVertical: 'top' }]} value={editNotes} onChangeText={setEditNotes} multiline placeholderTextColor="#555" />

                <TouchableOpacity style={styles.saveEditBtn} onPress={saveEdit} disabled={saving}>
                  <Text style={styles.saveEditBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelEditBtn} onPress={() => setEditMode(false)}>
                  <Text style={styles.cancelEditBtnText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      <Text style={styles.header}>My Catch History</Text>

      {/* Tappable Stats Bar */}
      <View style={styles.statsRow}>
        <TouchableOpacity style={styles.statBox} onPress={() => setStatusFilter('All')}>
          <Text style={[styles.statNum, statusFilter === 'All' && styles.statActive]}>{total}</Text>
          <Text style={styles.statLbl}>Total</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statBox} onPress={() => setStatusFilter('Kept')}>
          <Text style={[styles.statNum, { color: '#2ecc71' }, statusFilter === 'Kept' && styles.statActive]}>{kept}</Text>
          <Text style={styles.statLbl}>Kept</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statBox} onPress={() => setStatusFilter('Too Light')}>
          <Text style={[styles.statNum, { color: '#f39c12' }, statusFilter === 'Too Light' && styles.statActive]}>{tooLight}</Text>
          <Text style={styles.statLbl}>Too Light</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statBox} onPress={() => setStatusFilter('Too Short')}>
          <Text style={[styles.statNum, { color: '#e74c3c' }, statusFilter === 'Too Short' && styles.statActive]}>{tooShort}</Text>
          <Text style={styles.statLbl}>Too Short</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.filterLabel}>Date Range</Text>
      <View style={styles.chipRow}>
        {dateOptions.map(d => (
          <TouchableOpacity key={d} style={[styles.chip, dateFilter === d && styles.chipActive]} onPress={() => setDateFilter(d)}>
            <Text style={[styles.chipText, dateFilter === d && styles.chipTextActive]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.filterLabel}>Status</Text>
      <View style={styles.chipRow}>
        {statusOptions.map(s => (
          <TouchableOpacity key={s} style={[styles.chip, statusFilter === s && styles.chipActive]} onPress={() => setStatusFilter(s)}>
            <Text style={[styles.chipText, statusFilter === s && styles.chipTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.filterLabel}>Structure</Text>
      <View style={styles.chipRow}>
        {structureOptions.map(s => (
          <TouchableOpacity key={s} style={[styles.chip, structureFilter === s && styles.chipActive]} onPress={() => setStructureFilter(s)}>
            <Text style={[styles.chipText, structureFilter === s && styles.chipTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.filterLabel}>Depth</Text>
      <View style={styles.chipRow}>
        {depthOptions.map(d => (
          <TouchableOpacity key={d} style={[styles.chip, depthFilter === d && styles.chipActive]} onPress={() => setDepthFilter(d)}>
            <Text style={[styles.chipText, depthFilter === d && styles.chipTextActive]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.filterLabel}>Filter by Lure</Text>
      <TouchableOpacity style={styles.dropdown} onPress={() => setShowLureDropdown(!showLureDropdown)}>
        <Text style={lureFilter ? styles.dropdownSelected : styles.dropdownPlaceholder}>{lureFilter || "All lures..."}</Text>
        <Text style={styles.dropdownArrow}>{showLureDropdown ? "▲" : "▼"}</Text>
      </TouchableOpacity>
      {showLureDropdown && (
        <View style={styles.dropdownList}>
          <TouchableOpacity style={styles.dropdownItem} onPress={() => { setLureFilter(''); setShowLureDropdown(false); }}>
            <Text style={[styles.dropdownItemText, { color: '#4a9eff' }]}>All Lures</Text>
          </TouchableOpacity>
          {lures.map(l => (
            <TouchableOpacity key={l.id} style={styles.dropdownItem} onPress={() => { setLureFilter(l.name); setShowLureDropdown(false); }}>
              <Text style={styles.dropdownItemText}>{l.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.filterLabel}>Filter by Lake</Text>
      <TouchableOpacity style={styles.dropdown} onPress={() => { setShowLakeDropdown(!showLakeDropdown); setShowSpeciesDropdown(false); setShowLureDropdown(false); }}>
        <Text style={lakeFilter ? styles.dropdownSelected : styles.dropdownPlaceholder}>{lakeFilter || 'All lakes...'}</Text>
        <Text style={styles.dropdownArrow}>{showLakeDropdown ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {showLakeDropdown && (
        <View style={styles.dropdownList}>
          <TouchableOpacity style={styles.dropdownItem} onPress={() => { setLakeFilter(''); setShowLakeDropdown(false); }}>
            <Text style={[styles.dropdownItemText, { color: '#4a9eff' }]}>All Lakes</Text>
          </TouchableOpacity>
          {lakes.map(l => (
            <TouchableOpacity key={l.id} style={styles.dropdownItem} onPress={() => { setLakeFilter(l.name); setShowLakeDropdown(false); }}>
              <Text style={styles.dropdownItemText}>{l.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.filterLabel}>Filter by Species</Text>
      <TouchableOpacity style={styles.dropdown} onPress={() => { setShowSpeciesDropdown(!showSpeciesDropdown); setShowLakeDropdown(false); setShowLureDropdown(false); }}>
        <Text style={speciesFilter ? styles.dropdownSelected : styles.dropdownPlaceholder}>{speciesFilter || 'All species...'}</Text>
        <Text style={styles.dropdownArrow}>{showSpeciesDropdown ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {showSpeciesDropdown && (
        <View style={styles.dropdownList}>
          <TouchableOpacity style={styles.dropdownItem} onPress={() => { setSpeciesFilter(''); setShowSpeciesDropdown(false); }}>
            <Text style={[styles.dropdownItemText, { color: '#4a9eff' }]}>All Species</Text>
          </TouchableOpacity>
          {speciesList.map(s => (
            <TouchableOpacity key={s.id} style={styles.dropdownItem} onPress={() => { setSpeciesFilter(s.name); setShowSpeciesDropdown(false); }}>
              <Text style={styles.dropdownItemText}>{s.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
          <Text style={styles.clearBtnText}>Clear Filters</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadCatches}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {loading && <Text style={styles.loading}>Loading catches...</Text>}

      {!loading && filtered.length === 0 && (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No catches found!</Text>
          <Text style={styles.emptySubtext}>Try changing your filters.</Text>
        </View>
      )}

      {filtered.map(c => (
        <TouchableOpacity key={c.id} style={styles.card} onPress={() => openCatch(c)}>
          <View style={styles.cardHeader}>
            <Text style={styles.species}>{c.species || 'Unknown Species'}</Text>
            <Text style={styles.date}>{formatDate(c.created_at)}</Text>
          </View>
          {c.cull_status && (
            <View style={[styles.badge, { backgroundColor: getStatusColor(c) + '33', borderColor: getStatusColor(c) }]}>
              <Text style={[styles.badgeText, { color: getStatusColor(c) }]}>{getStatusLabel(c)}</Text>
            </View>
          )}
          <View style={styles.cardBody}>
            <View style={styles.stat}><Text style={styles.statLabel}>Weight</Text><Text style={styles.statValue}>{formatWeight(c.weight_lb, c.weight_oz)}</Text></View>
            <View style={styles.stat}><Text style={styles.statLabel}>Length</Text><Text style={styles.statValue}>{c.length ? c.length + '"' : 'N/A'}</Text></View>
            <View style={styles.stat}><Text style={styles.statLabel}>Lake</Text><Text style={styles.statValue}>{c.lake || 'N/A'}</Text></View>
          </View>
          <View style={styles.cardDetails}>
            {c.lure && <Text style={styles.detail}>🎣 {c.lure}</Text>}
            {c.structure && <Text style={styles.detail}>🏞 {c.structure}</Text>}
            {c.depth && <Text style={styles.detail}>📏 {c.depth}</Text>}
            {c.weather && <Text style={styles.detail}>🌤 {c.weather}</Text>}
            {c.water_clarity && <Text style={styles.detail}>💧 {c.water_clarity}</Text>}
            {c.water_temp && <Text style={styles.detail}>🌡 {c.water_temp}°F</Text>}
          </View>
          {c.notes && <Text style={styles.notes}>"{c.notes}"</Text>}
          <Text style={styles.tapHint}>Tap to view • edit • delete</Text>
        </TouchableOpacity>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628', padding: 16 },
  header: { fontSize: 24, color: '#fff', fontWeight: 'bold', textAlign: 'center', marginTop: 20, marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#1a2a3a', borderRadius: 12, padding: 16, marginBottom: 16 },
  statBox: { alignItems: 'center', flex: 1 },
  statNum: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  statActive: { textDecorationLine: 'underline' },
  statLbl: { fontSize: 11, color: '#888', marginTop: 2 },
  filterLabel: { color: '#4a9eff', fontSize: 13, fontWeight: 'bold', marginTop: 12, marginBottom: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: { backgroundColor: '#1a2a3a', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  chipActive: { backgroundColor: '#4a9eff' },
  chipText: { color: '#888', fontSize: 13 },
  chipTextActive: { color: '#fff', fontWeight: 'bold' },
  input: { backgroundColor: '#1a2a3a', color: '#fff', padding: 12, borderRadius: 10, fontSize: 15, marginBottom: 4 },
  dropdown: { backgroundColor: '#1a2a3a', padding: 14, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownSelected: { color: '#fff', fontSize: 15 },
  dropdownPlaceholder: { color: '#555', fontSize: 15 },
  dropdownArrow: { color: '#4a9eff', fontSize: 14 },
  dropdownList: { backgroundColor: '#1a2a3a', borderRadius: 10, marginTop: 4, overflow: 'hidden' },
  dropdownItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#0a1628' },
  dropdownItemText: { color: '#fff', fontSize: 15 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 12, marginBottom: 16 },
  clearBtn: { flex: 1, backgroundColor: '#1a2a3a', padding: 10, borderRadius: 8, alignItems: 'center' },
  clearBtnText: { color: '#e74c3c', fontSize: 14, fontWeight: 'bold' },
  refreshBtn: { flex: 1, backgroundColor: '#1a2a3a', padding: 10, borderRadius: 8, alignItems: 'center' },
  refreshText: { color: '#4a9eff', fontSize: 14, fontWeight: 'bold' },
  loading: { color: '#888', textAlign: 'center', marginTop: 40, fontSize: 16 },
  emptyBox: { backgroundColor: '#1a2a3a', borderRadius: 12, padding: 32, alignItems: 'center', marginTop: 20 },
  emptyText: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  emptySubtext: { color: '#888', fontSize: 14, textAlign: 'center' },
  card: { backgroundColor: '#1a2a3a', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  species: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  date: { color: '#888', fontSize: 13 },
  badge: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 10 },
  badgeText: { fontSize: 13, fontWeight: 'bold' },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  stat: { alignItems: 'center' },
  statLabel: { color: '#888', fontSize: 12, marginBottom: 4 },
  statValue: { color: '#4a9eff', fontSize: 14, fontWeight: 'bold' },
  cardDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 },
  detail: { color: '#aaa', fontSize: 13 },
  notes: { color: '#888', fontSize: 13, marginTop: 8, fontStyle: 'italic' },
  tapHint: { color: '#2a3a4a', fontSize: 11, textAlign: 'right', marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' },
  detailModal: { backgroundColor: '#0a1628', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '90%' },
  detailPhoto: { width: '100%', height: 220, borderRadius: 12, marginBottom: 16 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  detailSpecies: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  detailDate: { color: '#888', fontSize: 14 },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  detailItem: { width: '47%', backgroundColor: '#1a2a3a', borderRadius: 10, padding: 12 },
  detailLabel: { color: '#4a9eff', fontSize: 12, marginBottom: 4 },
  detailValue: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  detailNotes: { backgroundColor: '#1a2a3a', borderRadius: 10, padding: 16, marginBottom: 16 },
  detailNotesText: { color: '#aaa', fontSize: 14, fontStyle: 'italic', marginTop: 4 },
  actionBtnRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  editBtn: { flex: 1, backgroundColor: '#1a3a5a', borderWidth: 1, borderColor: '#4a9eff', padding: 14, borderRadius: 10, alignItems: 'center' },
  editBtnText: { color: '#4a9eff', fontSize: 16, fontWeight: 'bold' },
  deleteBtn: { flex: 1, backgroundColor: '#1a0a0a', borderWidth: 1, borderColor: '#e74c3c', padding: 14, borderRadius: 10, alignItems: 'center' },
  deleteBtnText: { color: '#e74c3c', fontSize: 16, fontWeight: 'bold' },
  confirmBox: { backgroundColor: '#1a2a3a', borderRadius: 12, padding: 16, marginBottom: 12 },
  confirmText: { color: '#fff', fontSize: 15, textAlign: 'center', marginBottom: 12 },
  confirmBtnRow: { flexDirection: 'row', gap: 12 },
  confirmCancelBtn: { flex: 1, backgroundColor: '#2a3a4a', padding: 12, borderRadius: 10, alignItems: 'center' },
  confirmCancelText: { color: '#fff', fontWeight: 'bold' },
  confirmDeleteBtn: { flex: 1, backgroundColor: '#e74c3c', padding: 12, borderRadius: 10, alignItems: 'center' },
  confirmDeleteText: { color: '#fff', fontWeight: 'bold' },
  closeBtn: { backgroundColor: '#4a9eff', padding: 16, borderRadius: 10, alignItems: 'center', marginBottom: 40 },
  closeBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  editTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  editLabel: { color: '#4a9eff', fontSize: 14, marginBottom: 6, marginTop: 12 },
  editInput: { backgroundColor: '#1a2a3a', color: '#fff', padding: 14, borderRadius: 10, fontSize: 16 },
  saveEditBtn: { backgroundColor: '#2ecc71', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 24 },
  saveEditBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cancelEditBtn: { backgroundColor: '#1a2a3a', borderWidth: 1, borderColor: '#888', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 10, marginBottom: 40 },
  cancelEditBtnText: { color: '#888', fontSize: 16, fontWeight: 'bold' },
});

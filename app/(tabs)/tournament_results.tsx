import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import { Image, Modal, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ViewShot, { captureRef } from 'react-native-view-shot';

interface Props {
  tournament: any;
  onClose: () => void;
}

export default function TournamentResults({ tournament, onClose }: Props) {
  const viewShotRef = useRef(null);
  const [catches, setCatches] = useState([]);
  const [bigFishPhoto, setBigFishPhoto] = useState(null);
  const [teamPhoto, setTeamPhoto] = useState(null);
  const [trophyPhoto, setTrophyPhoto] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tournament) loadCatches();
  }, [tournament]);

  async function loadCatches() {
    setLoading(true);
    const { data } = await supabase
      .from('catches')
      .select('*')
      .eq('is_tournament', true)
      .order('created_at', { ascending: false });
    if (data) setCatches(data);
    setLoading(false);
  }

  async function pickPhoto(setter) {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        alert('Please allow photo library access in your iPhone Settings to upload photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ 
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, 
        quality: 0.8 
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setter({ uri: result.assets[0].uri });
      }
    } catch (e) {
      alert('Error picking photo: ' + e.message);
    }
  }

  async function takePhoto(setter) {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
    if (!result.canceled) setter({ uri: result.assets[0].uri });
  }

  async function handleShare() {
    try {
      const uri = await captureRef(viewShotRef, { format: 'jpg', quality: 0.9 });
      await Share.share({ url: uri, message: 'ReelTrack Tournament Results 🎣🏆' });
    } catch (e) {
      // Fallback to text
      const text = buildShareText();
      await Share.share({ message: text });
    }
  }

  function buildShareText() {
    let text = '🏆 TOURNAMENT RESULTS\n';
    text += '━━━━━━━━━━━━━━━━━━\n';
    text += tournament.name + '\n';
    text += '🌊 ' + tournament.lake + '\n';
    text += '📅 ' + new Date(tournament.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) + '\n';
    text += '👤 ' + tournament.angler1 + (tournament.angler2 ? ' & ' + tournament.angler2 : '') + '\n';
    text += '━━━━━━━━━━━━━━━━━━\n';
    text += '🐟 Best 5 Bag: ' + best5Weight.toFixed(2) + ' lbs\n';
    if (bigFish) text += '🏅 Big Fish: ' + formatWeight(bigFish.weight_lb, bigFish.weight_oz) + '\n';
    text += '📊 Total Caught: ' + catches.length + '\n';
    text += '━━━━━━━━━━━━━━━━━━\n';
    best5.forEach((f, i) => {
      text += (i + 1) + '. ' + formatWeight(f.weight_lb, f.weight_oz);
      if (f.cull_tag) text += ' (Tag #' + f.cull_tag + ')';
      text += '\n';
    });
    text += '\nLogged with ReelTrack 🎣';
    return text;
  }

  function formatWeight(lb, oz) {
    if (!lb && !oz) return 'N/A';
    return lb + ' lb ' + oz + ' oz';
  }

  function getTotalLbs(fish) {
    return fish.reduce((sum, c) => sum + (c.weight_lb || 0) + (c.weight_oz || 0) / 16, 0);
  }

  const keptFish = catches.filter(c => c.cull_status === 'Keep');
  const best5 = [...keptFish]
    .sort((a, b) => ((b.weight_lb || 0) + (b.weight_oz || 0) / 16) - ((a.weight_lb || 0) + (a.weight_oz || 0) / 16))
    .slice(0, 5);
  const best5Weight = getTotalLbs(best5);
  const bigFish = best5[0] || null;

  return (
    <Modal visible={true} animationType="slide">
      <ScrollView style={styles.container}>

        <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }}>
        {/* Header */}
        <View style={styles.headerBand}>
          <Text style={styles.trophyEmoji}>🏆</Text>
          <Text style={styles.headerTitle}>TOURNAMENT RESULTS</Text>
          <Text style={styles.headerSub}>ReelTrack</Text>
        </View>

        {/* Tournament Info */}
        <View style={styles.infoBox}>
          <Text style={styles.tournamentName}>{tournament.name}</Text>
          <Text style={styles.infoDetail}>🌊 {tournament.lake}</Text>
          <Text style={styles.infoDetail}>📅 {new Date(tournament.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
          <Text style={styles.infoDetail}>👤 {tournament.angler1}{tournament.angler2 ? ' & ' + tournament.angler2 : ''}</Text>
        </View>

        {/* Big Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statBig}>{best5Weight.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Best 5 lbs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statBig, { color: '#f39c12' }]}>{formatWeight(bigFish?.weight_lb, bigFish?.weight_oz)}</Text>
            <Text style={styles.statLabel}>Big Fish</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statBig, { color: '#4a9eff' }]}>{catches.length}</Text>
            <Text style={styles.statLabel}>Total Caught</Text>
          </View>
        </View>

        {/* Best 5 Fish */}
        {best5.length > 0 && (
          <View style={styles.best5Box}>
            <Text style={styles.sectionTitle}>🐟 Best 5 Fish</Text>
            {best5.map((f, i) => (
              <View key={f.id} style={styles.fishRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.fishRank}>#{i + 1}</Text>
                  <Text style={styles.fishWeight}>{formatWeight(f.weight_lb, f.weight_oz)}</Text>
                </View>
                {f.lure && <Text style={styles.fishLure}>{f.lure}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Photos */}
        <View style={styles.photosSection}>
          <Text style={styles.sectionTitle}>📸 Photos</Text>
          <View style={styles.photosRow}>
            <View style={styles.photoSlot}>
              {bigFishPhoto ? (
                <Image source={bigFishPhoto} style={styles.photoSlotImg} />
              ) : bigFish?.photo_url ? (
                <Image source={{ uri: bigFish.photo_url }} style={styles.photoSlotImg} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoPlaceholderText}>🐟</Text>
                  <Text style={styles.photoPlaceholderLabel}>Big Fish</Text>
                </View>
              )}
            </View>
            <View style={styles.photoSlot}>
              {teamPhoto ? (
                <Image source={teamPhoto} style={styles.photoSlotImg} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoPlaceholderText}>🤙</Text>
                  <Text style={styles.photoPlaceholderLabel}>Team Photo</Text>
                </View>
              )}
            </View>
            <View style={styles.photoSlot}>
              {trophyPhoto ? (
                <Image source={trophyPhoto} style={styles.photoSlotImg} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoPlaceholderText}>🏆</Text>
                  <Text style={styles.photoPlaceholderLabel}>Trophy</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        </ViewShot>

        {/* Photo Buttons */}
        <View style={styles.photoButtons}>
          <Text style={styles.photoButtonsTitle}>Add Photos</Text>

          <Text style={styles.photoSlotLabel}>🐟 Big Fish Photo</Text>
          <View style={styles.photoButtonRow}>
            <TouchableOpacity style={styles.photoAddBtn} onPress={() => pickPhoto(setBigFishPhoto)}>
              <Text style={styles.photoAddBtnText}>📁 Upload</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoAddBtn} onPress={() => takePhoto(setBigFishPhoto)}>
              <Text style={styles.photoAddBtnText}>📷 Take Photo</Text>
            </TouchableOpacity>
            {bigFishPhoto && <TouchableOpacity style={styles.photoRemoveBtn} onPress={() => setBigFishPhoto(null)}>
              <Text style={styles.photoRemoveBtnText}>✕</Text>
            </TouchableOpacity>}
          </View>

          <Text style={styles.photoSlotLabel}>🤙 Team / Holding Fish Photo</Text>
          <View style={styles.photoButtonRow}>
            <TouchableOpacity style={styles.photoAddBtn} onPress={() => pickPhoto(setTeamPhoto)}>
              <Text style={styles.photoAddBtnText}>📁 Upload</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoAddBtn} onPress={() => takePhoto(setTeamPhoto)}>
              <Text style={styles.photoAddBtnText}>📷 Take Photo</Text>
            </TouchableOpacity>
            {teamPhoto && <TouchableOpacity style={styles.photoRemoveBtn} onPress={() => setTeamPhoto(null)}>
              <Text style={styles.photoRemoveBtnText}>✕</Text>
            </TouchableOpacity>}
          </View>

          <Text style={styles.photoSlotLabel}>🏆 Trophy Photo</Text>
          <View style={styles.photoButtonRow}>
            <TouchableOpacity style={styles.photoAddBtn} onPress={() => pickPhoto(setTrophyPhoto)}>
              <Text style={styles.photoAddBtnText}>📁 Upload</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoAddBtn} onPress={() => takePhoto(setTrophyPhoto)}>
              <Text style={styles.photoAddBtnText}>📷 Take Photo</Text>
            </TouchableOpacity>
            {trophyPhoto && <TouchableOpacity style={styles.photoRemoveBtn} onPress={() => setTrophyPhoto(null)}>
              <Text style={styles.photoRemoveBtnText}>✕</Text>
            </TouchableOpacity>}
          </View>

        </View>

        {/* Footer branding */}
        <View style={styles.footerBand}>
          <Text style={styles.footerText}>REEL</Text>
          <Text style={[styles.footerText, { color: '#4a9eff' }]}>TRACK</Text>
          <Text style={styles.footerTagline}>  |  Log. Analyze. Dominate.</Text>
        </View>

        {/* Share Button */}
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Text style={styles.shareBtnText}>📤 Share Results</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>Close</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628' },
  headerBand: { backgroundColor: '#1a2a3a', padding: 24, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: '#f39c12' },
  trophyEmoji: { fontSize: 40, marginBottom: 8 },
  headerTitle: { color: '#f39c12', fontSize: 22, fontWeight: '900', letterSpacing: 3 },
  headerSub: { color: '#4a9eff', fontSize: 14, marginTop: 4, letterSpacing: 6 },
  infoBox: { backgroundColor: '#1a2a3a', margin: 16, borderRadius: 12, padding: 16, borderLeftWidth: 4, borderLeftColor: '#2ecc71' },
  tournamentName: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  infoDetail: { color: '#aaa', fontSize: 15, marginBottom: 4 },
  statsRow: { flexDirection: 'row', padding: 16, gap: 8 },
  statCard: { flex: 1, backgroundColor: '#1a2a3a', borderRadius: 12, padding: 12, alignItems: 'center' },
  statBig: { fontSize: 22, fontWeight: 'bold', color: '#2ecc71' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 4, textAlign: 'center' },
  best5Box: { backgroundColor: '#1a2a3a', margin: 16, borderRadius: 12, padding: 16 },
  sectionTitle: { color: '#4a9eff', fontSize: 14, fontWeight: 'bold', marginBottom: 12, letterSpacing: 1 },
  fishRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#0a1628' },
  fishRowTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  fishLine: { color: '#2ecc71', fontSize: 15, fontWeight: 'bold' },
  fishRank: { color: '#f39c12', fontSize: 15, fontWeight: 'bold', width: 28 },  
  fishTag: { color: '#4a9eff', fontSize: 12, backgroundColor: '#0a1628', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  fishWeight: { color: '#2ecc71', fontSize: 15, fontWeight: 'bold' },
  fishLure: { color: '#888', fontSize: 12, marginTop: 2, marginLeft: 28 },
  photosSection: { margin: 16 },
  photosRow: { flexDirection: 'row', gap: 8 },
  photoSlot: { flex: 1, aspectRatio: 1, borderRadius: 10, overflow: 'hidden' },
  photoSlotImg: { width: '100%', height: '100%' },
  photoPlaceholder: { flex: 1, backgroundColor: '#1a2a3a', alignItems: 'center', justifyContent: 'center', borderRadius: 10, aspectRatio: 1, padding: 8 },
  photoPlaceholderText: { fontSize: 28 },
  photoPlaceholderLabel: { color: '#555', fontSize: 11, marginTop: 4, textAlign: 'center' },
  photoButtons: { margin: 16, backgroundColor: '#1a2a3a', borderRadius: 12, padding: 16 },
  photoButtonsTitle: { color: '#4a9eff', fontSize: 14, fontWeight: 'bold', marginBottom: 12 },
  photoButtonRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  photoAddBtn: { flex: 1, backgroundColor: '#0a1628', padding: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#2a3a4a' },
  photoAddBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  footerBand: { backgroundColor: '#1a2a3a', padding: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', margin: 16, borderRadius: 12 },
  footerText: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 2 },
  footerTagline: { color: '#555', fontSize: 13, fontStyle: 'italic' },
  shareBtn: { backgroundColor: '#f39c12', margin: 16, padding: 16, borderRadius: 12, alignItems: 'center' },
  shareBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  closeBtn: { backgroundColor: '#1a2a3a', margin: 16, marginTop: 0, padding: 14, borderRadius: 12, alignItems: 'center' },
  closeBtnText: { color: '#888', fontSize: 16 },
  photoSlotLabel: { color: '#4a9eff', fontSize: 13, fontWeight: 'bold', marginBottom: 6, marginTop: 8 },
  photoRemoveBtn: { backgroundColor: '#e74c3c', width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  photoRemoveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  shareNote: { color: '#888', fontSize: 12, textAlign: 'center', marginTop: 12, fontStyle: 'italic' },
});

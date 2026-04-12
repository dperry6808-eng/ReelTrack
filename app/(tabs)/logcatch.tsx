import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import { Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function LogCatchScreen() {
  const scrollRef = useRef<ScrollView>(null);

  const [species, setSpecies] = useState("");
  const [weightLb, setWeightLb] = useState("");
  const [weightOz, setWeightOz] = useState("");
  const [length, setLength] = useState("");
  const [lake, setLake] = useState("");
  const [notes, setNotes] = useState("");
  const [weather, setWeather] = useState("");
  const [waterClarity, setWaterClarity] = useState("");
  const [waterTemp, setWaterTemp] = useState("");
  const [depth, setDepth] = useState("");
  const [structure, setStructure] = useState("");
  const [photo, setPhoto] = useState(null);
  const [gps, setGps] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedOffline, setSavedOffline] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const [lure, setLure] = useState("");
  const [lures, setLures] = useState([]);
  const [showLureDropdown, setShowLureDropdown] = useState(false);
  const [showNewLure, setShowNewLure] = useState(false);
  const [lureMake, setLureMake] = useState("");
  const [lureModel, setLureModel] = useState("");
  const [lureWeight, setLureWeight] = useState("");
  const [lureColor, setLureColor] = useState("");

  const [lakes, setLakes] = useState([]);
  const [showLakeDropdown, setShowLakeDropdown] = useState(false);
  const [showNewLake, setShowNewLake] = useState(false);
  const [newLake, setNewLake] = useState("");

  const [speciesList, setSpeciesList] = useState([]);
  const [showSpeciesDropdown, setShowSpeciesDropdown] = useState(false);
  const [showNewSpecies, setShowNewSpecies] = useState(false);
  const [newSpecies, setNewSpecies] = useState("");

  const [isTournament, setIsTournament] = useState(false);
  const [minLength, setMinLength] = useState("12");
  const [livewell, setLivewell] = useState([]);
  const [cullMessage, setCullMessage] = useState("");
  const [cullMessageColor, setCullMessageColor] = useState("#4a9eff");
  const [showCullModal, setShowCullModal] = useState(false);
  const [showResetWarning, setShowResetWarning] = useState(false);
  const [catchTime, setCatchTime] = useState("");
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [windSpeed, setWindSpeed] = useState("");
  const [waterLevel, setWaterLevel] = useState("");
  const [waterLevelFeet, setWaterLevelFeet] = useState("");
  const [waterLevelDir, setWaterLevelDir] = useState("Normal");

  const limit = 5;
  const weatherOptions = ["Sunny", "Partly Cloudy", "Cloudy", "Rainy", "Foggy", "Windy"];
  const depthOptions = ["0-5 ft", "5-10 ft", "10-15 ft", "15-20 ft", "20-30 ft", "30+ ft"];
  const structureOptions = ["Flats", "Points", "Ledges", "Stumps", "Brush Pile", "Rocks", "Riprap", "Dock", "Creek Channel", "Open Water"];

  useEffect(() => {
    loadLures();
    loadLakes();
    loadSpeciesList();
    loadActiveTournament();
    checkPendingCount();
    restoreLivewell();

    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isConnected && state.isInternetReachable;
      setIsOnline(!!online);
      if (online) syncPendingCatches();
    });

    return () => unsubscribe();
  }, []);

  // Save livewell to storage whenever it changes
  useEffect(() => {
    if (livewell.length > 0) {
      AsyncStorage.setItem('saved_livewell', JSON.stringify(livewell));
      AsyncStorage.setItem('saved_tournament_mode', 'true');
    }
  }, [livewell]);

  async function restoreLivewell() {
    try {
      const savedLivewell = await AsyncStorage.getItem('saved_livewell');
      const savedTournament = await AsyncStorage.getItem('saved_tournament_mode');
      if (savedLivewell && savedTournament === 'true') {
        const parsed = JSON.parse(savedLivewell);
        if (parsed.length > 0) {
          setLivewell(parsed);
          setIsTournament(true);
        }
      }
    } catch (e) {}
  }

  async function clearSavedLivewell() {
    await AsyncStorage.removeItem('saved_livewell');
    await AsyncStorage.removeItem('saved_tournament_mode');
  }

  async function checkPendingCount() {
    try {
      const pending = await AsyncStorage.getItem('pending_catches');
      const arr = pending ? JSON.parse(pending) : [];
      setPendingCount(arr.length);
    } catch (e) {}
  }

  async function syncPendingCatches() {
    try {
      const pending = await AsyncStorage.getItem('pending_catches');
      if (!pending) return;
      const arr = JSON.parse(pending);
      if (arr.length === 0) return;
      setSyncing(true);
      const failed = [];
      for (const catch_ of arr) {
        const { error } = await supabase.from('catches').insert(catch_);
        if (error) failed.push(catch_);
      }
      await AsyncStorage.setItem('pending_catches', JSON.stringify(failed));
      setPendingCount(failed.length);
      setSyncing(false);
      if (failed.length === 0 && arr.length > 0) alert(arr.length + ' offline catch(es) synced successfully!');
    } catch (e) { setSyncing(false); }
  }

  async function loadLures() {
    const { data } = await supabase.from("Lure").select("*").order("name");
    if (data) setLures(data);
  }

  async function loadLakes() {
    const { data } = await supabase.from("lakes").select("*").order("name");
    if (data) setLakes(data);
  }

  async function loadSpeciesList() {
    const { data } = await supabase.from("species_list").select("*").order("name");
    if (data) setSpeciesList(data);
  }

  async function loadActiveTournament() {
    const { data } = await supabase.from('tournaments').select('*').eq('is_active', true).limit(1);
    if (data && data.length > 0) {
      const t = data[0];
      setIsTournament(true);
      setMinLength(String(t.min_length || 12));
      setLake(t.lake || '');
    }
  }

  function buildLureName() {
    return [lureMake, lureModel, lureWeight, lureColor].filter(p => p.trim() !== "").join(" ");
  }

  async function saveNewLure() {
    const lureName = buildLureName();
    if (!lureName) { alert("Please enter at least one lure detail"); return; }
    const { error } = await supabase.from("Lure").insert({ name: lureName });
    if (error) { alert("Error saving lure: " + error.message); return; }
    setLure(lureName);
    setLureMake(""); setLureModel(""); setLureWeight(""); setLureColor("");
    setShowNewLure(false); setShowLureDropdown(false);
    loadLures();
  }

  async function saveNewLake() {
    if (!newLake.trim()) { alert("Please enter a lake name"); return; }
    const { error } = await supabase.from("lakes").insert({ name: newLake.trim() });
    if (error) { alert("Error saving lake: " + error.message); return; }
    setLake(newLake.trim());
    setNewLake(""); setShowNewLake(false); setShowLakeDropdown(false);
    loadLakes();
  }

  async function saveNewSpecies() {
    if (!newSpecies.trim()) { alert("Please enter a species name"); return; }
    const { error } = await supabase.from("species_list").insert({ name: newSpecies.trim() });
    if (error) { alert("Error saving species: " + error.message); return; }
    setSpecies(newSpecies.trim());
    setNewSpecies(""); setShowNewSpecies(false); setShowSpeciesDropdown(false);
    loadSpeciesList();
  }

  function closeAllDropdowns() {
    setShowLureDropdown(false); setShowLakeDropdown(false); setShowSpeciesDropdown(false);
    setShowNewLure(false); setShowNewLake(false); setShowNewSpecies(false);
  }

  function getTotalWeight(fish) { return fish.reduce((sum, f) => sum + f.lb + f.oz / 16, 0); }

  function getLightest(fish) {
    return fish.reduce((min, f) => {
      const w = f.lb + f.oz / 16;
      return w < min.weight ? { fish: f, weight: w } : min;
    }, { fish: fish[0], weight: fish[0].lb + fish[0].oz / 16 });
  }

  function runCullLogic(lb, oz, len) {
    const min = parseFloat(minLength) || 12;
    if (len > 0 && len < min) return { message: "Too short!\nMust release this fish.", color: "#e74c3c", action: "release", releaseReason: "Too Short", tag: null };
    if (livewell.length < limit) {
      const tag = livewell.length + 1;
      return { message: "Keep it!\nAssign Cull Tag #" + tag, color: "#2ecc71", action: "keep", releaseReason: null, tag };
    } else {
      const newWeight = lb + oz / 16;
      const lightest = getLightest(livewell);
      if (newWeight > lightest.weight) return { message: "Cull Tag #" + lightest.fish.tag + "\nReplace it!\nKeep new fish.", color: "#f39c12", action: "cull", releaseReason: null, tag: lightest.fish.tag };
      else return { message: "Too light!\nRelease this fish.\nKeep your current bag.", color: "#e74c3c", action: "release", releaseReason: "Too Light", tag: null };
    }
  }

  function clearForm() { 
    setWeightLb(""); setWeightOz(""); setLength(""); 
    setNotes(""); setPhoto(null); setGps(null);
    setCatchTime(""); setUseCustomTime(false);
  }

  function clearFullForm() {
    setWeightLb(""); setWeightOz(""); setLength(""); setNotes(""); setPhoto(null); setGps(null);
    setWeather(""); setWaterClarity(""); setDepth(""); setStructure("");
    setLure(""); setSpecies(""); setLake("");
    setWindSpeed(""); setWaterLevel(""); setWaterLevelFeet(""); setWaterLevelDir("Normal");
  }

  function handleTournamentToggle() {
    if (isTournament && livewell.length > 0) { setShowResetWarning(true); }
    else { setIsTournament(!isTournament); setLivewell([]); setCullMessage(""); }
  }

  function confirmResetLivewell() { 
    setShowResetWarning(false); setIsTournament(false); 
    setLivewell([]); setCullMessage(""); 
    clearSavedLivewell();
  }

  function handleOzChange(val) {
    const num = parseInt(val);
    if (val === "") { setWeightOz(""); return; }
    if (!isNaN(num) && num >= 0 && num <= 15) setWeightOz(String(num));
  }

  async function captureGPS() {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.granted) {
        const location = await Location.getCurrentPositionAsync({});
        setGps({ lat: location.coords.latitude, lng: location.coords.longitude });
      }
    } catch (e) {}
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) { alert("Camera permission required!"); return; }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.8 });
    if (!result.canceled) { setPhoto({ uri: result.assets[0].uri }); captureGPS(); }
  }

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { alert("Photo library permission required!"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.8 });
    if (!result.canceled) { setPhoto({ uri: result.assets[0].uri }); captureGPS(); }
  }

  async function uploadPhoto(uri) {
    try {
      setUploading(true);
      const filename = "catch_" + Date.now() + ".jpg";
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: "base64" });
      const byteCharacters = atob(base64);
      const byteArray = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) byteArray[i] = byteCharacters.charCodeAt(i);
      const { data, error } = await supabase.storage.from("catch-photos").upload(filename, byteArray, { contentType: "image/jpeg", upsert: true });
      setUploading(false);
      if (error) return null;
      const { data: urlData } = supabase.storage.from("catch-photos").getPublicUrl(filename);
      return urlData.publicUrl;
    } catch (e) { setUploading(false); return null; }
  }

  async function handleSave() {
    const lb = parseFloat(weightLb) || 0;
    const oz = parseFloat(weightOz) || 0;
    const len = parseFloat(length) || 0;
    if (!lb && !len) { alert("Please enter at least a weight or length"); return; }

    closeAllDropdowns();

    let cullStatus = null, cullTag = null, releaseReason = null;
    let newLivewell = [...livewell];

    if (isTournament) {
      const cull = runCullLogic(lb, oz, len);
      setCullMessage(cull.message); setCullMessageColor(cull.color); setShowCullModal(true);
      if (cull.action === "release") { cullStatus = "Release"; releaseReason = cull.releaseReason; }
      else if (cull.action === "keep") { cullStatus = "Keep"; cullTag = cull.tag; newLivewell = [...livewell, { lb, oz, tag: cull.tag }]; setLivewell(newLivewell); }
      else if (cull.action === "cull") { cullStatus = "Keep"; cullTag = cull.tag; newLivewell = livewell.map(f => f.tag === cull.tag ? { lb, oz, tag: cull.tag } : f); setLivewell(newLivewell); }
    }

    let photoUrl = null;
    if (photo && isOnline) photoUrl = await uploadPhoto(photo.uri);

    clearForm();

    // Use custom time if entered, otherwise use now
    let localISO;
    if (useCustomTime && catchTime) {
      const today = new Date();
      const [time, period] = catchTime.split(' ');
      const [hours, minutes] = time.split(':');
      let h = parseInt(hours);
      if (period === 'PM' && h !== 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;
      today.setHours(h, parseInt(minutes) || 0, 0, 0);
      localISO = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString();
    } else {
      const now = new Date();
      localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString();
    }

    const catchData = {
      species, weight_lb: lb, weight_oz: oz, length: len, lure, lake, notes, weather,
      water_clarity: waterClarity, water_temp: waterTemp, depth, structure,
      wind_speed: windSpeed, water_level: waterLevel,
      latitude: gps ? gps.lat : null, longitude: gps ? gps.lng : null,
      is_tournament: isTournament, cull_status: cullStatus, cull_tag: cullTag,
      release_reason: releaseReason, photo_url: photoUrl, created_at: localISO,
    };

    if (isOnline) {
      setSaving(true);
      const { error } = await supabase.from("catches").insert(catchData);
      setSaving(false);
      if (error) alert("Error saving catch: " + error.message);
      else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    } else {
      try {
        const pending = await AsyncStorage.getItem('pending_catches');
        const arr = pending ? JSON.parse(pending) : [];
        arr.push(catchData);
        await AsyncStorage.setItem('pending_catches', JSON.stringify(arr));
        setPendingCount(arr.length);
        setSavedOffline(true);
        setTimeout(() => setSavedOffline(false), 3000);
      } catch (e) { alert("Error saving offline: " + e.message); }
    }
  }

  function handleGotIt() {
    setShowCullModal(false);
    setTimeout(() => { scrollRef.current?.scrollTo({ y: 0, animated: true }); }, 100);
  }

  const total = getTotalWeight(livewell).toFixed(2);

  return (
    <ScrollView style={styles.container} ref={scrollRef} scrollEventThrottle={16}>

      <Modal visible={showCullModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { borderColor: cullMessageColor }]}>
            <Text style={styles.modalTitle}>Cull Decision</Text>
            <Text style={[styles.modalMessage, { color: cullMessageColor }]}>{cullMessage}</Text>
            <Text style={styles.modalSub}>Livewell: {livewell.length}/{limit} fish — {total} lbs</Text>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: cullMessageColor }]} onPress={handleGotIt}>
              <Text style={styles.modalBtnText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showResetWarning} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { borderColor: "#e74c3c" }]}>
            <Text style={styles.modalTitle}>Warning!</Text>
            <Text style={[styles.modalMessage, { color: "#e74c3c", fontSize: 20 }]}>
              Turning off Tournament Mode will erase your livewell!{"\n\n"}Are you sure?
            </Text>
            <Text style={styles.modalSub}>You have {livewell.length} fish — {total} lbs</Text>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={[styles.modalHalfBtn, { backgroundColor: "#2a3a4a" }]} onPress={() => setShowResetWarning(false)}>
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalHalfBtn, { backgroundColor: "#e74c3c" }]} onPress={confirmResetLivewell}>
                <Text style={styles.modalBtnText}>Yes, Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Text style={styles.header}>Log a Catch</Text>

      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>📵 Offline — catches will sync when connected</Text>
        </View>
      )}

      {isOnline && pendingCount > 0 && (
        <TouchableOpacity style={styles.syncBanner} onPress={syncPendingCatches}>
          <Text style={styles.syncBannerText}>{syncing ? "⏳ Syncing..." : "🔄 " + pendingCount + " offline catch(es) waiting — tap to sync"}</Text>
        </TouchableOpacity>
      )}

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Tournament Mode</Text>
        <TouchableOpacity style={[styles.toggleBtn, isTournament && styles.toggleBtnActive]} onPress={handleTournamentToggle}>
          <Text style={styles.toggleBtnText}>{isTournament ? "ON" : "OFF"}</Text>
        </TouchableOpacity>
      </View>

      {isTournament && (
        <View style={styles.livewellBar}>
          <Text style={styles.livewellBarText}>Livewell: {livewell.length}/{limit} fish — {total} lbs</Text>
          <Text style={styles.label}>Min Length (inches)</Text>
          <TextInput style={styles.input} value={minLength} onChangeText={setMinLength} keyboardType="numeric" placeholderTextColor="#555" />
          {livewell.length > 0 && (
            <View style={styles.livewellList}>
              {livewell.map(f => (
                <View key={f.tag} style={styles.fishRow}>
                  <Text style={styles.fishTag}>Tag #{f.tag}</Text>
                  <Text style={styles.fishWeight}>{f.lb} lb {f.oz} oz</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {saved && <View style={styles.successBox}><Text style={styles.successText}>✅ Fish saved!</Text></View>}
      {savedOffline && <View style={styles.offlineBox}><Text style={styles.offlineBoxText}>📵 Saved offline — will sync when connected</Text></View>}

      <Text style={styles.label}>Photo</Text>
      <View style={styles.photoRow}>
        <TouchableOpacity style={styles.photoBtn} onPress={pickPhoto}><Text style={styles.photoBtnText}>Choose Photo</Text></TouchableOpacity>
        <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}><Text style={styles.photoBtnText}>Take Photo</Text></TouchableOpacity>
      </View>
      {photo && (
        <View>
          <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
          <TouchableOpacity style={styles.clearPhotoBtn} onPress={() => { setPhoto(null); setGps(null); }}>
            <Text style={styles.clearPhotoBtnText}>✕ Remove Photo</Text>
          </TouchableOpacity>
        </View>
      )}
      {uploading && <Text style={styles.uploadingText}>Uploading photo...</Text>}
      {gps && <View style={styles.gpsBox}><Text style={styles.gpsText}>GPS: {gps.lat.toFixed(4)}, {gps.lng.toFixed(4)}</Text></View>}

      <Text style={styles.label}>Weight (lbs)</Text>
      <TextInput style={styles.input} placeholder="Pounds" placeholderTextColor="#555" value={weightLb} onChangeText={setWeightLb} keyboardType="numeric" />

      <Text style={styles.label}>Weight (oz) — 0 to 15</Text>
      <TextInput style={styles.input} placeholder="Ounces (0-15)" placeholderTextColor="#555" value={weightOz} onChangeText={handleOzChange} keyboardType="numeric" />

      <Text style={styles.label}>Length (inches)</Text>
      <TextInput style={styles.input} placeholder="Length" placeholderTextColor="#555" value={length} onChangeText={setLength} keyboardType="numeric" />

      <Text style={styles.label}>Species</Text>
      <TouchableOpacity style={styles.dropdown} onPress={() => { const next = !showSpeciesDropdown; closeAllDropdowns(); setShowSpeciesDropdown(next); }}>
        <Text style={species ? styles.dropdownSelected : styles.dropdownPlaceholder}>{species || "Select species..."}</Text>
        <Text style={styles.dropdownArrow}>{showSpeciesDropdown ? "▲" : "▼"}</Text>
      </TouchableOpacity>
      {showSpeciesDropdown && (
        <View style={styles.dropdownList}>
          <TouchableOpacity style={styles.dropdownItem} onPress={() => setShowNewSpecies(!showNewSpecies)}>
            <Text style={[styles.dropdownItemText, { color: "#4a9eff" }]}>+ Add New Species</Text>
          </TouchableOpacity>
          {showNewSpecies && (
            <View style={styles.inlineAdd}>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Species name..." placeholderTextColor="#555" value={newSpecies} onChangeText={setNewSpecies} autoFocus />
              <TouchableOpacity style={styles.inlineAddBtn} onPress={saveNewSpecies}><Text style={styles.inlineAddBtnText}>Save</Text></TouchableOpacity>
            </View>
          )}
          {speciesList.map(s => (
            <TouchableOpacity key={s.id} style={styles.dropdownItem} onPress={() => { setSpecies(s.name); setShowSpeciesDropdown(false); setShowNewSpecies(false); }}>
              <Text style={styles.dropdownItemText}>{s.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.label}>Lake Name</Text>
      <TouchableOpacity style={styles.dropdown} onPress={() => { const next = !showLakeDropdown; closeAllDropdowns(); setShowLakeDropdown(next); }}>
        <Text style={lake ? styles.dropdownSelected : styles.dropdownPlaceholder}>{lake || "Select lake..."}</Text>
        <Text style={styles.dropdownArrow}>{showLakeDropdown ? "▲" : "▼"}</Text>
      </TouchableOpacity>
      {showLakeDropdown && (
        <View style={styles.dropdownList}>
          <TouchableOpacity style={styles.dropdownItem} onPress={() => setShowNewLake(!showNewLake)}>
            <Text style={[styles.dropdownItemText, { color: "#4a9eff" }]}>+ Add New Lake</Text>
          </TouchableOpacity>
          {showNewLake && (
            <View style={styles.inlineAdd}>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Lake name..." placeholderTextColor="#555" value={newLake} onChangeText={setNewLake} autoFocus />
              <TouchableOpacity style={styles.inlineAddBtn} onPress={saveNewLake}><Text style={styles.inlineAddBtnText}>Save</Text></TouchableOpacity>
            </View>
          )}
          {lakes.map(l => (
            <TouchableOpacity key={l.id} style={styles.dropdownItem} onPress={() => { setLake(l.name); setShowLakeDropdown(false); setShowNewLake(false); }}>
              <Text style={styles.dropdownItemText}>{l.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.label}>Lure Used</Text>
      <TouchableOpacity style={styles.dropdown} onPress={() => { const next = !showLureDropdown; closeAllDropdowns(); setShowLureDropdown(next); }}>
        <Text style={lure ? styles.dropdownSelected : styles.dropdownPlaceholder}>{lure || "Select lure..."}</Text>
        <Text style={styles.dropdownArrow}>{showLureDropdown ? "▲" : "▼"}</Text>
      </TouchableOpacity>
      {showLureDropdown && (
        <View style={styles.dropdownList}>
          <TouchableOpacity style={styles.dropdownItem} onPress={() => setShowNewLure(!showNewLure)}>
            <Text style={[styles.dropdownItemText, { color: "#4a9eff" }]}>+ Add New Lure</Text>
          </TouchableOpacity>
          {showNewLure && (
            <View style={styles.newLureBox}>
              <TextInput style={styles.input} placeholder="Make (e.g. Zoom)" placeholderTextColor="#555" value={lureMake} onChangeText={setLureMake} />
              <TextInput style={[styles.input, { marginTop: 8 }]} placeholder="Model (e.g. ZCraw)" placeholderTextColor="#555" value={lureModel} onChangeText={setLureModel} />
              <TextInput style={[styles.input, { marginTop: 8 }]} placeholder="Weight (e.g. 3/8 oz)" placeholderTextColor="#555" value={lureWeight} onChangeText={setLureWeight} />
              <TextInput style={[styles.input, { marginTop: 8 }]} placeholder="Color (e.g. Green Pumpkin)" placeholderTextColor="#555" value={lureColor} onChangeText={setLureColor} />
              {buildLureName() !== "" && <Text style={styles.lurePreview}>Will save as: "{buildLureName()}"</Text>}
              <TouchableOpacity style={styles.saveLureBtn} onPress={saveNewLure}><Text style={styles.saveLureBtnText}>Save Lure</Text></TouchableOpacity>
            </View>
          )}
          {lures.map(l => (
            <TouchableOpacity key={l.id} style={styles.dropdownItem} onPress={() => { setLure(l.name); setShowLureDropdown(false); setShowNewLure(false); }}>
              <Text style={styles.dropdownItemText}>{l.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.label}>Water Temp (F)</Text>
      <TextInput style={styles.input} placeholder="e.g. 68" placeholderTextColor="#555" value={waterTemp} onChangeText={setWaterTemp} keyboardType="numeric" />

      <Text style={styles.label}>Wind Speed (mph)</Text>
      <TextInput style={styles.input} placeholder="e.g. 10" placeholderTextColor="#555" value={windSpeed} onChangeText={setWindSpeed} keyboardType="numeric" />

      <Text style={styles.label}>Water Level</Text>
      <View style={styles.chipRow}>
        {["Normal", "Steady"].map(w => (
          <TouchableOpacity key={w} style={[styles.chip, waterLevelDir === w && styles.chipActive]} onPress={() => {
            setWaterLevelDir(w); setWaterLevelFeet("");
            setWaterLevel(w);
          }}>
            <Text style={[styles.chipText, waterLevelDir === w && styles.chipTextActive]}>{w}</Text>
          </TouchableOpacity>
        ))}
        {["Rising", "Falling"].map(w => (
          <TouchableOpacity key={w} style={[styles.chip, waterLevelDir === w && styles.chipActive]} onPress={() => {
            setWaterLevelDir(w);
            setWaterLevel(waterLevelFeet ? waterLevelFeet + "' " + w : w);
          }}>
            <Text style={[styles.chipText, waterLevelDir === w && styles.chipTextActive]}>{w}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.waterLevelRow}>
        <TouchableOpacity style={[styles.chip, waterLevelDir === "Low" && styles.chipActive]} onPress={() => {
          setWaterLevelDir("Low");
          setWaterLevel(waterLevelFeet ? waterLevelFeet + "' Low" : "Low");
        }}>
          <Text style={[styles.chipText, waterLevelDir === "Low" && styles.chipTextActive]}>Low</Text>
        </TouchableOpacity>
        <TextInput
          style={[styles.input, styles.waterLevelInput]}
          placeholder="0.0"
          placeholderTextColor="#555"
          value={waterLevelFeet}
          onChangeText={val => {
            setWaterLevelFeet(val);
            setWaterLevel(val ? val + "' " + waterLevelDir : waterLevelDir);
          }}
          keyboardType="numeric"
        />
        <Text style={styles.waterLevelFt}>ft</Text>
        <TouchableOpacity style={[styles.chip, waterLevelDir === "High" && styles.chipActive]} onPress={() => {
          setWaterLevelDir("High");
          setWaterLevel(waterLevelFeet ? waterLevelFeet + "' High" : "High");
        }}>
          <Text style={[styles.chipText, waterLevelDir === "High" && styles.chipTextActive]}>High</Text>
        </TouchableOpacity>
      </View>
      {waterLevel ? <Text style={styles.waterLevelPreview}>Saving as: {waterLevel}</Text> : null}

      <Text style={styles.label}>Water Clarity</Text>
      <View style={styles.chipRow}>
        {["Muddy <1ft", "Stained 1-4ft", "Clear >4ft"].map(c => (
          <TouchableOpacity key={c} style={[styles.chip, waterClarity === c && styles.chipActive]} onPress={() => setWaterClarity(c)}>
            <Text style={[styles.chipText, waterClarity === c && styles.chipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Water Depth</Text>
      <View style={styles.chipRow}>
        {depthOptions.map(d => (
          <TouchableOpacity key={d} style={[styles.chip, depth === d && styles.chipActive]} onPress={() => setDepth(d)}>
            <Text style={[styles.chipText, depth === d && styles.chipTextActive]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Structure</Text>
      <View style={styles.chipRow}>
        {structureOptions.map(s => (
          <TouchableOpacity key={s} style={[styles.chip, structure === s && styles.chipActive]} onPress={() => setStructure(s)}>
            <Text style={[styles.chipText, structure === s && styles.chipTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Weather</Text>
      <View style={styles.chipRow}>
        {weatherOptions.map(w => (
          <TouchableOpacity key={w} style={[styles.chip, weather === w && styles.chipActive]} onPress={() => setWeather(w)}>
            <Text style={[styles.chipText, weather === w && styles.chipTextActive]}>{w}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Notes</Text>
      <TextInput style={[styles.input, styles.notesInput]} placeholder="Notes..." placeholderTextColor="#555" value={notes} onChangeText={setNotes} multiline />

      {/* Manual Time Entry - for back-entering fish */}
      <View style={styles.timeRow}>
        <Text style={styles.label}>Back-Enter Time?</Text>
        <TouchableOpacity
          style={[styles.toggleBtn, useCustomTime && styles.toggleBtnActive]}
          onPress={() => setUseCustomTime(!useCustomTime)}
        >
          <Text style={styles.toggleBtnText}>{useCustomTime ? "ON" : "OFF"}</Text>
        </TouchableOpacity>
      </View>
      {useCustomTime && (
        <View style={styles.timePickerBox}>
          <Text style={styles.timeHint}>Select the time you actually caught this fish</Text>
          <View style={styles.timePickerRow}>
            <TextInput
              style={[styles.input, styles.timeHourInput]}
              placeholder="Hour"
              placeholderTextColor="#555"
              value={catchTime.split(':')[0] || ""}
              onChangeText={val => {
                const mins = catchTime.includes(':') ? catchTime.split(':')[1] : ' AM';
                setCatchTime(val + ':' + mins);
              }}
              keyboardType="numeric"
              maxLength={2}
            />
            <Text style={styles.timeColon}>:</Text>
            <TextInput
              style={[styles.input, styles.timeMinInput]}
              placeholder="Min"
              placeholderTextColor="#555"
              value={catchTime.includes(':') ? catchTime.split(':')[1]?.split(' ')[0] || "" : ""}
              onChangeText={val => {
                const hour = catchTime.split(':')[0] || '12';
                const period = catchTime.includes('AM') ? 'AM' : catchTime.includes('PM') ? 'PM' : 'AM';
                setCatchTime(hour + ':' + val + ' ' + period);
              }}
              keyboardType="numeric"
              maxLength={2}
            />
            <TouchableOpacity
              style={[styles.periodBtn, !catchTime.includes('PM') && styles.periodBtnActive]}
              onPress={() => {
                const parts = catchTime.split(' ');
                setCatchTime(parts[0] + ' AM');
              }}
            >
              <Text style={[styles.periodBtnText, !catchTime.includes('PM') && styles.periodBtnTextActive]}>AM</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.periodBtn, catchTime.includes('PM') && styles.periodBtnActive]}
              onPress={() => {
                const parts = catchTime.split(' ');
                setCatchTime(parts[0] + ' PM');
              }}
            >
              <Text style={[styles.periodBtnText, catchTime.includes('PM') && styles.periodBtnTextActive]}>PM</Text>
            </TouchableOpacity>
          </View>
          {catchTime && <Text style={styles.timePreview}>Will log as: {catchTime} today</Text>}
        </View>
      )}

      {/* SAVE CATCH FIRST, CLEAR FORM SECOND */}
      <TouchableOpacity style={styles.button} onPress={handleSave} disabled={saving || uploading}>
        <Text style={styles.buttonText}>{saving ? "Saving..." : uploading ? "Uploading photo..." : "Save Catch"}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.clearFormBtn} onPress={clearFullForm}>
        <Text style={styles.clearFormBtnText}>Clear Form</Text>
      </TouchableOpacity>

      <Text style={styles.gpsDisclaimer}>
        GPS coordinates are automatically captured when a photo is taken. Make sure location permissions are enabled for best results.
      </Text>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a1628", padding: 16 },
  header: { fontSize: 24, color: "#fff", fontWeight: "bold", textAlign: "center", marginTop: 20, marginBottom: 24 },
  label: { color: "#4a9eff", fontSize: 14, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: "#1a2a3a", color: "#fff", padding: 14, borderRadius: 10, fontSize: 16 },
  notesInput: { height: 100, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  chip: { backgroundColor: "#1a2a3a", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  chipActive: { backgroundColor: "#4a9eff" },
  chipText: { color: "#888", fontSize: 14 },
  chipTextActive: { color: "#fff", fontWeight: "bold" },
  button: { backgroundColor: "#2ecc71", padding: 16, borderRadius: 10, alignItems: "center", marginTop: 24 },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  successBox: { backgroundColor: "#1a3a2a", borderWidth: 2, borderColor: "#2ecc71", borderRadius: 10, padding: 16, marginBottom: 16 },
  successText: { color: "#2ecc71", fontSize: 16, fontWeight: "bold", textAlign: "center" },
  offlineBox: { backgroundColor: "#2a1a0a", borderWidth: 2, borderColor: "#f39c12", borderRadius: 10, padding: 16, marginBottom: 16 },
  offlineBoxText: { color: "#f39c12", fontSize: 16, fontWeight: "bold", textAlign: "center" },
  offlineBanner: { backgroundColor: "#2a1a0a", borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "#f39c12" },
  offlineBannerText: { color: "#f39c12", fontSize: 14, textAlign: "center", fontWeight: "bold" },
  syncBanner: { backgroundColor: "#1a2a3a", borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "#4a9eff" },
  syncBannerText: { color: "#4a9eff", fontSize: 14, textAlign: "center", fontWeight: "bold" },
  photoRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  photoBtn: { flex: 1, backgroundColor: "#1a2a3a", padding: 14, borderRadius: 10, alignItems: "center" },
  photoBtnText: { color: "#4a9eff", fontSize: 14, fontWeight: "bold" },
  photoPreview: { width: "100%", height: 200, borderRadius: 10, marginTop: 8 },
  clearPhotoBtn: { backgroundColor: "#e74c3c", padding: 10, borderRadius: 8, alignItems: "center", marginTop: 6 },
  clearPhotoBtnText: { color: "#fff", fontSize: 13, fontWeight: "bold" },
  uploadingText: { color: "#4a9eff", textAlign: "center", marginTop: 8, fontSize: 14 },
  gpsBox: { backgroundColor: "#1a2a3a", padding: 10, borderRadius: 10, marginTop: 8 },
  gpsText: { color: "#2ecc71", fontSize: 13, textAlign: "center" },
  gpsDisclaimer: { color: "#555", fontSize: 12, textAlign: "center", marginTop: 20, paddingHorizontal: 8, lineHeight: 18 },
  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  toggleLabel: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  toggleBtn: { backgroundColor: "#1a2a3a", paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  toggleBtnActive: { backgroundColor: "#2ecc71" },
  toggleBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  livewellBar: { backgroundColor: "#1a2a3a", borderRadius: 10, padding: 16, marginBottom: 16 },
  livewellBarText: { color: "#4a9eff", fontSize: 16, fontWeight: "bold", textAlign: "center", marginBottom: 8 },
  livewellList: { marginTop: 8 },
  fishRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "#2a3a4a" },
  fishTag: { color: "#4a9eff", fontSize: 14, fontWeight: "bold" },
  fishWeight: { color: "#fff", fontSize: 14 },
  clearFormBtn: { backgroundColor: "#1a2a3a", borderWidth: 1, borderColor: "#e74c3c", padding: 14, borderRadius: 10, alignItems: "center", marginTop: 12 },
  clearFormBtnText: { color: "#e74c3c", fontSize: 16, fontWeight: "bold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center", padding: 24 },
  modalBox: { backgroundColor: "#0a1628", borderWidth: 3, borderRadius: 16, padding: 32, width: "100%", alignItems: "center" },
  modalTitle: { color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  modalMessage: { fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 16, lineHeight: 38 },
  modalSub: { color: "#aaa", fontSize: 16, marginBottom: 24 },
  modalBtn: { paddingHorizontal: 48, paddingVertical: 16, borderRadius: 10 },
  modalBtnText: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  modalBtnRow: { flexDirection: "row", gap: 16, width: "100%" },
  modalHalfBtn: { flex: 1, paddingVertical: 16, borderRadius: 10, alignItems: "center" },
  dropdown: { backgroundColor: "#1a2a3a", padding: 14, borderRadius: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dropdownSelected: { color: "#fff", fontSize: 16 },
  dropdownPlaceholder: { color: "#555", fontSize: 16 },
  dropdownArrow: { color: "#4a9eff", fontSize: 14 },
  dropdownList: { backgroundColor: "#1a2a3a", borderRadius: 10, marginTop: 4, overflow: "hidden" },
  dropdownItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: "#0a1628" },
  dropdownItemText: { color: "#fff", fontSize: 15 },
  inlineAdd: { flexDirection: "row", gap: 8, padding: 10, alignItems: "center" },
  inlineAddBtn: { backgroundColor: "#4a9eff", padding: 14, borderRadius: 10 },
  inlineAddBtnText: { color: "#fff", fontWeight: "bold" },
  newLureBox: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#0a1628" },
  lurePreview: { color: "#2ecc71", fontSize: 13, marginTop: 8, fontStyle: "italic" },
  saveLureBtn: { backgroundColor: "#4a9eff", padding: 12, borderRadius: 10, alignItems: "center", marginTop: 10 },
  saveLureBtnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  resetButton: { backgroundColor: "#e74c3c", padding: 14, borderRadius: 10, alignItems: "center", marginTop: 16 },
  resetText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  timeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  waterLevelRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 4 },
  waterLevelInput: { width: 70, textAlign: "center" },
  waterLevelFt: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  waterLevelPreview: { color: "#2ecc71", fontSize: 12, marginTop: 4, fontStyle: "italic" },
  timeHint: { color: "#888", fontSize: 12, marginBottom: 8, fontStyle: "italic" },
  timePickerBox: { backgroundColor: "#1a2a3a", borderRadius: 10, padding: 12, marginTop: 4 },
  timePickerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  timeHourInput: { width: 60, textAlign: "center" },
  timeMinInput: { width: 60, textAlign: "center" },
  timeColon: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  periodBtn: { backgroundColor: "#0a1628", paddingHorizontal: 16, paddingVertical: 14, borderRadius: 10 },
  periodBtnActive: { backgroundColor: "#4a9eff" },
  periodBtnText: { color: "#888", fontWeight: "bold", fontSize: 16 },
  periodBtnTextActive: { color: "#fff" },
  timePreview: { color: "#2ecc71", fontSize: 12, marginTop: 8, fontStyle: "italic" },
});

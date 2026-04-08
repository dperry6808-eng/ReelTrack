import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { supabase } from "@/lib/supabase";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";

export default function LogCatchScreen() {
  const [species, setSpecies] = useState("Largemouth Bass");
  const [weightLb, setWeightLb] = useState("");
  const [weightOz, setWeightOz] = useState("");
  const [length, setLength] = useState("");
  const [lure, setLure] = useState("");
  const [lake, setLake] = useState("");
  const [notes, setNotes] = useState("");
  const [weather, setWeather] = useState("");
const [waterClarity, setWaterClarity] = useState("");
  const [waterTemp, setWaterTemp] = useState("");
  const [photo, setPhoto] = useState(null);
  const [gps, setGps] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const weatherOptions = ["Sunny", "Partly Cloudy", "Cloudy", "Rainy", "Foggy", "Windy"];

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
    if (!result.canceled) { setPhoto(result.assets[0].uri); captureGPS(); }
  }

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { alert("Photo library permission required!"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.8 });
    if (!result.canceled) { setPhoto(result.assets[0].uri); captureGPS(); }
  }

  async function handleSave() {
    if (!weightLb && !length) { alert("Please enter at least a weight or length"); return; }
    setSaving(true);
    const { error } = await supabase.from("catches").insert({
      species, weight_lb: parseFloat(weightLb) || 0, weight_oz: parseFloat(weightOz) || 0,
      length: parseFloat(length) || 0, lure, lake, notes, weather,
      water_temp: waterTemp, latitude: gps ? gps.lat : null, longitude: gps ? gps.lng : null,
    });
    setSaving(false);
    if (error) { alert("Error: " + error.message); }
    else {
      setSaved(true);
      setWeightLb(""); setWeightOz(""); setLength(""); setLure(""); setNotes(""); setPhoto(null); setGps(null);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Log a Catch</Text>
      {saved && <View style={styles.successBox}><Text style={styles.successText}>Fish saved!</Text></View>}
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
      <Text style={styles.label}>Water Temp</Text>
      <TextInput style={styles.input} placeholder="e.g. 68" placeholderTextColor="#555" value={waterTemp} onChangeText={setWaterTemp} keyboardType="numeric" />
      <Text style={styles.label}>Water Clarity</Text>
      <View style={styles.chipRow}>
        {["Muddy <1ft", "Stained 1-4ft", "Clear >4ft"].map(c => (
          <TouchableOpacity key={c} style={[styles.chip, waterClarity === c && styles.chipActive]} onPress={() => setWaterClarity(c)}>
            <Text style={[styles.chipText, waterClarity === c && styles.chipTextActive]}>{c}</Text>
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
      <Text style={styles.label}>Photo - GPS auto-captures when photo is taken</Text>
      <View style={styles.photoRow}>
        <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}><Text style={styles.photoBtnText}>Take Photo</Text></TouchableOpacity>
        <TouchableOpacity style={styles.photoBtn} onPress={pickPhoto}><Text style={styles.photoBtnText}>Choose Photo</Text></TouchableOpacity>
      </View>
      {photo && <Text style={styles.gpsText}>Photo selected</Text>}
      {gps && <View style={styles.gpsBox}><Text style={styles.gpsText}>GPS: {gps.lat.toFixed(4)}, {gps.lng.toFixed(4)}</Text></View>}
      <TouchableOpacity style={styles.button} onPress={handleSave} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? "Saving..." : "Save Catch"}</Text>
      </TouchableOpacity>
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
  photoRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  photoBtn: { flex: 1, backgroundColor: "#1a2a3a", padding: 12, borderRadius: 10, alignItems: "center" },
  photoBtnText: { color: "#4a9eff", fontSize: 13, fontWeight: "bold" },
  gpsBox: { backgroundColor: "#1a2a3a", padding: 12, borderRadius: 10, marginTop: 8 },
  gpsText: { color: "#2ecc71", fontSize: 14, textAlign: "center" },
});
import React, { useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import MidiWriter from 'midi-writer-js';

const API_URL = 'http://YOUR_COMPUTER_IP:8000/analyze'; // README'deki adımlara göre değiştirin.
const C = { bg:'#0B1020', panel:'#151D33', purple:'#A78BFA', cyan:'#67E8F9', white:'#F8FAFC', muted:'#9CA3AF', green:'#86EFAC' };

export default function App() {
  const [recording, setRecording] = useState(null);
  const [audioUri, setAudioUri] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('İlk Şarkım');
  const [status, setStatus] = useState('Sesini kaydet, notalara dönüştür ve MIDI olarak dışa aktar.');
  const [tempo, setTempo] = useState('100');

  async function startRecording() {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) { Alert.alert('Mikrofon izni gerekli', 'Sesini kaydetmek için mikrofon izni ver.'); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const r = new Audio.Recording();
      await r.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await r.startAsync();
      setRecording(r); setAudioUri(null); setNotes([]);
      setStatus('Kayıt devam ediyor… Söylemeyi bitirince kaydı durdur.');
    } catch (e) { Alert.alert('Kayıt başlatılamadı', String(e)); }
  }
  async function stopRecording() {
    try {
      if (!recording) return;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri); setRecording(null);
      setStatus('Kayıt hazır. Şimdi “Notalara dönüştür” düğmesine bas.');
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    } catch (e) { Alert.alert('Kayıt durdurulamadı', String(e)); setRecording(null); }
  }
  async function analyze() {
    if (!audioUri) { Alert.alert('Önce kayıt yap', 'Önce sesini kaydedip durdurmalısın.'); return; }
    setBusy(true); setStatus('Ses analiz ediliyor…');
    try {
      const result = await FileSystem.uploadAsync(API_URL, audioUri, {
        httpMethod: 'POST', uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: 'file', mimeType: 'audio/m4a'
      });
      if (result.status < 200 || result.status >= 300) throw new Error('Sunucu hatası: ' + result.status + '. API adresini ve sunucuyu kontrol et.');
      const data = JSON.parse(result.body);
      if (!data.notes || !data.notes.length) throw new Error('Net nota bulunamadı. Daha temiz ve tek sesli söyleyerek tekrar dene.');
      setNotes(data.notes);
      setStatus(`${data.notes.length} nota bulundu. İstersen MIDI dosyasını dışa aktar.`);
    } catch (e) {
      setStatus('Analiz tamamlanamadı.');
      Alert.alert('Nota analizi yapılamadı', `${String(e)}\n\nREADME dosyasındaki Python sunucusunu çalıştırıp API_URL değerini telefonunun ve bilgisayarının aynı Wi‑Fi ağındaki IP adresiyle değiştir.`);
    } finally { setBusy(false); }
  }
  async function exportMidi() {
    if (!notes.length) return;
    try {
      const track = new MidiWriter.Track();
      track.setTempo(Math.max(40, Math.min(200, Number(tempo) || 100)));
      track.addEvent(notes.map(n => new MidiWriter.NoteEvent({
        pitch: [n.note], duration: '4', velocity: 80
      })), ev => ({ sequential: true }));
      const writer = new MidiWriter.Writer([track]);
      const b64 = writer.base64();
      const uri = FileSystem.cacheDirectory + (title.replace(/[^a-z0-9ğüşöçıİĞÜŞÖÇ_-]/gi, '_') || 'sarkim') + '.mid';
      await FileSystem.writeAsStringAsync(uri, b64, { encoding: FileSystem.EncodingType.Base64 });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'audio/midi', dialogTitle: 'Şarkını dışa aktar' });
      else Alert.alert('Dosya hazır', uri);
    } catch (e) { Alert.alert('Dışa aktarma hatası', String(e)); }
  }
  const NotePill = ({ item, index }) => <View style={s.notePill}><Text style={s.noteName}>{item.note}</Text><Text style={s.noteSmall}>{item.time?.toFixed?.(1) ?? index + 1}</Text></View>;
  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.container}>
    <View style={s.top}><View style={s.logo}><Text style={s.logoText}>♪</Text></View><View><Text style={s.brand}>SESİNDEN</Text><Text style={s.subBrand}>ŞARKI STÜDYOSU</Text></View><View style={{flex:1}}/><View style={s.liveDot}/></View>
    <Text style={s.hero}>Sesinle başla.{'\n'}Şarkını kendin yap.</Text>
    <Text style={s.intro}>Mırıldan veya söyle. Sesindeki melodiyi notalara dönüştür, sonra müzik üretiminde kullan.</Text>
    <View style={s.card}>
      <View style={s.row}><Text style={s.sectionNo}>01</Text><Text style={s.cardTitle}>Melodini kaydet</Text></View>
      <View style={s.micCircle}><Text style={s.mic}>🎙️</Text></View>
      <Text style={s.status}>{status}</Text>
      {!recording ? <TouchableOpacity style={s.primary} onPress={startRecording}><Text style={s.primaryText}>●  Kaydı başlat</Text></TouchableOpacity> :
        <TouchableOpacity style={[s.primary, s.stop]} onPress={stopRecording}><Text style={s.primaryText}>■  Kaydı durdur</Text></TouchableOpacity>}
      {audioUri ? <Text style={s.success}>✓ Ses kaydedildi</Text> : null}
    </View>
    <View style={s.card}>
      <View style={s.row}><Text style={s.sectionNo}>02</Text><Text style={s.cardTitle}>Notalara dönüştür</Text></View>
      <Text style={s.help}>En iyi sonuç için enstrümansız, tek melodili ve net bir ses kaydı kullan.</Text>
      <TouchableOpacity disabled={!audioUri || busy} style={[s.secondary, (!audioUri || busy) && {opacity:.45}]} onPress={analyze}>
        {busy ? <ActivityIndicator color={C.white}/> : <Text style={s.secondaryText}>♫  Melodiyi analiz et</Text>}
      </TouchableOpacity>
      {notes.length > 0 ? <><Text style={s.resultTitle}>Bulunan notalar · {notes.length}</Text><View style={s.notesWrap}>{notes.map((n,i)=><NotePill key={i} item={n} index={i}/>)}</View></> : null}
    </View>
    <View style={s.card}>
      <View style={s.row}><Text style={s.sectionNo}>03</Text><Text style={s.cardTitle}>Müziğe dönüştür</Text></View>
      <Text style={s.fieldLabel}>Şarkı adı</Text><TextInput value={title} onChangeText={setTitle} placeholder="Şarkımın adı" placeholderTextColor={C.muted} style={s.input}/>
      <Text style={s.fieldLabel}>Tempo (BPM)</Text><TextInput value={tempo} onChangeText={setTempo} keyboardType="number-pad" style={s.input}/>
      <TouchableOpacity disabled={!notes.length} style={[s.primary, !notes.length && {opacity:.4}]} onPress={exportMidi}><Text style={s.primaryText}>⇩  MIDI olarak dışa aktar</Text></TouchableOpacity>
      <Text style={s.help}>MIDI dosyanı GarageBand, BandLab, Logic Pro veya başka bir müzik uygulamasında açıp enstrüman ve ritim ekleyebilirsin.</Text>
    </View>
    <Text style={s.footer}>SESİNDEN ŞARKI · İlk prototip · Android + iOS</Text>
  </ScrollView></SafeAreaView>;
}
const s = StyleSheet.create({
 safe:{flex:1,backgroundColor:C.bg}, container:{padding:20,paddingBottom:36},
 top:{flexDirection:'row',alignItems:'center',gap:10,marginBottom:28},logo:{width:44,height:44,borderRadius:14,backgroundColor:C.purple,alignItems:'center',justifyContent:'center'},logoText:{fontSize:30,color:C.bg,fontWeight:'900'},
 brand:{color:C.white,fontWeight:'900',letterSpacing:2,fontSize:14},subBrand:{color:C.muted,fontSize:10,letterSpacing:2,marginTop:3},liveDot:{width:9,height:9,borderRadius:5,backgroundColor:C.green},
 hero:{color:C.white,fontSize:36,lineHeight:42,fontWeight:'900',letterSpacing:-1,marginBottom:12},intro:{color:C.muted,fontSize:15,lineHeight:23,marginBottom:24},
 card:{backgroundColor:C.panel,borderRadius:22,padding:18,marginBottom:16,borderWidth:1,borderColor:'#26324D'},
 row:{flexDirection:'row',alignItems:'center',gap:10,marginBottom:16},sectionNo:{color:C.purple,fontWeight:'900',fontSize:12},cardTitle:{color:C.white,fontSize:18,fontWeight:'800'},
 micCircle:{height:94,width:94,borderRadius:47,alignSelf:'center',alignItems:'center',justifyContent:'center',backgroundColor:'#252342',borderWidth:1,borderColor:'#6253A5',marginVertical:10},mic:{fontSize:38},
 status:{color:C.muted,textAlign:'center',fontSize:13,lineHeight:20,marginVertical:12},primary:{backgroundColor:C.purple,borderRadius:14,paddingVertical:15,alignItems:'center',marginTop:8},primaryText:{color:'#100D20',fontWeight:'900',fontSize:15},stop:{backgroundColor:'#FB7185'},success:{color:C.green,textAlign:'center',marginTop:10,fontWeight:'700'},
 help:{color:C.muted,fontSize:13,lineHeight:20,marginBottom:14},secondary:{borderRadius:14,borderWidth:1,borderColor:C.cyan,padding:15,alignItems:'center'},secondaryText:{color:C.cyan,fontSize:15,fontWeight:'800'},
 resultTitle:{color:C.white,fontWeight:'800',marginTop:18,marginBottom:10},notesWrap:{flexDirection:'row',flexWrap:'wrap',gap:8},notePill:{backgroundColor:'#252342',borderRadius:10,paddingHorizontal:12,paddingVertical:9,minWidth:56,alignItems:'center'},noteName:{color:C.cyan,fontWeight:'900'},noteSmall:{color:C.muted,fontSize:10,marginTop:2},
 fieldLabel:{color:C.muted,fontSize:12,marginTop:8,marginBottom:6},input:{backgroundColor:'#0B1020',color:C.white,borderRadius:12,padding:13,borderWidth:1,borderColor:'#303B55',marginBottom:10},footer:{color:'#59647B',textAlign:'center',fontSize:10,letterSpacing:1,marginTop:8}
});
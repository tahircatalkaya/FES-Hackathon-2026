import React, { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen, Header } from '@/components/Screen';
import PartnerLogo from '@/components/PartnerLogo';
import { Row, T, haptic } from '@/components/ui';
import { C, R, shadow } from '@/theme';
import { PARTNERS } from '@/data/partners';

export default function Partners() {
  const [error, setError] = useState<string | null>(null);
  async function visit(url: string) {
    haptic(); setError(null);
    try { await Linking.openURL(url); }
    catch { setError('Die Website konnte nicht geöffnet werden. Bitte deine Internetverbindung prüfen.'); }
  }
  return <Screen tabBar={false}>
    <Header title="Partner" subtitle="Gemeinsam für Frankfurt" />
    <LinearGradient colors={['#173C32','#285C45']} style={{borderRadius:28,padding:24,marginBottom:24}}>
      <View style={{width:44,height:44,borderRadius:22,backgroundColor:'#ffffff1A',alignItems:'center',justifyContent:'center',marginBottom:16}}><Ionicons name="heart-outline" size={24} color="#E7F2C9"/></View>
      <Text style={[T.h1,{color:'#fff',fontSize:29}]}>Gute Ideen.{ '\n' }Mehr gemeinsam.</Text>
      <Text style={[T.body,{color:'#E5EFDF',marginTop:12}]}>Lebensmittel teilen, Ressourcen bewahren und nachhaltig unterwegs sein. Entdecke die Organisationen und Initiativen, die unsere Stadt bewegen.</Text>
    </LinearGradient>
    {error && <Text accessibilityRole="alert" style={[T.body, { color: C.danger, marginBottom: 12 }]}>{error}</Text>}
    <View style={{gap:18}}>{PARTNERS.map(p=><Pressable key={p.id} accessibilityRole="link" accessibilityLabel={`${p.name} – Website öffnen`} onPress={()=>void visit(p.url)} style={({pressed})=>[{backgroundColor:'#fff',borderRadius:R.lg,overflow:'hidden',opacity:pressed?0.85:1},shadow(1)]}>
      <View style={{padding:20,backgroundColor:p.bg}}><Row style={{justifyContent:'space-between'}}><PartnerLogo id={p.id} name={p.name}/><View style={{width:38,height:38,borderRadius:19,backgroundColor:'#ffffffbb',alignItems:'center',justifyContent:'center'}}><Ionicons name={p.icon} size={21} color={p.color}/></View></Row></View>
      <View style={{padding:20,gap:10}}>
        <Text style={{color:p.color,fontSize:11,fontWeight:'800',letterSpacing:0.6}}>{p.category.toUpperCase()}</Text>
        <Text style={[T.h2,{fontSize:22}]}>{p.theme}</Text>
        <Text style={T.body}>{p.description}</Text>
        <Row style={{justifyContent:'space-between',marginTop:6,paddingTop:14,borderTopWidth:1,borderTopColor:C.line}}><Text style={{color:p.color,fontWeight:'800'}}>{p.name} entdecken</Text><Ionicons name="open-outline" size={22} color={p.color}/></Row>
      </View>
    </Pressable>)}</View>
  </Screen>;
}

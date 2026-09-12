import React from 'react';
import { Image, View } from 'react-native';
import { SvgCss } from 'react-native-svg/css';
import { PARTNER_SVG } from '@/data/partner-logos';
export default function PartnerLogo({ id, name }: { id: string; name: string }) {
  return <View accessible accessibilityLabel={`${name} Logo`} style={{ width: 168, height: 82, borderRadius: 16, backgroundColor: id === 'transdev' ? '#C8102E' : id === 'main-lastenrad' ? '#46762F' : '#fff', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
    {id === 'foodsharing' ? <Image source={require('../../assets/partners/foodsharing.png')} resizeMode="contain" style={{width:144,height:58}} /> : id === 'traffiq' ? <Image source={require('../../assets/partners/traffiq.png')} resizeMode="contain" style={{width:144,height:58}} /> : <SvgCss xml={PARTNER_SVG[id as keyof typeof PARTNER_SVG]} width={id==='fes'?104:144} height={58} />}
  </View>;
}

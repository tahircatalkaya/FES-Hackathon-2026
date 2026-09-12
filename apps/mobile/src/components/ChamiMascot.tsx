import { useT, useLocalize } from '@/i18n/useT';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AppState, Image, Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { VideoView, useVideoPlayer } from 'expo-video';
import { C, shadow } from '@/theme';
import { Button, Counter, T } from './ui';
import { balance, useStore } from '@/store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { VideoPlayer } from 'expo-video';

/** Belohnungsclips je Bereich. Ratio ist Breite durch Höhe der Datei. */
const CLIPS = {
  clean: { src: require('../../assets/chami-celebrate.mp4'), ratio: 848 / 480 },
  food: { src: require('../../assets/chami-food.mp4'), ratio: 1 },
  cup: { src: require('../../assets/chami-cup.mp4'), ratio: 1 },
  ride: { src: require('../../assets/chami-ride.mp4'), ratio: 848 / 480 },
} as const;
export type ClipName = keyof typeof CLIPS;

/**
 * Die Posen aus dem Maskottchen-Sheet. `ratio` ist Breite durch Höhe der Datei,
 * `eyes` sind die Augenweiß-Flächen als Anteil des gerenderten Bildes (aus der Vorlage
 * gemessen), `lid` ist die Gesichtsfarbe an der Stelle, mit der das Lid zufällt.
 * Posen mit geschlossenen Augen oder Sonnenbrille haben keine Lider.
 */
const POSES = {
  classic: {
    src: require('../../assets/chami.png'),
    ratio: 1208 / 1302,
    lid: 'rgb(148, 222, 13)',
    lively: false,
    eyes: [
      { left: 0.1918, top: 0.283, width: 0.1897, height: 0.203 },
      { left: 0.5711, top: 0.289, width: 0.1864, height: 0.202 },
    ],
  },
  stand: { src: require('../../assets/chami/stand.png'), ratio: 253 / 318, lid: 'rgb(153, 219, 14)', lively: false, eyes: [{ left: 0.0711, top: 0.3019, width: 0.2134, height: 0.195 }, { left: 0.5415, top: 0.3082, width: 0.2174, height: 0.1981 }] },
  wave: { src: require('../../assets/chami/wave.png'), ratio: 278 / 320, lid: 'rgb(153, 219, 14)', lively: false, eyes: [{ left: 0.2014, top: 0.3062, width: 0.1942, height: 0.1938 }, { left: 0.6151, top: 0.3312, width: 0.1942, height: 0.1969 }] },
  cheer: { src: require('../../assets/chami/cheer.png'), ratio: 274 / 327, lid: undefined, lively: true, eyes: [] },
  thumbs: { src: require('../../assets/chami/thumbs.png'), ratio: 253 / 316, lid: 'rgb(153, 219, 14)', lively: true, eyes: [{ left: 0.0751, top: 0.2911, width: 0.2174, height: 0.2025 }] },
  heart: { src: require('../../assets/chami/heart.png'), ratio: 250 / 319, lid: 'rgb(157, 221, 16)', lively: false, eyes: [{ left: 0.076, top: 0.3135, width: 0.216, height: 0.1944 }, { left: 0.532, top: 0.3166, width: 0.22, height: 0.1975 }] },
  think: { src: require('../../assets/chami/think.png'), ratio: 251 / 309, lid: 'rgb(154, 220, 16)', lively: false, eyes: [{ left: 0.2709, top: 0.3398, width: 0.2151, height: 0.1974 }, { left: 0.6972, top: 0.2718, width: 0.2032, height: 0.1974 }] },
  hello: { src: require('../../assets/chami/hello.png'), ratio: 276 / 309, lid: undefined, lively: true, eyes: [] },
  calm: { src: require('../../assets/chami/calm.png'), ratio: 240 / 308, lid: undefined, lively: false, eyes: [] },
  coffee: { src: require('../../assets/chami/coffee.png'), ratio: 285 / 305, lid: 'rgb(155, 219, 15)', lively: false, eyes: [{ left: 0.2491, top: 0.2754, width: 0.1895, height: 0.2066 }, { left: 0.6491, top: 0.3377, width: 0.1965, height: 0.2066 }] },
  globe: {
    src: require('../../assets/chami/globe.png'),
    ratio: 257 / 309,
    lid: undefined,
    lively: false,
    eyes: [],
  },
  leaf: { src: require('../../assets/chami/leaf.png'), ratio: 292 / 293, lid: 'rgb(153, 220, 15)', lively: false, eyes: [{ left: 0.2295, top: 0.3038, width: 0.1747, height: 0.2082 }, { left: 0.6096, top: 0.2867, width: 0.1952, height: 0.2116 }] },
  backpack: { src: require('../../assets/chami/backpack.png'), ratio: 242 / 291, lid: 'rgb(153, 219, 14)', lively: false, eyes: [{ left: 0.3264, top: 0.2543, width: 0.2355, height: 0.2062 }, { left: 0.781, top: 0.3024, width: 0.1653, height: 0.1959 }] },
  run: { src: require('../../assets/chami/run.png'), ratio: 289 / 291, lid: 'rgb(154, 219, 15)', lively: true, eyes: [{ left: 0.4671, top: 0.354, width: 0.1903, height: 0.2027 }, { left: 0.8339, top: 0.323, width: 0.128, height: 0.1959 }] },
  shock: { src: require('../../assets/chami/shock.png'), ratio: 222 / 282, lid: 'rgb(155, 221, 18)', lively: false, eyes: [{ left: 0.1622, top: 0.2979, width: 0.2477, height: 0.2128 }, { left: 0.6667, top: 0.2979, width: 0.2477, height: 0.2128 }] },
  car: {
    src: require('../../assets/chami/car.png'),
    ratio: 560 / 371,
    lid: 'rgb(155, 219, 11)',
    lively: false,
    eyes: [
      { left: 0.4786, top: 0.1806, width: 0.0821, height: 0.1348 },
      { left: 0.65, top: 0.2291, width: 0.0839, height: 0.1429 },
    ],
  },
  cool: { src: require('../../assets/chami/cool.png'), ratio: 259 / 291, lid: undefined, lively: false, eyes: [] },
} as const;

export type Pose = keyof typeof POSES;

/** Maskottchen: steht ruhig und blinzelt. Die Weltgrafik bleibt vollständig unbewegt. */
export function ChamiMascot({ pose = 'classic', size = 150, onPress, style }: { pose?: Pose; size?: number; onPress?: () => void; style?: any }) {
  const p = POSES[pose] ?? POSES.classic;
  const width = size * p.ratio;
  const blink = useSharedValue(0);

  useEffect(() => {
    blink.value = withRepeat(
      withSequence(
        withDelay(2800, withTiming(1, { duration: 80 })),
        withTiming(0, { duration: 110 }),
        withDelay(220, withTiming(1, { duration: 80 })),
        withTiming(0, { duration: 110 }),
      ),
      -1,
      false,
    );

  }, []);

  const lidStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: blink.value }] }));

  const body = (
    <View style={[{ width, height: size }, style]}>
      <Animated.Image source={p.src} style={{ width, height: size }} resizeMode="contain" />
      {p.eyes.map((e, i) => (
        <Animated.View
          key={i}
          style={[
            {
              position: 'absolute',
              left: e.left * width,
              top: e.top * size,
              width: e.width * width,
              height: e.height * size,
              borderRadius: (e.width * width) / 2,
              backgroundColor: p.lid,
              transformOrigin: 'top',
            },
            lidStyle,
          ]}
        />
      ))}
    </View>
  );

  if (!onPress) return body;
  return <Pressable onPress={onPress}>{body}</Pressable>;
}

/** Keep the four bundled clips ready before a feedback sheet opens. Expo owns release. */
const ClipsContext = createContext<Record<ClipName, VideoPlayer> | null>(null);
const setup = (p:VideoPlayer) => { p.muted=true; p.loop=false; };
export function ClipPlaybackProvider({children}:{children:React.ReactNode}) {
  const clean=useVideoPlayer(CLIPS.clean.src,setup),food=useVideoPlayer(CLIPS.food.src,setup);
  const cup=useVideoPlayer(CLIPS.cup.src,setup),ride=useVideoPlayer(CLIPS.ride.src,setup);
  const players=useMemo(()=>({clean,food,cup,ride}),[clean,food,cup,ride]);
  useEffect(()=>{const subscription=AppState.addEventListener('change',state=>{if(state!=='active')Object.values(players).forEach(p=>p.pause());});return()=>subscription.remove();},[players]);
  return <ClipsContext.Provider value={players}>{children}</ClipsContext.Provider>;
}
export function ClipPlayer({clip='clean',style}:{clip?:ClipName;style?:any}) {
  const players=useContext(ClipsContext);
  return players?<ReadyClip player={players[clip]} clip={clip} style={style}/>:<LocalClip clip={clip} style={style}/>;
}
function LocalClip({clip,style}:{clip:ClipName;style?:any}) {
  const player=useVideoPlayer(CLIPS[clip].src,setup);
  return <ReadyClip player={player} clip={clip} style={style}/>;
}
function ReadyClip({player,clip,style}:{player:VideoPlayer;clip:ClipName;style?:any}) {
  const [frame,setFrame]=useState(false);
  useEffect(()=>{setFrame(false);player.currentTime=0;player.play();},[player]);
  // No player calls in cleanup: the owning Expo hook may already have released it.
  return <View style={[{width:'100%',aspectRatio:CLIPS[clip].ratio,backgroundColor:'#F0F5E9'},style]}>
    <VideoView player={player} style={{width:'100%',height:'100%'}} contentFit="contain" nativeControls={false} onFirstFrameRender={()=>setFrame(true)} />
    {!frame&&<Image source={POSES[clip==='cup'?'coffee':clip==='ride'?'run':clip==='food'?'heart':'cheer'].src} resizeMode="contain" style={{position:'absolute',width:'100%',height:'100%'}}/>}
  </View>;
}

/** One feedback layout: immediate clip, animated balance, explanations and an explicit close. */
export function CelebrationOverlay({open,points=0,duplicate,pending,note,headline,tileLabel,tileValue,clip='clean',onClose,onWhy,continueLabel,onContinue}:{
  open:boolean;points?:number;duplicate?:boolean;pending?:boolean;note?:string;headline?:string;
  tileLabel?:string;tileValue?:string;clip?:ClipName;onClose:()=>void;onWhy?:()=>void;continueLabel?:string;onContinue?:()=>void;
}) {
  const t=useT(),localize=useLocalize(),{height,width}=useWindowDimensions(),insets=useSafeAreaInsets();
  const total=useStore(balance),color=clip==='food'?C.food:clip==='cup'?C.reuse:clip==='ride'?C.mobility:C.clean;
  if(!open)return null;
  const earned=duplicate?0:points;
  return <Modal visible transparent animationType="none" onRequestClose={onClose}>
    <View style={{flex:1,backgroundColor:'rgba(15,20,15,0.66)',justifyContent:'center',alignItems:'center',paddingHorizontal:16,paddingTop:insets.top+12,paddingBottom:insets.bottom+12}}>
      <View style={[{width:Math.min(width-32,440),maxHeight:height-insets.top-insets.bottom-24,backgroundColor:'#fff',borderRadius:24,overflow:'hidden'},shadow(3)]}>
        <ScrollView bounces={false} contentContainerStyle={{paddingBottom:16}}>
          <ClipPlayer clip={clip} style={{height:Math.min(220,height*0.29),aspectRatio:undefined}}/>
          <View style={{paddingHorizontal:20,gap:14,paddingTop:14}}>
            <Text style={[T.h2,{textAlign:'center'}]}>{localize(headline??(duplicate?t('components.celebration.already'):earned>0?t('components.celebration.great'):t('components.celebration.saved')))}</Text>
            <View style={{flexDirection:'row',gap:10}}>
              <View style={{flex:1,backgroundColor:color+'14',padding:12,borderRadius:16,alignItems:'center'}}><Text style={T.small}>{t('updates.pointsAction')}</Text><View style={{flexDirection:'row',alignItems:'center'}}><Text style={{fontSize:30,fontWeight:'900',color}}>+</Text><Counter value={earned} style={{fontSize:30,fontWeight:'900',color}}/></View></View>
              <View style={{flex:1,backgroundColor:C.bg,padding:12,borderRadius:16,alignItems:'center'}}><Text style={T.small}>{t('updates.balance')}</Text><Counter value={total} style={{fontSize:30,fontWeight:'900',color:C.ink}}/></View>
            </View>
            {!!tileValue&&<View style={{alignItems:'center'}}><Text style={T.small}>{tileLabel}</Text><Text style={T.h2}>{tileValue}</Text></View>}
            {!!note?<Text style={[T.body,{textAlign:'center'}]}>{localize(note)}</Text>:pending?<Text style={[T.body,{textAlign:'center'}]}>{t('components.celebration.pending')}</Text>:duplicate?<Text style={[T.body,{textAlign:'center'}]}>{t('components.celebration.once')}</Text>:null}
          </View>
        </ScrollView>
        <View style={{padding:16,gap:8,borderTopWidth:1,borderColor:C.line}}>
          {onWhy&&<Button label={t('why.title')} color={color} variant="soft" onPress={onWhy}/>}
          {onContinue&&<Button label={continueLabel||t('common.next')} color={color} onPress={onContinue}/>}
          <Button label={t('components.common.close')} color={color} variant={onContinue?'ghost':'solid'} onPress={onClose}/>
        </View>
      </View>
    </View>
  </Modal>;
}

export default ChamiMascot;

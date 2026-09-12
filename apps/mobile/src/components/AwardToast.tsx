import React, { useEffect } from 'react';
import type { Award } from '@/engine/types';
import { CelebrationOverlay } from './ChamiMascot';
import { haptic } from './ui';
export default function AwardToast({award,onWhy,onDone}:{award:Award|null;onWhy:(a:Award)=>void;onDone:()=>void;color?:string}) {
  useEffect(()=>{if(award)haptic(award.points>0?'success':'light');},[award]);
  if(!award)return null;
  return <CelebrationOverlay key={award.key} open points={award.points} duplicate={award.duplicate} pending={award.status==='ausstehend'}
    headline={award.title} note={award.points===0?award.reasons.at(-1)||award.formula:undefined}
    clip={award.partner==='foodsharing'?'food':award.partner==='vytal'?'cup':['transdev','traffiq'].includes(award.partner)?'ride':'clean'}
    onClose={onDone} onWhy={()=>{onDone();onWhy(award);}}/>;
}

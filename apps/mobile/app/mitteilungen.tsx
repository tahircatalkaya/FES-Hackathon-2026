import React from 'react';
import { Text, View } from 'react-native';
import { Screen, Header } from '@/components/Screen';
import { Card, T } from '@/components/ui';
import { useStore } from '@/store';
import { useT, useLocalize } from '@/i18n/useT';
export default function Notices(){const t=useT(),l=useLocalize(),notices=useStore(s=>s.notices);return <Screen tabBar={false}><Header title={t('tabs.notifications')}/><View style={{gap:12}}>{notices.map((n,i)=><Card key={i}><Text style={T.h3}>{l(n.title)}</Text><Text style={T.body}>{l(n.body)}</Text></Card>)}</View></Screen>;}

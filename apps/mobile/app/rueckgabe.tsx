import { useT } from '@/i18n/useT';
import React from 'react';
import { Screen, Header } from '@/components/Screen';
import ReuseInventory from '@/components/ReuseInventory';
export default function Return(){
  const rt = useT();return <Screen tabBar={false}><Header title={rt('routes.return_reusables')}/><ReuseInventory returnOnly/></Screen>;}

import React from 'react';
import { Screen, Header } from '@/components/Screen';
import ReuseInventory from '@/components/ReuseInventory';
export default function Return(){return <Screen tabBar={false}><Header title="Mehrweg zurückgeben"/><ReuseInventory returnOnly/></Screen>;}

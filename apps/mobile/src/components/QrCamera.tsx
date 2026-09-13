import React from 'react';
import { Platform, View } from 'react-native';
import { CameraView, type useCameraPermissions } from 'expo-camera';
import { Button } from './ui';

/** The manual code field stays with each flow; native scanners share camera access. */
export default function QrCamera({ camera, onScan, label, color, height = 280, radius = 22 }: {
  camera: ReturnType<typeof useCameraPermissions>;
  onScan: (value: string) => void;
  label: string;
  color?: string;
  height?: number;
  radius?: number;
}) {
  const [permission, requestPermission] = camera;
  if (Platform.OS === 'web') return null;
  if (!permission?.granted) return <Button label={label} color={color} onPress={() => void requestPermission()} />;
  return (
    <View style={{ height, borderRadius: radius, overflow: 'hidden' }}>
      <CameraView style={{ flex: 1 }} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={e => onScan(e.data)} />
    </View>
  );
}

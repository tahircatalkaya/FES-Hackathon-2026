const test=require('node:test');
const assert=require('node:assert/strict');
const {lanConfig}=require('./lan-address.cjs');
const ip=address=>({address,family:'IPv4',internal:false});
test('uses the physical hotspot for Metro and API even when VPN appears first',()=>{
  const interfaces={utun3:[ip('10.18.7.230')],en0:[ip('172.20.10.11')]};
  assert.deepEqual(lanConfig(interfaces),{host:'172.20.10.11',port:8787,trustUrl:'http://172.20.10.11:8787'});
  assert.equal(lanConfig(interfaces,{TRUST_PORT:'8790'}).trustUrl,'http://172.20.10.11:8790');
  assert.equal(lanConfig(interfaces,{EXPO_PUBLIC_TRUST_URL:'http://192.168.1.20:8787'}).trustUrl,'http://192.168.1.20:8787');
  assert.throws(()=>lanConfig(interfaces,{REACT_NATIVE_PACKAGER_HOSTNAME:'10.18.7.230'}),/VPN/);
  assert.throws(()=>lanConfig(interfaces,{EXPO_PUBLIC_TRUST_URL:'http://localhost:8787'}),/localhost/);
});
test('fails clearly when only loopback and VPN are available',()=>{
  assert.throws(()=>lanConfig({lo0:[{...ip('127.0.0.1'),internal:true}],utun3:[ip('10.18.7.230')]}),/Kein privates WLAN/);
});

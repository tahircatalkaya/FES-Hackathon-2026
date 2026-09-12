const {isIP}=require('node:net');
const privateIPv4=host=>isIP(host)===4&&/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host);
const virtualInterface=/^(lo\d*$|utun|tun|tap|ppp|ipsec|wg|tailscale|zt|docker|veth|virbr|vmnet|vboxnet|bridge|br-|awdl|llw)|vpn|virtual/i;

function lanConfig(interfaces,env={}) {
  const addresses=Object.entries(interfaces).filter(([name])=>!virtualInterface.test(name))
    .flatMap(([,items])=>(items||[]).filter(item=>!item.internal&&(item.family==='IPv4'||item.family===4)&&privateIPv4(item.address)).map(item=>item.address));
  const explicitHost=env.REACT_NATIVE_PACKAGER_HOSTNAME?.trim();
  if(explicitHost&&!addresses.includes(explicitHost))throw new Error('REACT_NATIVE_PACKAGER_HOSTNAME muss die aktuelle private WLAN- oder Hotspot-IP dieses Rechners sein. Alte oder VPN-Adressen entfernen.');
  const host=explicitHost||addresses[0];
  if(!host)throw new Error('Kein privates WLAN oder Hotspot gefunden. Rechner mit demselben WLAN/Hotspot wie das Handy verbinden und erneut starten.');
  const port=Number(env.TRUST_PORT||8787);
  if(!Number.isInteger(port)||port<1||port>65535)throw new Error('TRUST_PORT muss eine gültige Portnummer sein.');
  const configured=env.EXPO_PUBLIC_TRUST_URL?.trim().replace(/\/$/,'');
  if(configured) {
    let url;try{url=new URL(configured);}catch{}
    if(!url||url.username||url.password||url.search||url.hash||!(url.protocol==='https:'||(url.protocol==='http:'&&privateIPv4(url.hostname))))throw new Error('EXPO_PUBLIC_TRUST_URL muss eine gültige HTTPS-Adresse oder private LAN-Adresse ohne Zugangsdaten sein. localhost ist auf dem Handy nicht erreichbar.');
  }
  return {host,port,trustUrl:configured||`http://${host}:${port}`};
}
module.exports={lanConfig};

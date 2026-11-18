import { siteConfig } from "@/config/site";

/**
 * WebMCP: tarayıcı içindeki yapay zekâ ajanlarına sitenin yapabildiklerini
 * araç olarak tanıtır (navigator.modelContext). Destek yoksa hiçbir şey yapmaz.
 * Araçlar hiçbir şey GÖNDERMEZ; sadece bilgi ve link döndürür.
 * HTML içine satır içi script olarak gömülür ki tarayıcılar/ajanlar JS paketini
 * beklemeden görebilsin.
 */
const WA = JSON.stringify(siteConfig.defaultWhatsApp);
const BASE = JSON.stringify(siteConfig.url);

const SCRIPT = `(function(){try{var mc=navigator.modelContext;if(!mc||!mc.registerTool)return;
var t=function(s){return{content:[{type:"text",text:s}]}};
mc.registerTool({name:"redmedya_paketleri",description:"REDMEDYA (Ankara düğün fotoğrafçısı ve düğün videosu) paketlerini, fiyatlarını, ek hizmetlerini, hizmet bölgesini ve iletişim bilgilerini Markdown olarak döndürür.",inputSchema:{type:"object",properties:{}},execute:function(){return fetch("/llms.txt").then(function(r){return r.text()}).then(t)}});
mc.registerTool({name:"redmedya_teklif_linki",description:"Düğün tarihi, paket ve not ile REDMEDYA'ya gönderilecek hazır WhatsApp teklif mesajının linkini ve paket oluşturucu linkini üretir. Mesajı kendisi göndermez; kullanıcı linke tıklayıp gönderir.",inputSchema:{type:"object",properties:{tarih:{type:"string",description:"Düğün tarihi (YYYY-AA-GG)"},paket:{type:"integer",enum:[1,2,3],description:"Paket numarası"},not:{type:"string",description:"Etkinlikler veya özel istekler"}}},execute:function(i){i=i||{};var p=["Merhaba REDMEDYA ekibi, web sitenizden ulaşıyorum."];if(i.tarih)p.push("Düğün tarihimiz: "+String(i.tarih)+".");if(i.paket)p.push("Paket "+String(i.paket)+" ile ilgileniyoruz.");if(i.not)p.push(String(i.not));p.push("Bilgi ve teklif almak istiyorum.");var wa="https://wa.me/"+${WA}+"?text="+encodeURIComponent(p.join(" "));var b=${BASE}+"/paket-olustur"+(i.paket?"?p="+String(i.paket):"");return Promise.resolve(t("WhatsApp teklif linki: "+wa+"\\nPaket oluşturucu (canlı fiyat): "+b))}});
}catch(e){}})();`;

export function WebMcpTools() {
  return <script id="webmcp-tools" dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}

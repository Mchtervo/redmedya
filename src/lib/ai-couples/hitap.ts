/**
 * İsimden kibar hitap: "Ramazan" → "Ramazan Bey", "Ayşe" → "Ayşe Hanım".
 * Hem kadın hem erkek ismi olabilenlerde (Deniz, Umut…) ya da tanınmayan isimlerde
 * yanlış hitap etmemek için SADECE isim döner ("Deniz").
 * Sesli asistanın açılışı ("Merhabalar Ayşe Hanım, …") ve WhatsApp metinleri için.
 */

const KADIN = new Set(
  `ayşe fatma zeynep elif emine hatice merve büşra esra kübra şeyma tuğba özlem sevgi derya ebru gamze gizem hande ilknur nurcan
  aslı aysel ayşegül aylin aynur başak betül burcu canan cansu ceren çiğdem damla demet dilek duygu ebru eda ela elçin elvan esin
  esma feyza filiz funda gonca gökçe gül gülay gülsüm gülşen hacer hale hilal hülya ilayda ipek irem kader kevser leyla lale
  meltem melek melike meryem mine nazlı neslihan nesrin nihal nil nilay nilüfer nur nuray nurten öznur pelin pınar rabia reyhan
  rukiye sabahat saadet seda selda selin selma sema semra serap serpil sevda sevil sevim sibel simge songül sultan sümeyye şebnem
  şenay şengül şerife şule tuba tülay tülin türkan ülkü yasemin yeliz yeşim yıldız zehra zübeyde zuhal azra defne ecrin eylül
  nehir ada asya beren berra beyza buse ceyda cemre dilara ece ecem elçin esila ezgi gülsün hazal ilkay iclal irmak işıl kardelen
  kumsal lara melis miray naz nazlıcan neval nisa öykü rana rüya sena seren sude sudenaz şevval tuana yağmur zerrin hira hilal
  büşranur fatmanur zeynepnur merveden gülizar aysun ayten aysu ayla nergis nermin nevin nurgül nurhan perihan saliha sadiye
  safiye semiha sevinç şükran tülin vildan zeliha zekiye hümeyra mukaddes münevver nazife necla necmiye nefise nesibe nuriye
  güllü melda dilan dilşad rojda berivan helin
  berfin delal dadiya halima husnia hava havva kamile şennur ikbal medine sedanur sebahat sabahat yaren feryal mislina arzu tuğçe busenur
  gülşah beste ayça aleyna azize bahar banu belgin beril birgül buket cemile deren dicle didem dilay duru ecenur elanur esmanur
  fadime fatoş feride fidan figen gülbahar gülcan güler gülhan gülistan gülten günay hanife hatun hediye kezban kıymet lütfiye
  mehtap melisa meral mihriban müge nagihan nalan narin nazan nebahat nida nihan oya özge rahime remziye ruken sevcan sevtap sıla
  suna şahika şeyda şirin tansu ümran yaprak yonca zerda zilan zümra zümrüt mervee merve hira nur gamze songül seda emine asuman
  hilal fatma güler nazlıcan sezen sezensu neslihan kübranur ilknur betül melisa medine feryal gözde belit sedef zehra gurbet nermin
  şükran pınar elif safiye yasemin büşra ayşegül irem leyla sümeyra sümeyye rümeysa tuğçenur aybüke aybike ayşenur esranur hatice
  hacer kader kadriye kamuran latife makbule melahat muazzez mualla müzeyyen nadide naciye nevra nurdan nurcihan nursel nurşen
  aslıhan nurhayat peri perihan rahşan sacide sevilay sevinç solmaz süheyla şaziye şehriban şennur tenzile tijen türkan ulviye vesile yadigar zahide`.split(/\s+/).filter(Boolean)
);

const ERKEK = new Set(
  `mehmet mustafa ahmet ali hüseyin hasan ibrahim ismail osman yusuf murat ömer ramazan halil süleyman abdullah mahmut recep
  fatih kemal salih kadir emre burak serkan hakan gökhan erkan volkan onur tolga uğur yasin yavuz mert emir eren berk berkay can
  cem cengiz cihan doğan emrah enes engin erdem erhan ersin ertuğrul fırat furkan gürkan hamza harun ilker ilhan kaan kerem kenan
  kürşat levent mesut metin muhammed muhammet necati oğuz oğuzhan okan orhan ozan özgür sami sedat selim semih serdar sinan şahin
  şükrü taner tarık tayfun tuncay turan tunahan umut utku ümit vedat yakup yiğit yunus yücel zafer zeki bayram bekir bilal bülent
  celal cevdet cuma davut dursun ekrem ercan erol ferhat feyzullah gökay güven hikmet hilmi idris irfan kâmil kamil kazım koray
  kubilay mazlum melih mithat muammer muhsin musa mücahit mücahid nazım nihat nuri orhun rahmi rıza sabri sadık sefa selahattin
  sercan sezer soner suat şaban şenol şeref talha tamer tekin timur tuna turgut ufuk yaşar yılmaz yiğitcan alperen alp aras arda
  atakan batuhan berkant baran batu bora çağan çağatay çağrı doruk efe ege eray erdoğan görkem kağan kerim mirza ozan poyraz
  rüzgar sarp taha tamer toprak tuğrul yağız yalçın emin eyüp abdulkadir abdurrahman ahmed ayhan aykut aytekin bedirhan
  yavuzhan alican aliihsan ihsan ishak ilyas veli adem âdem adnan agah akif arif asım aziz bahadır başar caner cavit
  berkcan mertcan erencan berkan samet samed eyyüp nafi tayyip durmuş resul demirkan dermirkan riza enes ensar berat bünyamin
  celil cüneyt çetin dinçer erdinç ergin fikret gökmen güray halit hayri hüsnü kutay mete murathan nazmi necip nurettin oktay
  onurcan ömercan özcan özkan rıdvan sabahattin savaş selçuk serhat sertaç tayfur tolgahan turgay uğurcan vahit yahya yasir
  zekeriya kaancan canberk cankat oğulcan emirhan emircan mustafacan ahmetcan alihan abdulsamet kadircan miraç yusufcan burakcan
  efecan egemen eymen ata ateş cemal cemil coşkun erkin erman faruk ferdi ferit fevzi galip gencer hamit haydar kürşad lütfi
  mahir mansur nail naim nevzat niyazi nusret raşit refik remzi rüştü saffet sait seyfi sıtkı şerafettin tahsin yekta zülfikar
  mehmetnuri mehmetali mehmetcan alirıza muhammedali fatihcan emrecan sefa sezer taner tayyip harun ahmet erdem emre burak
  belit gurbet ergin oğuzhan ismail mustafa ibrahim hamdi hasancan hüseyincan abdülkadir abdülkerim abdullah şahan şafak
  toygar enis seyfettin seyfi nurullah mücahit ramazan ramazancan recai rauf reşat rıfat sebahattin seyit seyithan sıddık şemsettin taylan teoman ulaş vural yetkin`.split(/\s+/).filter(Boolean)
);

/** İkisi de olabilen isimler: sadece isimle hitap */
const IKISI = new Set(`deniz umut barış evren ümit özgür aytaç ilkay derin yağmur ekin sevgi bilge doğa ırmak çağla`.split(/\s+/));

// Konuşma kayıtlarında Bey/Hanım'sız kalan isimler
for (const n of ["kamile", "delal", "hava", "halima", "nazar", "beritan", "rojda", "dilan", "berivan", "zozan", "medine", "hacer", "şennur", "mehtap", "nazlı", "sıla", "ilayda"]) KADIN.add(n);
for (const n of ["berkcan", "erencan", "mertcan", "samed", "samet", "rıza", "riza", "eyyüp", "eyüp", "berat", "enis", "okan"]) ERKEK.add(n);

function firstName(full: string): string {
  return (full ?? "").trim().split(/[\s&,/+-]+/)[0] ?? "";
}

/** "ayşegül" gibi tanınmayan isimler için kadın isim kalıpları */
function looksFemale(n: string): boolean {
  // Sonu kadın isim ekiyle bitenler: Ayşegül, Fatmanur, Elanaz, Cansu, Yaren-nisa …
  return /(gül|nur|naz|nihal|sena|nisa|su|han[ıi]m)$/.test(n);
}

export type Hitap = { hitap: string; cinsiyet: "kadin" | "erkek" | "bilinmiyor" };

export function hitapFor(full: string | undefined | null): Hitap {
  const raw = firstName(full ?? "");
  if (!raw) return { hitap: "", cinsiyet: "bilinmiyor" };
  const n = raw.toLocaleLowerCase("tr-TR");
  const pretty = raw.charAt(0).toLocaleUpperCase("tr-TR") + raw.slice(1).toLocaleLowerCase("tr-TR");
  if (IKISI.has(n)) return { hitap: pretty, cinsiyet: "bilinmiyor" };
  if (KADIN.has(n)) return { hitap: `${pretty} Hanım`, cinsiyet: "kadin" };
  if (ERKEK.has(n)) return { hitap: `${pretty} Bey`, cinsiyet: "erkek" };
  if (looksFemale(n)) return { hitap: `${pretty} Hanım`, cinsiyet: "kadin" };
  return { hitap: pretty, cinsiyet: "bilinmiyor" };
}

/**
 * Sesli asistanın İLK cümlesi (kısa, kişiyi teyit eder):
 *  "Merhabalar, Ayşe Hanım ile mi görüşüyorum?" / isim yoksa "Merhabalar, iyi günler. Sizi RED MEDIA'dan arıyorum, uygun musunuz?"
 */
export function selamFor(full: string | undefined | null): string {
  const hf = hitapFor(full);
  if (!hf.hitap) return "Merhabalar, iyi günler. Sizi RED MEDIA'dan arıyorum, uygun musunuz?";
  // Cinsiyet bilinmiyorsa sadece ad ("Deniz ile mi") kaba duruyor → ad soyad
  const who = hf.cinsiyet === "bilinmiyor"
    ? (full ?? "").trim().split(/\s+/).slice(0, 3).map((w) => w.charAt(0).toLocaleUpperCase("tr-TR") + w.slice(1).toLocaleLowerCase("tr-TR")).join(" ")
    : hf.hitap;
  return `Merhabalar, RED MEDIA'dan arıyorum, ${who} ile mi görüşüyorum?`;
}

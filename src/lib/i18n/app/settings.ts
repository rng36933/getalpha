import type { Locale } from "../locales.ts";
import { ltPlural } from "../plural.ts";

/**
 * Every word on the Settings page: `SettingsPage` itself, `Mt5Connect.tsx`
 * (long — the MetaTrader setup walkthrough), and `EmailPreferences.tsx`.
 */
export type SettingsCopy = {
  title: string;
  subtitle: string;
  mt5CardTitle: string;
  emailCardTitle: string;
  mt5: {
    introLead: string;
    introStrong: string;
    reasons: readonly string[];
    keyCreatedWaiting: string;
    nothingReceivedFor: (duration: string) => string;
    terminalConnected: string;
    lastSent: (
      agoText: string,
      accountLogin: string | null,
      broker: string | null,
      tradeCount: number,
    ) => string;
    nothingArrivedYet: string;
    goneQuietDetail: string;
    tokenBoxTitle: string;
    tokenAriaLabel: string;
    copyLabel: string;
    copiedLabel: string;
    steps: readonly { title: string; body: string }[];
    generateFailed: string;
    disconnectFailed: string;
    networkError: string;
    working: string;
    generateNewKey: string;
    generateMyKey: string;
    downloadFile: string;
    disconnect: string;
    footerNote: string;
    time: {
      agoLabel: (minutes: number) => string;
      durationLabel: (minutes: number) => string;
    };
  };
  email: {
    label: string;
    description: string;
    notEntitledNote: string;
    saveFailed: string;
    networkError: string;
  };
};

function enAgo(minutes: number): string {
  if (minutes < 1) return "moments ago";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

function enDuration(minutes: number): string {
  if (minutes < 1) return "moments";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? "1 hour" : `${hours} hours`;
  const days = Math.round(hours / 24);
  return days === 1 ? "1 day" : `${days} days`;
}

function ltAgo(minutes: number): string {
  if (minutes < 1) return "ką tik";
  if (minutes < 60) return `prieš ${minutes} ${ltPlural(minutes, "minutę", "minutes", "minučių")}`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `prieš ${hours} ${ltPlural(hours, "valandą", "valandas", "valandų")}`;
  const days = Math.round(hours / 24);
  return `prieš ${days} ${ltPlural(days, "dieną", "dienas", "dienų")}`;
}

function ltDuration(minutes: number): string {
  if (minutes < 1) return "kelias akimirkas";
  if (minutes < 60) return `${minutes} ${ltPlural(minutes, "minutę", "minutes", "minučių")}`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ${ltPlural(hours, "valandą", "valandas", "valandų")}`;
  const days = Math.round(hours / 24);
  return `${days} ${ltPlural(days, "dieną", "dienas", "dienų")}`;
}

const en: SettingsCopy = {
  title: "Settings",
  subtitle: "Connect your terminal, and choose what reaches your inbox.",
  mt5CardTitle: "MetaTrader 5",
  emailCardTitle: "Email",
  mt5: {
    introLead:
      "A small program runs inside your MetaTrader and sends this desk what you traded. It only ever sends — it cannot place an order, cannot change one, and there is no password involved anywhere.",
    introStrong: "We never connect to your account; your terminal connects to us.",
    reasons: [
      "Every trade lands in the journal by itself — including the ones you would not have bothered to type in, which are usually the ones worth reading later.",
      "Open positions show what they risk while they are still open, not after.",
      "The stop, the size and the units per lot come from the terminal, so the risk and the result are exact rather than approximate.",
    ],
    keyCreatedWaiting: "Key created, waiting for the terminal",
    nothingReceivedFor: (duration) => `Nothing received for ${duration}`,
    terminalConnected: "Terminal connected",
    lastSent: (agoText, accountLogin, broker, tradeCount) =>
      `Last sent ${agoText}${accountLogin ? ` · account ${accountLogin}` : ""}${
        broker ? ` · ${broker}` : ""
      } · ${tradeCount} synced trade${tradeCount === 1 ? "" : "s"}`,
    nothingArrivedYet:
      "Nothing has arrived yet. Finish the steps below, then check the Experts tab in MetaTrader for a message from getALPHA.",
    goneQuietDetail:
      "Anything opened since then is missing from this desk. Usually MetaTrader is closed — it has to be running for trades to arrive. If it is open, check the Experts tab (Ctrl+T): no line beginning “getALPHA:” in the last two minutes means the program is not running, and the common reason is that a second Expert Advisor was attached to the same chart, which removes the first one silently.",
    tokenBoxTitle: "Copy this now — it is not shown again",
    tokenAriaLabel: "Your connection key",
    copyLabel: "Copy",
    copiedLabel: "Copied",
    steps: [
      {
        title: "Generate your key",
        body: "One click below. It is shown once and never stored, so keep it somewhere until the EA has it.",
      },
      {
        title: "Save the file into MetaTrader",
        body: "Download it, then in MT5 open File → Open Data Folder → MQL5 → Experts, and drop it in.",
      },
      {
        title: "Compile it — this is the step people miss",
        body: "Double-click getALPHA-Sync.mq5 to open it in MetaEditor and press F7. It should report 0 errors. Until you do this the Navigator will not list it: MetaTrader only shows compiled programs, and what you downloaded is the readable source.",
      },
      {
        title: "Give it a chart of its own",
        body: "Back in MT5, right-click Expert Advisors in the Navigator → Refresh. Open a fresh chart — File → New Chart, any symbol, it does not have to be one you trade — and drag getALPHA-Sync onto that. Paste the key into ConnectionToken and press OK. Keep this chart for getALPHA alone: MetaTrader runs one Expert Advisor per chart, so attaching another to the same chart removes this one without saying so.",
      },
      {
        title: "Allow it to reach us",
        body: "Tools → Options → Expert Advisors → tick “Allow WebRequest for listed URL” and add https://www.getalpha.org — MetaTrader blocks every outbound request until you do.",
      },
      {
        title: "Check that it is alive",
        body: "A smiling face appears in the top-right corner of that chart, and within two minutes the Experts tab (Ctrl+T) shows a line beginning “getALPHA:”. If AutoTrading in the toolbar is grey rather than green, press Ctrl+E. No getALPHA line after two minutes means it is not running, whatever the chart looks like.",
      },
    ],
    generateFailed: "Could not create a key. Try again.",
    disconnectFailed: "Could not disconnect. Try again.",
    networkError: "Could not reach the server.",
    working: "Working…",
    generateNewKey: "Generate a new key",
    generateMyKey: "Generate my key",
    downloadFile: "Download the file",
    disconnect: "Disconnect",
    footerNote:
      "Two things worth knowing before you start. MetaTrader has to be running for anything to arrive — close it and syncing stops until you open it again, at which point it catches up. And this only works on the desktop terminal: the phone app cannot run programs like this one.",
    time: { agoLabel: enAgo, durationLabel: enDuration },
  },
  email: {
    label: "Morning Session Brief",
    description:
      "One email before the London open, 07:30 UK time, with the same brief the desk shows. Off by default.",
    notEntitledNote:
      "The Session Brief is part of the Pro plan. This preference is saved, but no email is sent while the plan is inactive.",
    saveFailed: "Could not save. Try again.",
    networkError: "Could not reach the server. Check your connection.",
  },
};

const lt: SettingsCopy = {
  title: "Nustatymai",
  subtitle: "Prijunk savo terminalą ir pasirink, kas pasieks tavo pašto dėžutę.",
  mt5CardTitle: "MetaTrader 5",
  emailCardTitle: "El. paštas",
  mt5: {
    introLead:
      "Nedidelė programa veikia tavo MetaTrader viduje ir siunčia šiam skydeliui, kuo prekiavai. Ji tik siunčia — negali pateikti pavedimo, negali jo pakeisti, ir jokio slaptažodžio čia niekur nedalyvauja.",
    introStrong: "Mes niekada neprisijungiame prie tavo sąskaitos — tavo terminalas jungiasi prie mūsų.",
    reasons: [
      "Kiekvienas sandoris savaime atsiduria žurnale — įskaitant tuos, kurių pats nebūtum vargęs įvesti, o būtent jie dažniausiai verti perskaityti vėliau.",
      "Atviros pozicijos rodo, kuo rizikuoja, kol dar atviros, o ne po to.",
      "Stop lygis, dydis ir vieneto vertė lote ateina tiesiai iš terminalo, tad rizika ir rezultatas yra tikslūs, o ne apytiksliai.",
    ],
    keyCreatedWaiting: "Raktas sukurtas, laukiama terminalo",
    nothingReceivedFor: (duration) => `Nieko negauta jau ${duration}`,
    terminalConnected: "Terminalas prijungtas",
    lastSent: (agoText, accountLogin, broker, tradeCount) =>
      `Paskutinį kartą siųsta ${agoText}${accountLogin ? ` · sąskaita ${accountLogin}` : ""}${
        broker ? ` · ${broker}` : ""
      } · ${tradeCount} ${ltPlural(tradeCount, "sinchronizuotas sandoris", "sinchronizuoti sandoriai", "sinchronizuotų sandorių")}`,
    nothingArrivedYet:
      "Kol kas nieko negauta. Užbaik žingsnius žemiau, tada MetaTrader patikrink Experts skirtuką dėl žinutės iš getALPHA.",
    goneQuietDetail:
      "Viskas, kas atidaryta nuo tada, šiame skydelyje nematoma. Dažniausiai MetaTrader tiesiog uždarytas — jis turi veikti, kad sandoriai atkeliautų. Jei jis atidarytas, patikrink Experts skirtuką (Ctrl+T): jei per paskutines dvi minutes nėra eilutės, prasidedančios „getALPHA:“, reiškia programa neveikia, o dažniausia priežastis — prie to paties grafiko buvo prijungtas antras Expert Advisor, kuris pirmąjį pašalina be jokio pranešimo.",
    tokenBoxTitle: "Nukopijuok dabar — antrą kartą nebus parodyta",
    tokenAriaLabel: "Tavo prisijungimo raktas",
    copyLabel: "Kopijuoti",
    copiedLabel: "Nukopijuota",
    steps: [
      {
        title: "Sugeneruok savo raktą",
        body: "Vienas paspaudimas žemiau. Jis parodomas vieną kartą ir niekur nesaugomas, tad pasilaikyk jį kur nors, kol jį įves EA.",
      },
      {
        title: "Įrašyk failą į MetaTrader",
        body: "Atsisiųsk jį, tada MT5 atverk File → Open Data Folder → MQL5 → Experts ir įmesk ten.",
      },
      {
        title: "Sukompiliuok — šio žingsnio dažniausiai nepastebima",
        body: "Dukart spustelėk getALPHA-Sync.mq5, kad atsidarytų MetaEditor, ir paspausk F7. Turėtų parodyti 0 klaidų. Kol to nepadarysi, Navigator jo nerodys: MetaTrader rodo tik sukompiliuotas programas, o tu atsisiuntei skaitomą pirminį kodą.",
      },
      {
        title: "Skirk jam atskirą grafiką",
        body: "Grįžęs į MT5, dešiniuoju spustelėk Expert Advisors sąraše Navigator → Refresh. Atverk naują grafiką — File → New Chart, bet koks simbolis, jis neturi būti tas, kuriuo prekiauji — ir užtempk getALPHA-Sync ant jo. Įklijuok raktą į ConnectionToken ir spausk OK. Šį grafiką palik vien getALPHA: MetaTrader viename grafike veikia tik vienas Expert Advisor, tad prikabinus kitą prie to paties grafiko, šis pašalinamas be jokio pranešimo.",
      },
      {
        title: "Leisk jam pasiekti mus",
        body: "Tools → Options → Expert Advisors → pažymėk „Allow WebRequest for listed URL“ ir pridėk https://www.getalpha.org — kol to nepadarysi, MetaTrader blokuoja kiekvieną išeinantį užklausą.",
      },
      {
        title: "Patikrink, ar jis veikia",
        body: "To grafiko viršutiniame dešiniajame kampe pasirodo besišypsantis veidas, o per dvi minutes Experts skirtukas (Ctrl+T) parodo eilutę, prasidedančią „getALPHA:“. Jei AutoTrading įrankių juostoje pilkas, o ne žalias, paspausk Ctrl+E. Jei po dviejų minučių getALPHA eilutės nėra, jis neveikia, kad ir kaip grafikas atrodytų.",
      },
    ],
    generateFailed: "Nepavyko sukurti rakto. Bandyk dar kartą.",
    disconnectFailed: "Nepavyko atsijungti. Bandyk dar kartą.",
    networkError: "Nepavyko pasiekti serverio.",
    working: "Vykdoma…",
    generateNewKey: "Sugeneruoti naują raktą",
    generateMyKey: "Sugeneruoti mano raktą",
    downloadFile: "Atsisiųsti failą",
    disconnect: "Atsijungti",
    footerNote:
      "Prieš pradedant verta žinoti du dalykus. MetaTrader turi veikti, kad kas nors atkeliautų — uždarius jį, sinchronizavimas sustoja, kol vėl atidarysi, ir tada jis pasivys. Ir tai veikia tik su darbalaukio terminalu: telefono programėlė tokių programų paleisti negali.",
    time: { agoLabel: ltAgo, durationLabel: ltDuration },
  },
  email: {
    label: "Rytinė seanso apžvalga",
    description:
      "Vienas el. laiškas prieš Londono atidarymą, 07:30 JK laiku, su ta pačia apžvalga, kurią rodo skydelis. Pagal nutylėjimą išjungta.",
    notEntitledNote:
      "Seanso apžvalga yra Pro plano dalis. Šis pasirinkimas išsaugomas, bet kol planas neaktyvus, el. laiškas nesiunčiamas.",
    saveFailed: "Nepavyko išsaugoti. Bandyk dar kartą.",
    networkError: "Nepavyko pasiekti serverio. Patikrink ryšį.",
  },
};

const SETTINGS: Record<Locale, SettingsCopy> = { en, lt };

export function settingsCopy(locale: Locale): SettingsCopy {
  return SETTINGS[locale];
}

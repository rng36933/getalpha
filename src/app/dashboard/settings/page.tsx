import { auth } from "@clerk/nextjs/server";
import Card from "@/components/Card";
import CtraderConnect from "@/components/CtraderConnect";
import EmailPreferences from "@/components/EmailPreferences";
import Mt4Connect from "@/components/Mt4Connect";
import Mt5Connect from "@/components/Mt5Connect";
import PageHeader from "@/components/PageHeader";
import TradingViewConnect from "@/components/TradingViewConnect";
import DraggableGrid, {
  type GridItem,
} from "@/components/dashboard/DraggableGrid";
import { checkAccess } from "@/lib/billing/subscription";
import { SETTINGS_CARD_KEYS } from "@/lib/dashboard/card-keys";
import { loadOrder, resolveOrder } from "@/lib/dashboard/layout";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Settings",
};

type EmailPreferenceState = { dailyBrief: boolean; newsAlerts: boolean };

const NO_EMAIL_PREFERENCE: EmailPreferenceState = {
  dailyBrief: false,
  newsAlerts: false,
};

async function loadPreference(userId: string): Promise<EmailPreferenceState> {
  try {
    const row = await prisma.emailPreference.findUnique({ where: { userId } });
    return {
      dailyBrief: row?.dailyBrief ?? false,
      newsAlerts: row?.newsAlerts ?? false,
    };
  } catch (error) {
    // A settings page that fails to load is worse than one that shows the
    // default: the user can still set it, and the save is what matters.
    console.error("Could not read email preferences:", error);
    return NO_EMAIL_PREFERENCE;
  }
}

type TerminalState = {
  connected: boolean;
  accountLogin: string | null;
  broker: string | null;
  lastSeenAt: string | null;
  tradeCount: number;
};

const NO_TERMINAL: TerminalState = {
  connected: false,
  accountLogin: null,
  broker: null,
  lastSeenAt: null,
  tradeCount: 0,
};

/**
 * Shared by every platform — same shape, `platform`/`source` is what tells
 * the connections and their trade counts apart (see the `[userId, platform]`
 * and `[userId, source, externalId]` keys in schema.prisma). TradingView's
 * `accountLogin`/`broker` are always null here — an alert has no broker
 * account behind it — but `TradingViewConnect` simply doesn't render them.
 */
async function loadTerminal(
  userId: string,
  platform: "MT5" | "MT4" | "CTRADER" | "TRADINGVIEW",
): Promise<TerminalState> {
  try {
    const [connection, tradeCount] = await Promise.all([
      prisma.mtConnection.findUnique({ where: { userId_platform: { userId, platform } } }),
      prisma.trade.count({ where: { userId, source: platform } }),
    ]);

    if (!connection) return { ...NO_TERMINAL, tradeCount };

    return {
      connected: true,
      accountLogin: connection.accountLogin,
      broker: connection.broker,
      lastSeenAt: connection.lastSeenAt?.toISOString() ?? null,
      tradeCount,
    };
  } catch (error) {
    console.error(`Could not read the ${platform} connection:`, error);
    return NO_TERMINAL;
  }
}

export default async function SettingsPage() {
  const { userId } = await auth();

  const [emailPreference, access, mt5, mt4, ctrader, tradingview, savedOrder] = await Promise.all([
    userId ? loadPreference(userId) : Promise.resolve(NO_EMAIL_PREFERENCE),
    userId ? checkAccess(userId) : Promise.resolve({ allowed: false } as const),
    userId ? loadTerminal(userId, "MT5") : Promise.resolve(NO_TERMINAL),
    userId ? loadTerminal(userId, "MT4") : Promise.resolve(NO_TERMINAL),
    userId ? loadTerminal(userId, "CTRADER") : Promise.resolve(NO_TERMINAL),
    userId ? loadTerminal(userId, "TRADINGVIEW") : Promise.resolve(NO_TERMINAL),
    userId
      ? loadOrder(userId, "settings").catch((error) => {
          console.error("Could not read the settings layout:", error);
          return null;
        })
      : Promise.resolve(null),
  ]);

  // Every card shares this: CSS columns (below) is what makes a shorter card
  // let the next one flow up right after it instead of leaving a gap the
  // width of its own column — a real CSS Grid row can't do that, its row
  // height is always the tallest cell in it, which is the gap this was
  // fixing. `break-inside-avoid` is what stops a card from being sliced in
  // half across the column break.
  const cardClassName = "mb-4 break-inside-avoid";

  const items: GridItem[] = [
    {
      key: "mt5",
      className: cardClassName,
      children: (
        <Card title="MetaTrader 5" fill={false}>
          <Mt5Connect {...mt5} />
        </Card>
      ),
    },
    {
      key: "mt4",
      className: cardClassName,
      children: (
        <Card title="MetaTrader 4" fill={false}>
          <Mt4Connect {...mt4} />
        </Card>
      ),
    },
    {
      key: "ctrader",
      className: cardClassName,
      children: (
        <Card title="cTrader" fill={false}>
          <CtraderConnect {...ctrader} />
        </Card>
      ),
    },
    {
      key: "tradingview",
      className: cardClassName,
      children: (
        <Card title="TradingView" fill={false}>
          <TradingViewConnect
            connected={tradingview.connected}
            lastSeenAt={tradingview.lastSeenAt}
            tradeCount={tradingview.tradeCount}
          />
        </Card>
      ),
    },
    {
      key: "email",
      className: cardClassName,
      children: (
        <Card title="Email" fill={false}>
          <EmailPreferences
            initialDailyBrief={emailPreference.dailyBrief}
            initialNewsAlerts={emailPreference.newsAlerts}
            entitled={access.allowed}
          />
        </Card>
      ),
    },
  ];

  const order = resolveOrder(savedOrder ?? [], [...SETTINGS_CARD_KEYS]);

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Connect your terminal, and choose what reaches your inbox."
      />

      <DraggableGrid
        page="settings"
        items={items}
        initialOrder={order}
        // CSS columns, not CSS Grid: five cards of very different heights
        // (a connected terminal's status box alone adds several lines) means
        // a grid row-height forcing every card in it to match the tallest
        // reads as broken whitespace, not alignment. Columns let each card
        // take only the height it needs and the next one flow up right
        // after — see `cardClassName` above for the per-card half of this.
        // Four wide at xl so all four terminal cards sit in one row — two
        // columns is a fallback for anything narrower, not the intended
        // width once there's room for four.
        className="columns-1 gap-4 sm:columns-2 xl:columns-4 xl:max-w-none"
      />
    </>
  );
}

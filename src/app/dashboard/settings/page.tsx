import { auth } from "@clerk/nextjs/server";
import Card from "@/components/Card";
import EmailPreferences from "@/components/EmailPreferences";
import Mt4Connect from "@/components/Mt4Connect";
import Mt5Connect from "@/components/Mt5Connect";
import PageHeader from "@/components/PageHeader";
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
 * Shared by MT5 and MT4 — same shape, `platform`/`source` is what tells the
 * two connections and their trade counts apart (see the `[userId, platform]`
 * and `[userId, source, externalId]` keys in schema.prisma).
 */
async function loadTerminal(
  userId: string,
  platform: "MT5" | "MT4",
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

  const [emailPreference, access, mt5, mt4, savedOrder] = await Promise.all([
    userId ? loadPreference(userId) : Promise.resolve(NO_EMAIL_PREFERENCE),
    userId ? checkAccess(userId) : Promise.resolve({ allowed: false } as const),
    userId ? loadTerminal(userId, "MT5") : Promise.resolve(NO_TERMINAL),
    userId ? loadTerminal(userId, "MT4") : Promise.resolve(NO_TERMINAL),
    userId
      ? loadOrder(userId, "settings").catch((error) => {
          console.error("Could not read the settings layout:", error);
          return null;
        })
      : Promise.resolve(null),
  ]);

  const items: GridItem[] = [
    {
      key: "mt5",
      children: (
        <Card title="MetaTrader 5">
          <Mt5Connect {...mt5} />
        </Card>
      ),
    },
    {
      key: "mt4",
      children: (
        <Card title="MetaTrader 4">
          <Mt4Connect {...mt4} />
        </Card>
      ),
    },
    {
      key: "email",
      children: (
        <Card title="Email">
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
        className="grid max-w-2xl grid-cols-1 gap-4"
      />
    </>
  );
}

// getALPHA-Sync — cTrader cBot
//
// Sends this account's open positions and closed trades to getalpha.org, so
// the journal fills itself. It sends. It never receives instructions, never
// places an order and never modifies one. Read the code — that is the point
// of shipping it as source rather than as a compiled file.
//
// cTrader has no "drop a file into a folder" step like MT4/MT5: cTrader's
// Automate panel only recognises a cBot it created itself. Create a new
// cBot (Algo → cBots → New), then delete everything in the generated .cs
// file and paste this in its place. Build (F7 or the hammer icon), drag it
// onto a chart, paste your connection token into its parameters, and start
// it — same one-EA-per-chart caution as MT4/MT5 applies here too.
//
// [Robot(AccessRights = AccessRights.FullAccess)] is required for the
// outbound HTTP call — cTrader denies network access without it.
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using cAlgo.API;

namespace cAlgo.Robots
{
    [Robot(TimeZone = TimeZones.UTC, AccessRights = AccessRights.FullAccess)]
    public class GetAlphaSync : Robot
    {
        [Parameter("Connection Token", DefaultValue = "")]
        public string ConnectionToken { get; set; }

        // Keep under the dashboard's 15-min stale-connection threshold — see
        // src/lib/mt5/liveness.ts, shared across every platform.
        [Parameter("Sync Seconds", DefaultValue = 600, MinValue = 30)]
        public int SyncSeconds { get; set; }

        [Parameter("History Days", DefaultValue = 90, MinValue = 1)]
        public int HistoryDays { get; set; }

        private const string Endpoint = "https://www.getalpha.org/api/ctrader/sync";

        // How many trades one request may carry — the server refuses more and
        // rejects the request whole, taking the open positions riding in the
        // same payload down with it. Same limit MT5/MT4's EAs use.
        private const int MaxBatch = 1500;

        // How far back to re-read on top of what was already sent. Free to
        // resend a few: the server matches on the position id, so a repeat
        // updates the same row instead of creating a second one.
        private static readonly TimeSpan OverlapWindow = TimeSpan.FromSeconds(300);

        private static readonly HttpClient Http = new HttpClient { Timeout = TimeSpan.FromSeconds(15) };
        private static readonly JsonSerializerOptions JsonOptions = new JsonSerializerOptions
        {
            DefaultIgnoreCondition = JsonIgnoreCondition.Never,
        };

        // In-memory only. Unlike MT4/MT5's terminal-global-variable marker,
        // there is no equivalent durable slot documented as reliably
        // available across every cTrader build, and restarting is rare
        // enough in practice that resending the full History Days window
        // once on restart is an acceptable, honest trade-off over guessing
        // at a persistence API that might not exist. Resending is always
        // safe — the server dedups on ticket, same as everywhere else.
        private DateTime _marker;

        protected override void OnStart()
        {
            if (string.IsNullOrWhiteSpace(ConnectionToken))
            {
                Print("getALPHA: no connection token. Paste the one from Settings into the cBot parameters and restart it.");
                Stop();
                return;
            }

            _marker = Server.Time.AddDays(-HistoryDays);

            Timer.Start(TimeSpan.FromSeconds(Math.Max(SyncSeconds, 30)));
            Print("getALPHA: connected. Sending every {0}s.", SyncSeconds);

            // Fire and forget: OnStart cannot be async, and a slow first send
            // must not block cTrader's own startup.
            _ = SyncAsync();
        }

        protected override void OnTimer()
        {
            _ = SyncAsync();
        }

        protected override void OnStop()
        {
            Timer.Stop();
        }

        // en-US formatting for every price/number, regardless of the machine's
        // locale — a comma-decimal culture would silently corrupt the JSON.
        private static string Iso(DateTime value)
        {
            // Server.Time and every EntryTime/ClosingTime the API hands back
            // are already UTC — cTrader does not carry MT5's separate
            // "broker server time" concept, so there is no offset to convert.
            return value.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ");
        }

        private async Task SyncAsync()
        {
            var trades = new List<TradeDto>();
            var collectedAt = Server.Time;
            var oldestAllowed = collectedAt.AddDays(-HistoryDays);

            var marker = _marker > oldestAllowed ? _marker : oldestAllowed;
            var since = marker - OverlapWindow;
            if (since < oldestAllowed) since = oldestAllowed;

            var newestClose = since;
            var truncated = false;

            CollectOpenPositions(trades);
            CollectClosedTrades(trades, since, ref newestClose, ref truncated);

            if (trades.Count == 0)
            {
                if (!truncated) _marker = collectedAt;
                Print("getALPHA: nothing new to send.");
                return;
            }

            var body = new SyncBody
            {
                account = Account.Number.ToString(),
                broker = Account.BrokerName,
                currency = Account.Asset?.Name,
                trades = trades,
            };

            if (!await SendAsync(body))
                return;

            _marker = truncated ? newestClose : collectedAt;
            if (truncated)
                Print("getALPHA: more history to send, continuing next cycle.");
        }

        // Resent every cycle rather than tracked, so a stop the user moved
        // shows up without the cBot having to notice it moved — same
        // reasoning as MT5/MT4's open-position loop.
        private void CollectOpenPositions(List<TradeDto> trades)
        {
            foreach (var position in Positions)
            {
                var symbol = Symbols.GetSymbol(position.SymbolName);
                var lotSize = symbol != null && symbol.LotSize > 0 ? symbol.LotSize : 1;

                trades.Add(new TradeDto
                {
                    ticket = position.Id.ToString(),
                    symbol = position.SymbolName,
                    direction = position.TradeType == TradeType.Buy ? "BUY" : "SELL",
                    // cTrader quotes size in units, not lots — divided back to
                    // lots (and contractSize set to the unit count per lot) so
                    // this lands on the same wire shape MT5/MT4 already use,
                    // and R-multiple math stays comparable across platforms.
                    volume = position.VolumeInUnits / lotSize,
                    contractSize = lotSize,
                    entryPrice = position.EntryPrice,
                    stopLoss = position.StopLoss,
                    takeProfit = position.TakeProfit,
                    exitPrice = null,
                    profit = position.GrossProfit,
                    accountBalance = Account.Balance,
                    openedAt = Iso(position.EntryTime),
                    closedAt = null,
                    setup = string.IsNullOrWhiteSpace(position.Label) ? null : position.Label,
                });
            }
        }

        // Unlike MT5, cTrader needs no deal-pairing dance: a HistoricalTrade
        // already carries its open price, close price and position id in one
        // record, closer to how MT4 orders work than to MT5 positions.
        //
        // cAlgo's HistoricalTrade has no StopLoss/TakeProfit of its own — the
        // API simply does not expose what protected a position once it has
        // closed, so those two fields are honestly sent null here rather than
        // guessed at from the position's last known values.
        private void CollectClosedTrades(List<TradeDto> trades, DateTime since, ref DateTime newestClose, ref bool truncated)
        {
            truncated = false;

            // Oldest first, matching the contract the other EAs already rely
            // on: a truncated batch must be the earliest part of the range,
            // so the caller's marker follows `newestClose`, not "now".
            var closed = History
                .Where(t => t.ClosingTime > since)
                .OrderBy(t => t.ClosingTime)
                .ToList();

            foreach (var trade in closed)
            {
                var symbol = Symbols.GetSymbol(trade.SymbolName);
                var lotSize = symbol != null && symbol.LotSize > 0 ? symbol.LotSize : 1;

                trades.Add(new TradeDto
                {
                    ticket = trade.PositionId.ToString(),
                    symbol = trade.SymbolName,
                    direction = trade.TradeType == TradeType.Buy ? "BUY" : "SELL",
                    volume = trade.VolumeInUnits / lotSize,
                    contractSize = lotSize,
                    entryPrice = trade.EntryPrice,
                    stopLoss = null,
                    takeProfit = null,
                    exitPrice = trade.ClosingPrice,
                    profit = trade.GrossProfit,
                    accountBalance = Account.Balance,
                    openedAt = Iso(trade.EntryTime),
                    closedAt = Iso(trade.ClosingTime),
                    setup = string.IsNullOrWhiteSpace(trade.Label) ? null : trade.Label,
                });

                if (trade.ClosingTime > newestClose)
                    newestClose = trade.ClosingTime;

                if (trades.Count >= MaxBatch)
                {
                    truncated = true;
                    return;
                }
            }
        }

        // Returns true only when the server confirmed it stored the batch.
        // The caller advances its marker on that answer and on nothing else.
        private async Task<bool> SendAsync(SyncBody body)
        {
            try
            {
                var json = JsonSerializer.Serialize(body, JsonOptions);

                using var request = new HttpRequestMessage(HttpMethod.Post, Endpoint)
                {
                    Content = new StringContent(json, Encoding.UTF8, "application/json"),
                };
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", ConnectionToken);

                using var response = await Http.SendAsync(request);

                if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
                {
                    Print("getALPHA: the connection token was rejected. Generate a new one in Settings and paste it into the cBot parameters.");
                    return false;
                }

                if (!response.IsSuccessStatusCode)
                {
                    var text = await response.Content.ReadAsStringAsync();
                    Print("getALPHA: server replied {0}. {1}", (int)response.StatusCode, text);
                    return false;
                }

                Print("getALPHA: sent {0} trade(s).", body.trades.Count);
                return true;
            }
            catch (Exception ex)
            {
                Print("getALPHA: could not reach the server ({0}). It will try again in {1}s.", ex.Message, SyncSeconds);
                return false;
            }
        }

        private class TradeDto
        {
            public string ticket { get; set; }
            public string symbol { get; set; }
            public string direction { get; set; }
            public double volume { get; set; }
            public double contractSize { get; set; }
            public double entryPrice { get; set; }
            public double? stopLoss { get; set; }
            public double? takeProfit { get; set; }
            public double? exitPrice { get; set; }
            public double profit { get; set; }
            public double? accountBalance { get; set; }
            public string openedAt { get; set; }
            public string closedAt { get; set; }
            public string setup { get; set; }
        }

        private class SyncBody
        {
            public string account { get; set; }
            public string broker { get; set; }
            public string currency { get; set; }
            public List<TradeDto> trades { get; set; }
        }
    }
}

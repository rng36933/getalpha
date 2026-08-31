//+------------------------------------------------------------------+
//|                                                getALPHA-Sync.mq4 |
//|  Sends this terminal's open orders and closed trades to           |
//|  getalpha.org, so the journal fills itself.                       |
//|                                                                   |
//|  It sends. It never receives instructions, never places an order  |
//|  and never modifies one. Read the code — that is the point of     |
//|  shipping it as source rather than as a compiled file.            |
//|                                                                   |
//|  The MT4 twin of getALPHA-Sync.mq5. Same wire protocol, same      |
//|  sync/marker design — MQL4 has no "position" concept distinct     |
//|  from an order, so one order IS one trade from open to close and  |
//|  the deal-pairing the MT5 version needs simply does not apply     |
//|  here. Read that file's comments for the reasoning this one       |
//|  inherits; only what's genuinely different is re-explained below. |
//+------------------------------------------------------------------+
#property copyright "getALPHA"
#property link      "https://www.getalpha.org"
#property version   "1.00"
#property strict
#property description "Sends open orders and closed trades to getALPHA."
#property description "Never places or modifies an order."

input string ConnectionToken = "";          // Connection token from Settings
input int    SyncSeconds     = 600;         // How often to send, in seconds (keep under the dashboard's 15-min stale-connection threshold — see src/lib/mt5/liveness.ts, shared with MT4)
input int    HistoryDays     = 90;          // How far back to send on first run

const string ENDPOINT = "https://www.getalpha.org/api/mt4/sync";

//--- How many trades one request may carry. Same server limit as MT5's EA.
#define MAX_BATCH 1500

//--- How far back to re-read on top of what was already sent. Same reasoning
//    as the MT5 EA: free to resend a few, the server matches on ticket.
#define OVERLAP_SECONDS 300

//--- Where the marker is kept between runs — a terminal global variable, keyed
//    by account so two accounts in one terminal cannot inherit each other's.
string MarkerName()
  {
   return "getALPHA_mt4_sent_" + IntegerToString(AccountNumber());
  }

//+------------------------------------------------------------------+
int OnInit()
  {
   if(StringLen(ConnectionToken) == 0)
     {
      Print("getALPHA: no connection token. Paste the one from Settings ",
            "into the EA inputs and re-attach it.");
      return(INIT_FAILED);
     }

   // A timer, not OnTick. WebRequest blocks the thread it runs on, and doing
   // that on every incoming quote would stall the terminal.
   EventSetTimer(SyncSeconds < 30 ? 30 : SyncSeconds);

   Print("getALPHA: connected. Sending every ", SyncSeconds, "s.");
   Sync();

   return(INIT_SUCCEEDED);
  }

//+------------------------------------------------------------------+
void OnDeinit(const int reason)
  {
   EventKillTimer();
  }

//+------------------------------------------------------------------+
void OnTimer()
  {
   Sync();
  }

//+------------------------------------------------------------------+
//| JSON escaping. Broker symbol names and comments contain quotes    |
//| and backslashes often enough to matter.                           |
//+------------------------------------------------------------------+
string JsonEscape(const string value)
  {
   string out = "";
   int length = StringLen(value);

   for(int i = 0; i < length; i++)
     {
      ushort ch = StringGetCharacter(value, i);

      if(ch == '"')            out += "\\\"";
      else if(ch == '\\')      out += "\\\\";
      else if(ch == '\n')      out += "\\n";
      else if(ch == '\r')      out += "\\r";
      else if(ch == '\t')      out += "\\t";
      else if(ch < 32)         out += " ";
      else                     out += ShortToString(ch);
     }

   return(out);
  }

//+------------------------------------------------------------------+
string JsonNumber(const double value, const int digits)
  {
   return(DoubleToString(value, digits));
  }

//+------------------------------------------------------------------+
//| ISO 8601 in UTC. MT4 server time is the broker's, which is not    |
//| ours and not the user's, so it is converted once here rather than |
//| guessed at the other end.                                         |
//+------------------------------------------------------------------+
string IsoUtc(const datetime value)
  {
   if(value <= 0)
      return("null");

   // Server time minus the server's offset from GMT.
   datetime utc = value - (TimeCurrent() - TimeGMT());
   MqlDateTime parts;
   TimeToStruct(utc, parts);

   return(StringFormat("\"%04d-%02d-%02dT%02d:%02d:%02dZ\"",
                       parts.year, parts.mon, parts.day,
                       parts.hour, parts.min, parts.sec));
  }

//+------------------------------------------------------------------+
//| One trade object. `ticket` is the MT4 order ticket — one order    |
//| is one trade here, unlike MT5's open/close deal pair.             |
//+------------------------------------------------------------------+
string TradeJson(const string ticket, const string symbol, const string direction,
                 const double volume, const double contractSize,
                 const double entry, const double stop, const double target,
                 const double exit, const double profit,
                 const datetime opened, const datetime closed,
                 const string comment)
  {
   int digits = (int)MarketInfo(symbol, MODE_DIGITS);
   if(digits <= 0)
      digits = 5;

   string json = "{";
   json += "\"ticket\":\"" + JsonEscape(ticket) + "\",";
   json += "\"symbol\":\"" + JsonEscape(symbol) + "\",";
   json += "\"direction\":\"" + direction + "\",";
   json += "\"volume\":" + JsonNumber(volume, 2) + ",";
   json += "\"contractSize\":" + JsonNumber(contractSize, 2) + ",";
   json += "\"entryPrice\":" + JsonNumber(entry, digits) + ",";
   json += "\"stopLoss\":" + (stop > 0 ? JsonNumber(stop, digits) : "null") + ",";
   json += "\"takeProfit\":" + (target > 0 ? JsonNumber(target, digits) : "null") + ",";
   json += "\"exitPrice\":" + (exit > 0 ? JsonNumber(exit, digits) : "null") + ",";
   json += "\"profit\":" + JsonNumber(profit, 2) + ",";
   json += "\"accountBalance\":" + JsonNumber(AccountBalance(), 2) + ",";
   json += "\"openedAt\":" + IsoUtc(opened) + ",";
   json += "\"closedAt\":" + IsoUtc(closed) + ",";
   // The order comment — the closest thing to a stated reason for the trade
   // that MT4 carries. Empty for anything opened by hand.
   json += "\"setup\":" + (StringLen(comment) > 0 ? "\"" + JsonEscape(comment) + "\"" : "null");
   json += "}";

   return(json);
  }

//+------------------------------------------------------------------+
void Sync()
  {
   string trades[];
   int count = 0;

   datetime collectedAt = TimeCurrent();
   datetime oldestAllowed = collectedAt - (datetime)HistoryDays * 24 * 60 * 60;

   datetime marker = oldestAllowed;

   if(GlobalVariableCheck(MarkerName()))
     {
      datetime saved = (datetime)GlobalVariableGet(MarkerName());

      if(saved > marker)
         marker = saved;
     }

   datetime since = marker - OVERLAP_SECONDS;
   if(since < oldestAllowed)
      since = oldestAllowed;

   datetime newestClose = since;
   bool truncated = false;

   CollectOpenOrders(trades, count);
   CollectClosedOrders(trades, count, since, newestClose, truncated);

   if(count == 0)
     {
      if(!truncated)
         GlobalVariableSet(MarkerName(), (double)collectedAt);

      Print("getALPHA: nothing new to send.");
      return;
     }

   string body = "{";
   body += "\"account\":\"" + JsonEscape(IntegerToString(AccountNumber())) + "\",";
   body += "\"broker\":\"" + JsonEscape(AccountCompany()) + "\",";
   body += "\"currency\":\"" + JsonEscape(AccountCurrency()) + "\",";
   body += "\"trades\":[";

   for(int i = 0; i < count; i++)
     {
      if(i > 0)
         body += ",";
      body += trades[i];
     }

   body += "]}";

   if(!Send(body, count))
      return;

   GlobalVariableSet(MarkerName(), (double)(truncated ? newestClose : collectedAt));

   if(truncated)
      Print("getALPHA: more history to send, continuing next cycle.");
  }

//+------------------------------------------------------------------+
//| Open orders. Resent every cycle rather than tracked, so a stop    |
//| the user moved shows up without the EA having to notice it moved. |
//| Pending orders (buy/sell limit/stop) are skipped — they are not   |
//| trades until they trigger, at which point OrderType() becomes     |
//| OP_BUY/OP_SELL and this loop picks them up.                       |
//+------------------------------------------------------------------+
void CollectOpenOrders(string &trades[], int &count)
  {
   int total = OrdersTotal();

   for(int i = 0; i < total; i++)
     {
      if(!OrderSelect(i, SELECT_BY_POS, MODE_TRADES))
         continue;

      int type = OrderType();
      if(type != OP_BUY && type != OP_SELL)
         continue;

      string symbol = OrderSymbol();
      double contractSize = MarketInfo(symbol, MODE_LOTSIZE);
      if(contractSize <= 0)
         contractSize = 1;

      ArrayResize(trades, count + 1);
      trades[count] = TradeJson(
         IntegerToString(OrderTicket()),
         symbol,
         type == OP_BUY ? "BUY" : "SELL",
         OrderLots(),
         contractSize,
         OrderOpenPrice(),
         OrderStopLoss(),
         OrderTakeProfit(),
         0,                                   // still open
         OrderProfit(),
         OrderOpenTime(),
         0,
         OrderComment());

      count++;
     }
  }

//+------------------------------------------------------------------+
//| Closed orders. Unlike MT5, an MT4 order needs no deal-pairing —   |
//| the order itself carries its open price, close price and final   |
//| stop/target, from open to close, in one record.                  |
//+------------------------------------------------------------------+
void CollectClosedOrders(string &trades[], int &count,
                         const datetime since,
                         datetime &newestClose, bool &truncated)
  {
   newestClose = since;
   truncated   = false;

   int total = OrdersHistoryTotal();

   // History comes back oldest first in MT4 too, same as MT5's deal order —
   // the truncation contract below (marker follows `newestClose`, not "now")
   // depends on that.
   for(int i = 0; i < total; i++)
     {
      if(!OrderSelect(i, SELECT_BY_POS, MODE_HISTORY))
         continue;

      int type = OrderType();
      if(type != OP_BUY && type != OP_SELL)
         continue;

      datetime closedAt = OrderCloseTime();
      if(closedAt == 0 || closedAt <= since)
         continue;

      string symbol = OrderSymbol();
      double contractSize = MarketInfo(symbol, MODE_LOTSIZE);
      if(contractSize <= 0)
         contractSize = 1;

      ArrayResize(trades, count + 1);
      trades[count] = TradeJson(
         IntegerToString(OrderTicket()),
         symbol,
         type == OP_BUY ? "BUY" : "SELL",
         OrderLots(),
         contractSize,
         OrderOpenPrice(),
         OrderStopLoss(),
         OrderTakeProfit(),
         OrderClosePrice(),
         OrderProfit(),
         OrderOpenTime(),
         closedAt,
         OrderComment());

      count++;

      if(closedAt > newestClose)
         newestClose = closedAt;

      // The server refuses oversized batches; stop well short of its limit.
      if(count >= MAX_BATCH)
        {
         truncated = true;
         return;
        }
     }
  }

//+------------------------------------------------------------------+
//| Returns true only when the server confirmed it stored the batch. The       |
//| caller advances its marker on that answer and on nothing else.             |
bool Send(const string body, const int count)
  {
   char post[];
   char result[];
   string responseHeaders;

   // WHOLE_ARRAY, not StringLen(body) — same trap as the MT5 EA hit: an
   // explicit count copies exactly that many characters with no terminating
   // zero, so trimming one more byte below would remove the closing brace
   // instead of the null terminator.
   StringToCharArray(body, post, 0, WHOLE_ARRAY, CP_UTF8);
   ArrayResize(post, ArraySize(post) - 1);

   string headers = "Content-Type: application/json\r\n"
                    "Authorization: Bearer " + ConnectionToken + "\r\n";

   ResetLastError();
   int status = WebRequest("POST", ENDPOINT, headers, 10000, post, result, responseHeaders);

   if(status == -1)
     {
      int error = GetLastError();

      if(error == 4014)
         Print("getALPHA: MetaTrader is blocking the request. Tools -> Options -> ",
               "Expert Advisors -> tick 'Allow WebRequest for listed URL' and add ",
               "https://www.getalpha.org");
      else
         Print("getALPHA: could not reach the server, error ", error,
               ". It will try again in ", SyncSeconds, "s.");

      return(false);
     }

   if(status == 401)
     {
      Print("getALPHA: the connection token was rejected. Generate a new one in ",
            "Settings and paste it into the EA inputs.");
      return(false);
     }

   if(status < 200 || status >= 300)
     {
      Print("getALPHA: server replied ", status, ". ", CharArrayToString(result, 0, WHOLE_ARRAY, CP_UTF8));
      return(false);
     }

   Print("getALPHA: sent ", count, " trade(s).");
   return(true);
  }
//+------------------------------------------------------------------+

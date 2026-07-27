//+------------------------------------------------------------------+
//|                                                getALPHA-Sync.mq5 |
//|  Sends this terminal's open positions and closed trades to        |
//|  getalpha.org, so the journal fills itself.                       |
//|                                                                   |
//|  It sends. It never receives instructions, never places an order  |
//|  and never modifies one. Read the code — that is the point of     |
//|  shipping it as source rather than as a compiled file.            |
//+------------------------------------------------------------------+
#property copyright "getALPHA"
#property link      "https://www.getalpha.org"
#property version   "1.00"
#property strict
#property description "Sends open positions and closed trades to getALPHA."
#property description "Never places or modifies an order."

input string ConnectionToken = "";          // Connection token from Settings
input int    SyncSeconds     = 120;         // How often to send, in seconds
input int    HistoryDays     = 90;          // How far back to send on first run

const string ENDPOINT = "https://www.getalpha.org/api/mt5/sync";

//--- How many trades one request may carry.
//
// The server refuses more than 2000 and rejects the request whole, taking the
// open positions in the same payload down with the history. Stopping short of
// that leaves room for those positions and for a broker whose symbol names are
// unusually long.
#define MAX_BATCH 1500

//--- How far back to re-read on top of what was already sent.
//
// Trades that close within the same second as the marker would otherwise fall
// through the gap, and the terminal's clock is the broker's rather than ours.
// Resending a few is free: the server matches on the position ticket, so a
// repeat updates the same row instead of creating a second one.
#define OVERLAP_SECONDS 300

//--- Where the marker is kept between runs.
//
// A terminal global variable rather than a file: it survives a restart, which
// is the case that matters, and it costs no file handle. Keyed by account, so
// two accounts in one terminal cannot inherit each other's position.
string MarkerName()
  {
   return "getALPHA_sent_" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN));
  }

//+------------------------------------------------------------------+
int OnInit()
  {
   if(StringLen(ConnectionToken) == 0)
     {
      Print("getALPHA: no connection token. Paste the one from Settings ",
            "into the EA inputs and re-attach it.");
      return INIT_FAILED;
     }

   // A timer, not OnTick. WebRequest blocks the thread it runs on, and doing
   // that on every incoming quote would stall the terminal.
   EventSetTimer(SyncSeconds < 30 ? 30 : SyncSeconds);

   Print("getALPHA: connected. Sending every ", SyncSeconds, "s.");
   Sync();

   return INIT_SUCCEEDED;
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

   return out;
  }

//+------------------------------------------------------------------+
string JsonNumber(const double value, const int digits)
  {
   return DoubleToString(value, digits);
  }

//+------------------------------------------------------------------+
//| ISO 8601 in UTC. MT5 server time is the broker's, which is not    |
//| ours and not the user's, so it is converted once here rather than |
//| guessed at the other end.                                         |
//+------------------------------------------------------------------+
string IsoUtc(const datetime value)
  {
   if(value <= 0)
      return "null";

   // Server time minus the server's offset from GMT.
   datetime utc = value - (TimeCurrent() - TimeGMT());
   MqlDateTime parts;
   TimeToStruct(utc, parts);

   return StringFormat("\"%04d-%02d-%02dT%02d:%02d:%02dZ\"",
                       parts.year, parts.mon, parts.day,
                       parts.hour, parts.min, parts.sec);
  }

//+------------------------------------------------------------------+
//| One trade object. `ticket` is the POSITION ticket, so an open     |
//| position and the closed trade it becomes are the same record.     |
//+------------------------------------------------------------------+
string TradeJson(const string ticket, const string symbol, const string direction,
                 const double volume, const double contractSize,
                 const double entry, const double stop, const double target,
                 const double exit, const double profit,
                 const datetime opened, const datetime closed)
  {
   int digits = (int)SymbolInfoInteger(symbol, SYMBOL_DIGITS);
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
   json += "\"accountBalance\":" + JsonNumber(AccountInfoDouble(ACCOUNT_BALANCE), 2) + ",";
   json += "\"openedAt\":" + IsoUtc(opened) + ",";
   json += "\"closedAt\":" + IsoUtc(closed);
   json += "}";

   return json;
  }

//+------------------------------------------------------------------+
void Sync()
  {
   string trades[];
   int count = 0;

   datetime collectedAt = TimeCurrent();
   datetime oldestAllowed = collectedAt - (datetime)HistoryDays * 24 * 60 * 60;

   // What was already sent, or the start of the history window on a first run.
   //
   // This is the fix for a real defect: the whole ninety-day history used to be
   // rebuilt and resent every single cycle, forever. It worked only because the
   // account was small — past the server's batch limit every request would have
   // been rejected whole, and the open positions riding along in the same
   // payload would have stopped arriving with it. The symptom would have been
   // "my open positions are missing", which says nothing about history size.
   datetime marker = oldestAllowed;

   if(GlobalVariableCheck(MarkerName()))
     {
      datetime saved = (datetime)GlobalVariableGet(MarkerName());

      // Never reach further back than the user's chosen depth, however long the
      // terminal was off; and never further forward than it, either.
      if(saved > marker)
         marker = saved;
     }

   datetime since = marker - OVERLAP_SECONDS;
   if(since < oldestAllowed)
      since = oldestAllowed;

   datetime newestClose = since;
   bool truncated = false;

   CollectOpenPositions(trades, count);
   CollectClosedTrades(trades, count, since, newestClose, truncated);

   if(count == 0)
     {
      // Nothing new is the normal state of a quiet market, not a fault. The
      // marker still moves: having nothing to send is proof that everything up
      // to now has been sent.
      if(!truncated)
         GlobalVariableSet(MarkerName(), (double)collectedAt);

      Print("getALPHA: nothing new to send.");
      return;
     }

   string body = "{";
   body += "\"account\":\"" + JsonEscape(IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN))) + "\",";
   body += "\"broker\":\"" + JsonEscape(AccountInfoString(ACCOUNT_COMPANY)) + "\",";
   body += "\"currency\":\"" + JsonEscape(AccountInfoString(ACCOUNT_CURRENCY)) + "\",";
   body += "\"trades\":[";

   for(int i = 0; i < count; i++)
     {
      if(i > 0)
         body += ",";
      body += trades[i];
     }

   body += "]}";

   // The marker moves only on a confirmed 2xx. Advancing it on a failed send
   // would treat trades the server never received as delivered, and they would
   // never be offered again.
   if(!Send(body, count))
      return;

   // A truncated batch means the oldest part of the range went out and the rest
   // did not, so the marker follows the newest trade actually included and the
   // next cycle picks up from there. Otherwise everything up to the moment of
   // collection is on the server.
   GlobalVariableSet(MarkerName(), (double)(truncated ? newestClose : collectedAt));

   if(truncated)
      Print("getALPHA: more history to send, continuing next cycle.");
  }

//+------------------------------------------------------------------+
//| Open positions. Resent every cycle rather than tracked, so a stop |
//| the user moved shows up without the EA having to notice it moved. |
//+------------------------------------------------------------------+
void CollectOpenPositions(string &trades[], int &count)
  {
   int total = PositionsTotal();

   for(int i = 0; i < total; i++)
     {
      ulong ticket = PositionGetTicket(i);
      if(ticket == 0)
         continue;

      string symbol = PositionGetString(POSITION_SYMBOL);
      long   type   = PositionGetInteger(POSITION_TYPE);

      double contractSize = SymbolInfoDouble(symbol, SYMBOL_TRADE_CONTRACT_SIZE);
      if(contractSize <= 0)
         contractSize = 1;

      ArrayResize(trades, count + 1);
      trades[count] = TradeJson(
         IntegerToString((long)ticket),
         symbol,
         type == POSITION_TYPE_BUY ? "BUY" : "SELL",
         PositionGetDouble(POSITION_VOLUME),
         contractSize,
         PositionGetDouble(POSITION_PRICE_OPEN),
         PositionGetDouble(POSITION_SL),
         PositionGetDouble(POSITION_TP),
         0,                                   // still open
         PositionGetDouble(POSITION_PROFIT),
         (datetime)PositionGetInteger(POSITION_TIME),
         0);

      count++;
     }
  }

//+------------------------------------------------------------------+
//| Closed trades, rebuilt from deal history.                         |
//|                                                                   |
//| A position is opened by one deal and closed by another, and both  |
//| carry the same POSITION_ID. Walking the deals and pairing them by  |
//| that id gives one record per trade rather than two halves.         |
//+------------------------------------------------------------------+
void CollectClosedTrades(string &trades[], int &count,
                         const datetime since,
                         datetime &newestClose, bool &truncated)
  {
   newestClose = since;
   truncated   = false;

   // The FULL history window is selected even when only the last few minutes
   // are being sent, and that is not waste. A position closed a moment ago may
   // have been opened weeks ago, and its opening deal carries the entry price;
   // narrow the selection to the window being sent and that deal falls outside
   // it, the entry price reads zero, and the loop below discards the trade as a
   // half record. Every position held longer than one sync interval would
   // silently never arrive.
   //
   // Selecting is local and cheap. What was expensive is the network payload,
   // and that is what `since` trims.
   datetime from = TimeCurrent() - (datetime)HistoryDays * 24 * 60 * 60;

   if(!HistorySelect(from, TimeCurrent()))
     {
      Print("getALPHA: could not read trade history.");
      return;
     }

   int deals = HistoryDealsTotal();

   for(int i = 0; i < deals; i++)
     {
      ulong dealTicket = HistoryDealGetTicket(i);
      if(dealTicket == 0)
         continue;

      // Only the closing side, so each position is emitted once.
      if(HistoryDealGetInteger(dealTicket, DEAL_ENTRY) != DEAL_ENTRY_OUT)
         continue;

      // Already sent on an earlier cycle. A closed trade never changes, so
      // resending it only costs bandwidth and a needless database write.
      datetime closedAt = (datetime)HistoryDealGetInteger(dealTicket, DEAL_TIME);
      if(closedAt <= since)
         continue;

      long positionId = HistoryDealGetInteger(dealTicket, DEAL_POSITION_ID);
      if(positionId == 0)
         continue;

      string symbol = HistoryDealGetString(dealTicket, DEAL_SYMBOL);

      double entryPrice = 0;
      datetime openedAt = 0;
      long   entryType  = -1;
      double stop       = 0;
      double target     = 0;

      // Find the opening deal of the same position.
      for(int j = 0; j < deals; j++)
        {
         ulong other = HistoryDealGetTicket(j);
         if(other == 0)
            continue;
         if(HistoryDealGetInteger(other, DEAL_POSITION_ID) != positionId)
            continue;
         if(HistoryDealGetInteger(other, DEAL_ENTRY) != DEAL_ENTRY_IN)
            continue;

         entryPrice = HistoryDealGetDouble(other, DEAL_PRICE);
         openedAt   = (datetime)HistoryDealGetInteger(other, DEAL_TIME);
         entryType  = HistoryDealGetInteger(other, DEAL_TYPE);
         break;
        }

      // Without the opening deal there is no entry price, and a trade with no
      // entry is not a trade. Skipped rather than sent as a half record.
      if(entryPrice <= 0 || openedAt == 0)
         continue;

      double contractSize = SymbolInfoDouble(symbol, SYMBOL_TRADE_CONTRACT_SIZE);
      if(contractSize <= 0)
         contractSize = 1;

      // The stop and target the position carried when it closed, if the
      // history holds them.
      if(HistoryOrderSelect(positionId))
        {
         stop   = HistoryOrderGetDouble(positionId, ORDER_SL);
         target = HistoryOrderGetDouble(positionId, ORDER_TP);
        }

      ArrayResize(trades, count + 1);
      trades[count] = TradeJson(
         IntegerToString(positionId),
         symbol,
         entryType == DEAL_TYPE_BUY ? "BUY" : "SELL",
         HistoryDealGetDouble(dealTicket, DEAL_VOLUME),
         contractSize,
         entryPrice,
         stop,
         target,
         HistoryDealGetDouble(dealTicket, DEAL_PRICE),
         HistoryDealGetDouble(dealTicket, DEAL_PROFIT),
         openedAt,
         closedAt);

      count++;

      if(closedAt > newestClose)
         newestClose = closedAt;

      // The server refuses oversized batches; stop well short of its limit.
      //
      // Deals come back oldest first, so a truncated batch is the *earliest*
      // trades of the range, not the latest. The caller must therefore move its
      // marker only as far as `newestClose` — moving it to "now" would declare
      // everything sent and skip the remainder for good.
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

   // WHOLE_ARRAY, not StringLen(body). Given an explicit count, MQL5 copies
   // exactly that many characters and appends no terminating zero — so the
   // resize below removed the last real byte instead, the closing brace, and
   // every sync was rejected as invalid JSON one character short of correct.
   StringToCharArray(body, post, 0, WHOLE_ARRAY, CP_UTF8);
   // The whole-string copy does append a terminating zero, and sending that
   // byte would itself make the body invalid. This drops exactly that byte.
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

      return false;
     }

   if(status == 401)
     {
      Print("getALPHA: the connection token was rejected. Generate a new one in ",
            "Settings and paste it into the EA inputs.");
      return false;
     }

   if(status < 200 || status >= 300)
     {
      Print("getALPHA: server replied ", status, ". ", CharArrayToString(result, 0, WHOLE_ARRAY, CP_UTF8));
      return false;
     }

   Print("getALPHA: sent ", count, " trade(s).");
   return true;
  }
//+------------------------------------------------------------------+

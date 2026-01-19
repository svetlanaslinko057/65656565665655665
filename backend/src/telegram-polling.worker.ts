/**
 * Telegram Polling Worker (TEMPORARY FIX)
 * 
 * This is a workaround for Kubernetes Ingress issue
 * Uses polling instead of webhook until infrastructure is fixed
 * 
 * TEMPORARY - Remove when ingress routing for /api/* is fixed
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';
const POLL_INTERVAL = 1000; // 1 second

let offset = 0;
let isPolling = false;

/**
 * Process incoming update (same logic as webhook handler)
 */
async function processUpdate(update: any) {
  const message = update.message;
  if (!message) return;

  const chatId = message.chat.id.toString();
  const text = message.text || '';
  const username = message.from?.username;
  const firstName = message.from?.first_name;

  console.log(`[TG Polling] Incoming update from chatId: ${chatId}, text: "${text}"`);

  try {
    // Import telegram service dynamically
    const telegramService = await import('./core/notifications/telegram.service.js');

    // Handle /start with code
    if (text.startsWith('/start ')) {
      const code = text.replace('/start ', '').trim();
      const connection = await telegramService.TelegramConnectionModel.findOne({ code });

      if (connection?.userId) {
        await telegramService.saveTelegramConnection(
          connection.userId,
          chatId,
          username,
          firstName
        );
        await telegramService.sendTelegramMessage(
          chatId,
          `✅ <b>Telegram connected successfully</b>

You'll now receive alerts here when your monitored tokens or wallets show important activity.

ℹ️ <b>What happens next:</b>
• Create alert rules on the website
• I'll notify you when conditions are met
• You can mute or adjust alerts anytime

Type /help for available commands.`,
          { parseMode: 'HTML' }
        );
      } else {
        await telegramService.sendTelegramMessage(
          chatId,
          `❌ <b>Invalid connection code</b>

Please get a new connection link from the website and try again.

Or type /start for more information.`,
          { parseMode: 'HTML' }
        );
      }
    }
    // Handle plain /start
    else if (text === '/start') {
      await telegramService.sendTelegramMessage(
        chatId,
        `👋 <b>Welcome to FOMO Alerts</b>

This bot notifies you when important on-chain behavior is detected.

You'll receive alerts about:
• Large transfers
• Consistent buying or selling  
• Smart money activity
• Unusual wallet or token behavior

🔔 Alerts are sent only when conditions you selected are met — no spam.

<b>To get started:</b>
1. Go to crypto-insights-52.preview.emergentagent.com
2. Track a token or wallet
3. Create an alert

Once alerts are active, notifications will appear here automatically.

Type /help anytime for commands.`,
        { parseMode: 'HTML' }
      );
    }
    // Handle /help
    else if (text === '/help') {
      await telegramService.sendTelegramMessage(
        chatId,
        `📖 <b>Available Commands</b>

/start - Welcome message & setup guide
/status - Check your connection status
/disconnect - Stop receiving alerts
/help - Show this message

<b>How it works:</b>
This bot only sends notifications. All setup (alerts, tracking) happens on the website.

🌐 Visit: crypto-insights-52.preview.emergentagent.com`,
        { parseMode: 'HTML' }
      );
    }
    // Handle /status
    else if (text === '/status') {
      const connection = await telegramService.TelegramConnectionModel.findOne({ chatId });

      if (connection?.isActive) {
        await telegramService.sendTelegramMessage(
          chatId,
          `✅ <b>Connection Active</b>

Connected: ${connection.connectedAt.toLocaleDateString()}
You're receiving alerts when your monitored activity is detected.

Manage alerts on the website.`,
          { parseMode: 'HTML' }
        );
      } else {
        await telegramService.sendTelegramMessage(
          chatId,
          `❌ <b>Not Connected</b>

To receive alerts, you need to connect your account:
1. Go to crypto-insights-52.preview.emergentagent.com
2. Click "Connect Telegram" 
3. Use the provided link

Or type /start for more info.`,
          { parseMode: 'HTML' }
        );
      }
    }
    // Handle /disconnect
    else if (text === '/disconnect') {
      await telegramService.TelegramConnectionModel.updateOne(
        { chatId },
        { isActive: false }
      );

      await telegramService.sendTelegramMessage(
        chatId,
        `👋 <b>Disconnected</b>

You will no longer receive alerts here. 

Type /start to reconnect anytime.`,
        { parseMode: 'HTML' }
      );
    }
  } catch (error) {
    console.error('[TG Polling] Error processing update:', error);
  }
}

/**
 * Start polling for updates
 */
export async function startTelegramPolling() {
  if (isPolling) {
    console.log('[TG Polling] Already running');
    return;
  }

  if (!TELEGRAM_BOT_TOKEN) {
    console.error('[TG Polling] Bot token not configured');
    return;
  }

  isPolling = true;
  console.log('[TG Polling] Started (TEMPORARY FIX - uses polling instead of webhook)');

  while (isPolling) {
    try {
      const url = `${TELEGRAM_API_BASE}${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${offset}&timeout=30`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.ok && data.result && data.result.length > 0) {
        for (const update of data.result) {
          await processUpdate(update);
          offset = update.update_id + 1;
        }
      }
    } catch (error) {
      console.error('[TG Polling] Error:', error);
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s on error
    }

    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
  }
}

/**
 * Stop polling
 */
export function stopTelegramPolling() {
  isPolling = false;
  console.log('[TG Polling] Stopped');
}

import { logger } from '../utils/logger';

// For demo purposes, we will mock the Telegram API call if no token is provided.
export async function sendTelegramNotification(message: string) {
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;

  if (!telegramBotToken || !telegramChatId) {
    logger.warn('Telegram notifications not configured. Mocking alert:', { message });
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text: message
      })
    });

    if (!res.ok) {
      logger.error('Failed to send Telegram notification', await res.text());
    }
  } catch (error) {
    logger.error('Error sending Telegram notification', { error });
  }
}

const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

const token = process.env.TELEGRAM_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
const bot = new TelegramBot(token);
bot.sendMessage(chatId, "✅ ¡Conexión establecida! El scraper de Seiko está funcionando.");

const HISTORY_FILE = './history.json';
const KEYWORD = 'seiko vintage';

async function run() {
    try {
        // Cargar historial
        let history = [];
        if (fs.existsSync(HISTORY_FILE)) {
            history = JSON.parse(fs.readFileSync(HISTORY_FILE));
        }

        // Consultar API de Wallapop
        const response = await axios.get('https://api.wallapop.com/api/v3/general/search', {
            params: {
                keywords: KEYWORD,
                filters_source: 'search_box',
                order_by: 'newest'
            },
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const items = response.data.search_objects || [];
        let newFound = false;

        for (const item of items) {
            if (!history.includes(item.id)) {
                const message = `⌚ *¡Nuevo Seiko Vintage!* \n\n` +
                                `💰 Precio: ${item.price.amount} ${item.price.currency} \n` +
                                `📝 ${item.title} \n` +
                                `🔗 [Abrir en Wallapop](https://es.wallapop.com/item/${item.web_slug})`;
                
                await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
                history.push(item.id);
                newFound = true;
            }
        }

        // Guardar historial actualizado (máximo 200 IDs para no saturar)
        if (newFound) {
            fs.writeFileSync(HISTORY_FILE, JSON.stringify(history.slice(-200)));
            console.log("Historial actualizado.");
        }

    } catch (error) {
        console.error("Error:", error.message);
    }
}

run();
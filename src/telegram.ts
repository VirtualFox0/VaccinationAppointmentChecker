import TelegramBot = require("node-telegram-bot-api")
import { config } from './config'

const bot = new TelegramBot(config.telegramToken, {polling: true})

export function sendTelegramMessage(message: string) {
	for (const chatId of config.telegramChatIds) {
		try {
			bot.sendMessage(chatId, message)
		} catch(err){
			console.log("Error: error sending telegram message ", err)
		}
	}
}
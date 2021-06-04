import TelegramBot = require("node-telegram-bot-api")
import { config } from './config'

const bot = new TelegramBot(config.telegramToken, {polling: false})

export function sendTelegramDebugMessage(message: string) {
	if (config.telegramChatIds !== undefined) {
		for (const chatId of config.telegramChatIds) {
			try {
				bot.sendMessage(chatId, message)
			} catch(err){
				console.log("Error: error sending telegram message to chatId: " + chatId, err)
			}
		}
	}
}

export function sendTelegramGroupMessage(message: string) {
	if (config.telegramGroupChatIds !== undefined) {
		for (const chatId of config.telegramGroupChatIds) {
			try {
				bot.sendMessage(chatId, message)
			} catch(err){
				console.log("Error: error sending telegram message to chatId: " + chatId, err)
			}
		}
	}
}
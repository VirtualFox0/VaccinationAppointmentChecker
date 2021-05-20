import TelegramBot = require("node-telegram-bot-api")
import { Base64 } from 'base64-string'
const axios = require('axios').default
const schedule = require('node-schedule')
const config: Config = require('../config.json')

const scheduleMinutes = config.schedule_minutes
const token = config.telegram_token
const chatIds = config.telegram_chatIds
const bot = new TelegramBot(token, {polling: true})

console.log('======== SEND TELEGRAM START MESSAGE')
sendTelegramMessage("vaccinationAppointmentChecker started ...")

console.log('======== START WITH SCHEDULE INTERVAL: ' + scheduleMinutes + " minutes")

schedule.scheduleJob('*/' + scheduleMinutes + ' * * * *', function() {
	console.log('======== SCHEDULED RUN: ' + new Date())
	checkAllAccessCodeObjects()
})
console.log('======== RUN: ' + new Date())
checkAllAccessCodeObjects()

async function checkAllAccessCodeObjects() {
	for (const accessCodeObject of config.accessCodeObjects) {
		try {
			await check(accessCodeObject)
		} catch(err){
			console.error(err)
		}
	}
}

async function check(accessCodeObject: AccessCodeObject) {
	console.log("======== Check events for " + accessCodeObject.vaccinationGroup + " " + accessCodeObject.vaccinationCentre)
	const eventSearchUrl = buildEventSearchUrl(accessCodeObject)

	try {
		const base64Encoder = new Base64()
		const response = await axios.request({
			url: eventSearchUrl,
			method: "get",
			headers: {
				Accept: "application/json, text/plain, */*",
				Authorization: "Basic " + base64Encoder.encode(":"+accessCodeObject.code)
			} 
		})
		const eventObject = response.data
		console.log(eventObject)

		if (eventObject.termine !== undefined && eventObject.termine.length > 0 ||
			eventObject.termineTSS !== undefined && eventObject.termineTSS.legth > 0) {
			console.log("======== SUCCESS: Events found!")
			console.log(eventObject.termine)
			console.log(eventObject.termineTSS)

			sendTelegramMessage("Termine gefunden für: " + 
			accessCodeObject.vaccinationCentre + ". " + 
			" Jetzt Termine buchen: " + 
			buildEntryUrl(accessCodeObject))
		} else {
			console.log("======== No events.", eventObject.termine)
		}
	} catch (err) {
		console.error(err)
		sendTelegramMessage("Error occured. " + err)
	}
}

interface Config {
	accessCodeObjects: [AccessCodeObject]
	schedule_minutes: number
	telegram_token: string
	telegram_chatIds: [string]
}

interface AccessCodeObject {
	vaccinationCentre: string
	zip: string
	code: string
	vaccinationGroup: string
}

function buildEntryUrl(accessCodeObject: AccessCodeObject): string {
	return 'https://' + 
	accessCodeObject.vaccinationGroup + 
	'.impfterminservice.de/impftermine/suche/' + 
	accessCodeObject.code + '/' + accessCodeObject.zip + '/'
}

function buildEventSearchUrl(accessCodeObject: AccessCodeObject): string {
	return 'https://' + 
	accessCodeObject.vaccinationGroup + 
	'.impfterminservice.de/rest/suche/impfterminsuche?plz=' + accessCodeObject.zip
}

function sendTelegramMessage(message: string) {
	for (const chatId of chatIds) {
		try {
			bot.sendMessage(chatId, message)
		} catch(err){
			console.log("Error: error sending telegram message ", err)
		}
	}
}

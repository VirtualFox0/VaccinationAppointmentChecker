import TelegramBot = require("node-telegram-bot-api")
import { Base64 } from 'base64-string'
const axios = require('axios').default
import { config, AccessCodeObject } from './config'

const bot = new TelegramBot(config.telegramToken, {polling: true})

console.log('======== SEND TELEGRAM START MESSAGE')
sendTelegramMessage("vaccinationAppointmentChecker started ...")

console.log('======== START WITH SCHEDULE INTERVAL: ' + config.scheduleMinutes + " minutes")
console.log('eventNotBefore: ' + config.eventNotBefore)
console.log('eventNotAfter: ' + config.eventNotAfter)

checkAllAccessCodeObjects()
const intervalInMinutes = config.scheduleMinutes * 1000 * 60;
setInterval(() => checkAllAccessCodeObjects(), intervalInMinutes);

async function checkAllAccessCodeObjects() {
	console.log('RUN: ' + new Date())
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
		const responseObject = response.data
		console.log(JSON.stringify(responseObject))

		if (responseObject.termine !== undefined && responseObject.termine.length > 0 ||
			responseObject.termineTSS !== undefined && responseObject.termineTSS.legth > 0) {
			console.log("======== SUCCESS: Events found!")

			const checkedEventPairs = getCheckedEventDates(responseObject)
			if (checkedEventPairs.length > 0) {
				console.log("======== SUCCESS: Events found in given range!")
				sendTelegramMessage("Termine gefunden für \"" + 
				accessCodeObject.vaccinationCentre + ".\"" + getReadableEventDates(checkedEventPairs) + 
				"\n\nJetzt Termine buchen: " + 
				buildEntryUrl(accessCodeObject))
			} else {
				console.log("======== WARNING: Events not in given range!")
			}
		} else {
			console.log("======== No events.", responseObject.termine)
		}
	} catch (err) {
		console.error(err)
		sendTelegramMessage("Error occured. " + err)
	}
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
	for (const chatId of config.telegramChatIds) {
		try {
			bot.sendMessage(chatId, message)
		} catch(err){
			console.log("Error: error sending telegram message ", err)
		}
	}
}

interface ResponseObject {
	gesuchteLeistungsmerkmale: [string]
	termine: Array<Array<EventObject>>
	termineTSS: any
	praxen: any
}

interface EventObject {
	slotId: string,
    begin: number,
    bsnr: string
}

function getReadableEventDates(eventPairs: Array<EventObject[]>): string {
	var eventString = "\n\n " + eventPairs.length + " Terminpaar(e): "
	for (const eventPair of eventPairs) {
		eventString = eventString + " \n- " + 
			new Date(eventPair[0].begin).toString() + " und " +
			new Date(eventPair[1].begin).toString()
	}
	return eventString
}

function getCheckedEventDates(responseObject: ResponseObject): Array<EventObject[]> {
	var checkedDates: Array<EventObject[]> = []

	for (const eventPair of responseObject.termine) {
		const event1Date = new Date(eventPair[0].begin)
		const event2Date = new Date(eventPair[1].begin)
		if (isDateInDefinedRange(event1Date) && isDateInDefinedRange(event2Date)) {
			checkedDates.push(eventPair)
		}
	}
	return checkedDates
}

function isDateInDefinedRange(date: Date): boolean {
	if (config.eventNotBefore !== undefined && date < config.eventNotBefore) return false
	if (config.eventNotAfter != undefined && date > config.eventNotAfter) return false
	return true
}




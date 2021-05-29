import { sendTelegramDebugMessage, sendTelegramGroupMessage } from './telegram'
const axios = require('axios').default
import { Base64 } from 'base64-string'

import { config, AccessCodeObject } from './config'

// for testing purpose:
// const eventResponse = require('../testData/eventResponse.json')

export async function checkEvents(accessCodeObject: AccessCodeObject) {
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

				sendTelegramDebugMessage("Termine gefunden für \"" + accessCodeObject.zip + " " + 
				accessCodeObject.vaccinationCentre + ".\"" + getReadableEventDates(checkedEventPairs) + 
				"\n\nJetzt Termine buchen: " + 
				buildEntryUrl(accessCodeObject))

				sendTelegramGroupMessage("Schnell meine Impflinge! Für \"" + accessCodeObject.zip + " " +  
				accessCodeObject.vaccinationCentre + " sind gerade eben Termine erschienen! Hopp hopp :)!\"" + getReadableEventDates(checkedEventPairs))
			} else {
				console.log("======== WARNING: Events not in given range!")
			}
		} else {
			console.log("======== No events.", responseObject.termine)
		}
	} catch (err) {
		console.error(err)
		sendTelegramDebugMessage("Error occured for " + accessCodeObject.vaccinationCentre + ": " + err)
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
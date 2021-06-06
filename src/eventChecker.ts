import { sendTelegramDebugMessage, sendTelegramGroupMessage } from './telegram'
const axios = require('axios').default
import { Base64 } from 'base64-string'

import { config, AccessCodeObject } from './config'
import { Deserializer } from 'v8'

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
			
			cleanSavedEventPairs()
			sendTelegramMessages(accessCodeObject, responseObject)
			saveEventPair(responseObject)
		} else {
			console.log("======== No events.", responseObject.termine)
		}
	} catch (err) {
		console.error(err)
		sendTelegramDebugMessage("Error occured for " + accessCodeObject.vaccinationCentre + ": " + err)
	}
}

function sendTelegramMessages(accessCodeObject: AccessCodeObject, responseObject: ResponseObject) {
	const checkedEventPairs = getCheckedEventDates(responseObject)
	console.log("checkedEventPairs: " + JSON.stringify(checkedEventPairs))
	if (checkedEventPairs.length > 0) {
		console.log("======== SUCCESS: Events found in given range!")
		console.log(getReadableEventDates(checkedEventPairs))

		sendTelegramDebugMessage("Termine gefunden für \"" + accessCodeObject.zip + " " + 
		accessCodeObject.vaccinationCentre + ".\"" + getReadableEventDates(checkedEventPairs) + 
		"\n\nJetzt Termine buchen: " + 
		buildEntryUrlWithAccessCode(accessCodeObject))

		const noDuplicateEventPairs = checkedEventPairs.filter( eventPair => { return eventPair.duplicate === false })
		console.log("noDuplicateEventPairs: " + JSON.stringify(noDuplicateEventPairs))
		if (noDuplicateEventPairs.length > 0) {
			sendTelegramGroupMessage("Schnell meine Impflinge! Für \"" + accessCodeObject.zip + " " +  
			accessCodeObject.vaccinationCentre + "\" sind gerade eben Termine (BioNTech oder Moderna) erschienen! Hopp hopp :)!" + getReadableEventDates(noDuplicateEventPairs) + 
			"\n\nJetzt Termine buchen: " + 
			buildEntryUrl(accessCodeObject))
		}				
	} else {
		console.log("======== WARNING: Events not in given range!")
	}
}

function buildEntryUrlWithAccessCode(accessCodeObject: AccessCodeObject): string {
	return 'https://' + 
	accessCodeObject.vaccinationGroup + 
	'.impfterminservice.de/impftermine/suche/' + 
	accessCodeObject.code + '/' + accessCodeObject.zip + '/'
}

function buildEntryUrl(accessCodeObject: AccessCodeObject): string {
	return 'https://' + 
	accessCodeObject.vaccinationGroup + 
	'.impfterminservice.de/impftermine/service/' + 
	accessCodeObject.zip 
}

function buildEventSearchUrl(accessCodeObject: AccessCodeObject): string {
	return 'https://' + 
	accessCodeObject.vaccinationGroup + 
	'.impfterminservice.de/rest/suche/impfterminsuche?plz=' + accessCodeObject.zip
}

function getReadableEventDates(eventPairs: Array<EventPair>): string {
	var eventString = "\n\n " + eventPairs.length + " Terminpaar(e): "
	for (const eventPair of eventPairs) {
		eventString = eventString + " \n- " + 
			new Date(eventPair.events[0].begin).toString() + " und " +
			new Date(eventPair.events[1].begin).toString()
	}
	return eventString
}

function getCheckedEventDates(responseObject: ResponseObject): Array<EventPair> {
	var checkedDates: Array<EventPair> = []

	for (const events of responseObject.termine) {
		const event1Date = new Date(events[0].begin)
		const event2Date = new Date(events[1].begin)
		if (isDateInDefinedRange(event1Date) && isDateInDefinedRange(event2Date)) {
			let eventPair: EventPair = { "events": events, "duplicate": isDuplicateEvent(events[0]) }
			checkedDates.push(eventPair)
		}
	}
	return checkedDates
}

const eventPairs = new Map<String, Date>()
function saveEventPair(responseObject: ResponseObject) {
	console.log("======== Save event pairs...")
	for (const eventPair of responseObject.termine) {
		const event1Slot = eventPair[0].slotId
		if (!eventPairs.has(event1Slot)) {
			console.log("save event pair with key: " + event1Slot)
			eventPairs.set(event1Slot, new Date())
		} else {
			console.log("don't save event pair with key: " + event1Slot + " because it already exists")
		}
	}
}

function cleanSavedEventPairs() {
	console.log("======== cleanSavedEventPairs ")

	let ONE_HOUR = 60 * 60 * 1000
	eventPairs.forEach((date: Date, key: String) => {
		let dateToCheck = new Date(date.getTime() + ONE_HOUR)
		if (dateToCheck < new Date())  {
			console.log("delete saved event pair with key: " + key + " and saved date: " + date)
			eventPairs.delete(key)
		} else {
			console.log("don't delete saved event pair with key: " + key + " and saved date: " + date)
		}
	})
}

function isDuplicateEvent(eventObject: EventObject): boolean {
	return eventPairs.get(eventObject.slotId) !== undefined
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
	bsnr: string,
	duplicate: boolean
}

interface EventPair {
	events: Array<EventObject>,
	duplicate: boolean
}
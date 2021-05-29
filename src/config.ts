const jsonConfig: JSONConfig = require('../config.json')

interface JSONConfig {
	accessCodeObjects: [AccessCodeObject]
	event_not_before: string | undefined
	event_not_after: string | undefined
	schedule_minutes: number
	telegram_token: string
	telegram_chatIds: [string],
	telegram_group_chatIds: [string]
}

export interface AccessCodeObject {
	vaccinationCentre: string
	zip: string
	code: string
	vaccinationGroup: string
}

class Config {
	accessCodeObjects = jsonConfig.accessCodeObjects
	eventNotBefore = this.parseDate(jsonConfig.event_not_before)
	eventNotAfter =  this.parseDate(jsonConfig.event_not_after)
	scheduleMinutes = jsonConfig.schedule_minutes ? jsonConfig.schedule_minutes : 2
	telegramToken = jsonConfig.telegram_token
	telegramChatIds = jsonConfig.telegram_chatIds
	telegramGroupChatIds = jsonConfig.telegram_group_chatIds

	parseDate(dateString: string | undefined) : Date | undefined {
		if (dateString !== undefined) {
			const date = new Date(dateString)
			if (!isNaN(date.getTime())) return date
		}
		return undefined
	}
}

export const config = new Config();
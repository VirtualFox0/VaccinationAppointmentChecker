import { sendTelegramDebugMessage } from './telegram'
import { config } from './config'
import { checkEvents } from './eventChecker'

console.log('======== SEND TELEGRAM START MESSAGE')
sendTelegramDebugMessage("vaccinationAppointmentChecker started ...")

console.log('======== START WITH SCHEDULE INTERVAL: ' + config.scheduleMinutes + " minutes")
console.log('eventNotBefore: ' + config.eventNotBefore)
console.log('eventNotAfter: ' + config.eventNotAfter)

checkAllAccessCodeObjects()
const intervalInMinutes = config.scheduleMinutes * 1000 * 60;
setInterval(() => checkAllAccessCodeObjects(), intervalInMinutes);

async function checkAllAccessCodeObjects() {
	console.log('+++++++++ RUN: ' + new Date())
	for (const accessCodeObject of config.accessCodeObjects) {
		try {
			await checkEvents(accessCodeObject)
		} catch(err){
			console.error(err)
		}
	}
}

// https://nodejs.org/docs/v0.3.1/api/process.html#event_exit_
// https://www.npmjs.com/package/shutdown-hook
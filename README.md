# VaccinationAppointmentChecker

- This script only checks available vaccination appointments for https://impfterminservice.de and sends a telegram message if appointments are available. 
- You have to book the appointment manually.
- Mediation code needed.

## How to get mediation code?
- Get mediation code with multiple attempts and waiting time from https://impfterminservice.de or 
- intercept https network traffic for your vaccination centre url
`https://[vaccinationCentreGroup e.g. 001-iz].impfterminservice.de/rest/suche/termincheck` and change response from `{"termineVorhanden":false,"vorhandeneLeistungsmerkmale":[]}` to `{"termineVorhanden":true,"vorhandeneLeistungsmerkmale":["L920", "L921"]}` to get code directly.

### Leistungsmerkmal

https://001-iz.impfterminservice.de/assets/static/its/vaccination-list.json

* L920 BioNTech
* L921 Moderna
* L922 AstraZeneca
* L923 Johnson&Johnson

# Installation 
- Install node
- Checkout and run `npm install`

# Configuration
- copy and rename `config.example.json` to `config.json`
- fill accessCodeObjects with your data
- if you want to set a time range for available events, use `event_not_before` and `event_not_after` (ignored if not set or invalid)
- Create telegram bot with [Botfather](https://t.me/botfather) (`/newbot`) 
- save token as `telegram_token` to `config.json`
- find out your chat id with [IDBot](https://telegram.me/myidbot) (`/getid`)
- save your telegram chat id to `telegram_chatIds` to `config.json` (or use a telegram group and save chat id to `telegram_group_chatIds`)
- send a test message from your telegram account to the newly created bot
- script will send you a test message after every start

## Usage of Telegram group
- Create Telegram group 
- Add your bot to group
- Adjust the following settings for your bot with BotFather
  - /setprivacy - disabled
  - /setjoingroups - enabled
- Get the group chat id (e.g. from the JSON of https://api.telegram.org/bot<YourBOTToken>/getUpdates)

# Run
`npm start`

# Impfterminservice Links
* [vaccination-list](https://001-iz.impfterminservice.de/assets/static/its/vaccination-list.json)
* [impfzentren](https://www.impfterminservice.de/assets/static/impfzentren.json)
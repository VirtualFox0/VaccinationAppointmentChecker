# VaccinationAppointmentChecker

- This script only checks available vaccination appointments for https://impfterminservice.de and sends a telegram message if appointments are available. 
- You have to book the appointment manually.
- Mediation code needed.

## How to get mediation code?
- Get mediation code with multiple attempts and waiting time from https://impfterminservice.de or 
- intercept https network traffic for your vaccination centre url
`https://[vaccinationCentreGroup e.g. 001-iz].impfterminservice.de/rest/suche/termincheck` and change response from `{"termineVorhanden":false,"vorhandeneLeistungsmerkmale":[]}` to `{"termineVorhanden":true,"vorhandeneLeistungsmerkmale":["L921"]}` to get code directly.

# Installation 
- Install node
- Checkout and run `npm install`

# Configuration
- copy and rename `config.example.json` to `config.json`
- fill accessCodeObjects with your data
- Create telegram bot with [Botfather](https://t.me/botfather) (`/newbot`) 
- save token as `telegram_token` to `config.json`
- find out your chat id with [IDBot](https://telegram.me/myidbot) (`/getid`)
- save your telegram chat id to `telegram_chatIds` to `config.json`
- send a test message from your telegram account to the newly created bot
- script will send you a test message after every start

# Run
`npm start`

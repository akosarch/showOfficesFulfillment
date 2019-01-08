'use strict'

// DEPENDENCIES DECLARATION

const functions = require('firebase-functions')
const admin = require('firebase-admin')
const {dialogflow} = require('actions-on-google')

// INITIALIZE APP

const app = dialogflow({debug: true})

// INITIALIZE DATABASE

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: 'https://showoffices-7eed1.firebaseio.com/'
})

const db = admin.database()

// DEFINE GL VARIABLES

const manyOffices = {"USA": 7, "Europe": 15, "Germany": 2, "Poland": 4, "Ukraine": 7}
const singleOffice = {"England": "London", "Bulgaria": "Sofia"}
const framerURL = 'https://framer.cloud/SviNN'

// DEFINE FUNCTIONS

const setValue = (ref, obj) => ref.update(obj)
const matchEntities = (countries, param) => {
    return countries.hasOwnProperty(param)
}

app.fallback((conv) => {
    
    const intent = conv.intent // catch the intent name
    const sessionId = conv.contexts._session.split('/').splice(-1)[0]
    const ref = db.ref(sessionId)
    const nodeWipeTime = 1000 * 60 * 10

    
    switch (intent) {
        
        case 'fallback':
            conv.ask("Sorry didn't get it. Repeat the phrase please")
        break;

        case 'openMap':
            setValue(ref, {countryName: 'all'})
            conv.ask(framerURL+'?id='+sessionId)
            setTimeout(() => ref.remove(), nodeWipeTime)
            
        break;

        case 'closeMap':
            ref.remove()
            conv.close('See ya')
        break;
        
        case 'showOffices':
            
            const country = conv.parameters.countryName
            
            if (country === "all") {

                setValue(ref, {countryName: 'all'})
                conv.ask('Here are all the Soft Serve offices')

            } else if (matchEntities(manyOffices, country)) {

                setValue(ref, {countryName: country})
                conv.ask(`There are ${manyOffices[country]} offices in ${country}. To get back say: show me all offices`)
            
            } else if (matchEntities(singleOffice, country)) {

                setValue(ref, {countryName: country})
                conv.ask(`There is only one office in ${singleOffice[country]}, ${country}. To get back say: show me all offices`)
           
            } else {
                conv.ask('There is no Soft Serve offices in that country')
            }
            
        break;
    }
})

// DEPLOY HTTP SERVER

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app)

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
    const sessionId = conv.contexts._session.split('/').splice(-1)[0] // extracting sessionId from the response
    const ref = db.ref(sessionId) // set a session id as a reference node in DB
    const nodeWipeTime = 1000 * 60 * 10 // set node wipe time to 10min

    // WATCHING FOR THE INTENT BEING TRIGGERED

    switch (intent) {
        
        case 'fallback':
            conv.ask("Sorry didn't get it. Repeat the phrase please")
        break;

        case 'openMap':
            setValue(ref, {countryName: 'all'}) // set default value to 'all'
            conv.ask(framerURL+'?id='+sessionId) // respond with a map url
            setTimeout(() => ref.remove(), nodeWipeTime) // node will de removed by the timeout
            
        break;

        case 'closeMap':
            ref.remove() // remove the node reference on bot exit
            conv.close('See ya')
        break;
        
        case 'filterDevCentres':
            setValue(ref, {countryName: "development centres"})
            conv.ask('There are 12 development locations in 3 countries. To get back say: show me all locations')
        break;
        
        case 'showOffices':
            
            const country = conv.parameters["countryName"] // send it to the Framer client
            const original = conv.parameters["originalName"] // use it in a voice response to the user
            
            if (country === "all") {

                setValue(ref, {countryName: 'all'})
                conv.ask('Here are all the Soft Serve locations')

            } else if (matchEntities(manyOffices, country)) {

                setValue(ref, {countryName: country})
                conv.ask(`There are ${manyOffices[country]} locations in ${original}. To get back say: show me all locations`)
            
            } else if (matchEntities(singleOffice, country)) {

                setValue(ref, {countryName: country})
                conv.ask(`There is only one location in ${singleOffice[country]}, ${original}. To get back say: show me all locations`)
           
            } else {
                conv.ask('There is no Soft Serve locations in that country')
            }
            
        break;
    }
})

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app)

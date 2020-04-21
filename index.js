'use strict';


// Imports dependencies and set up http server
const
  request = require('request'),
  express = require('express'),
  bodyParser = require('body-parser'),
  requestify = require('requestify'),
  firebase = require('firebase-admin'),
  ejs = require("ejs"),
  app = express().use(bodyParser.json()); // creates express http server

  const pageaccesstoken = process.env.PAGE_ACCESS_TOKEN;

app.set('view engine', 'ejs');
app.set('views', __dirname+'/views');



//firebase initialize
firebase.initializeApp({
  credential: firebase.credential.cert({
    "private_key": process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    "client_email": process.env.FIREBASE_CLIENT_EMAIL,
    "project_id": process.env.FIREBASE_PROJECT_ID,
  }),
  databaseURL: "https://fir-b7a51.firebaseio.com"
});

let askUserName = false;
let askHotelName = false;
let askTransportationName = false;
let db = firebase.firestore();  

let user = {};
let orderRef;



  /*
  requestify.post(`https://graph.facebook.com/v5.0/me/messenger_profile?access_token=${pageaccesstoken}`, 
  {
    "get_started": {
      "payload": "Hi"
    },
    "greeting": [
      {
        "locale":"default",
        "text":"Hello {{user_first_name}}!" 
      }, {
        "locale":"en_US",
        "text":"Welcome To Your Trip."
      }
    ]
  }
).then( response => {
  console.log(response)
}).fail( error => {
  console.log(error)
})*/

//whitelist domains
//eg https://fbstarterbot.herokuapp.com/whitelists
app.get('/whitelists',function(req,res){    
    whitelistDomains(res);
});

  // Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

app.get('/shwedagonpackage',function(req,res){
    
    res.render('shwedagonpackage.ejs');
});

app.get('/test/:title/:sender_id',function(req,res){
    const sender_id = req.params.sender_id;
    const title = req.params.title;
    res.render('test.ejs',{title:title,sender_id:sender_id});
});


// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

    // Your verify token. Should be a random string.
    let VERIFY_TOKEN = "zawgyee"
      
    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];
      
    // Checks if a token and mode is in the query string of the request
    if (mode && token) {
    
      // Checks the mode and token sent is correct
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        
        // Responds with the challenge token from the request
        console.log('WEBHOOK_VERIFIED');
        res.status(200).send(challenge);
      
      } else {
        // Responds with '403 Forbidden' if verify tokens do not match
        res.sendStatus(403);      
      }
    }
  });

// Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => {  
 
    let body = req.body;
  
    // Checks this is an event from a page subscription
    if (body.object === 'page') {
  
      // Iterates over each entry - there may be multiple if batched
      body.entry.forEach(function(entry) {
  
        // Gets the message. entry.messaging is an array, but 
        // will only ever contain one message, so we get index 0
        let webhook_event = entry.messaging[0];
        console.log(webhook_event);

        if(webhook_event.message){

          if(webhook_event.message.quick_reply){
             var quickdata = webhook_event.message.quick_reply.payload;
             console.log("quickdata:", quickdata);
          }else{
              var userInput = webhook_event.message.text;
                      
          }         
        
        }
        
        if(webhook_event.postback){
          var userButton = webhook_event.postback.payload
        }
        


        if (userInput == 'Hi' || userButton == 'Hi' ){
          let welcomeMessage = {
            "recipient":{
              "id":webhook_event.sender.id
            },
            "messaging_type": "RESPONSE",
            "message":{
              "text": "Mingalar bar. Welcome to Eye of Eagle travel and tour. Are you on trip?",
              "quick_replies":[
              {
                "content_type":"text",
                "title":"I am travelling",
                "payload":"yes",
                "image_url":"http://example.com/img/red.png"
              },{
                "content_type":"text",
                "title":"Planning to travel",
                "payload":"no",
                "image_url":"http://example.com/img/green.png"
              }
              ]
            }
          } 

          send(welcomeMessage);
        }


       
          
         


      if (userInput == 'I am travelling' || quickdata == 'yes' ){
        let welcomeMessage = {
          "recipient":{
            "id":webhook_event.sender.id
          },
          "messaging_type": "RESPONSE",
          "message":{
            "text": "Are you ok with that trip?",
            "quick_replies":[
            {
              "content_type":"text",
              "title":"Ok",
              "payload":"ok",
              "image_url":"http://example.com/img/red.png"
            },{
              "content_type":"text",
              "title":"Not Ok",
              "payload":"notok",
              "image_url":"http://example.com/img/green.png"
            }
            ]
          }
        } 

        send(welcomeMessage);
      }
      //end of yes answer
        

      if (userInput == 'Ok' || quickdata == 'ok' ){
        let welcomeMessage = {
          "recipient":{
            "id":webhook_event.sender.id
          },
          "messaging_type": "RESPONSE",
          "message":{
            "text": "If you aren't ok you can create package by your self, you can choose youractivity by your self and then I will suggest and you don't know your place where you are. So you can send your location and I will be show the package and you can choose each package. ",
            "quick_replies":[
           {
              "content_type":"text",
              "title":"Show  packages",
              "payload":"sp",
              "image_url":"http://example.com/img/red.png"
            },{
              "content_type":"text",
              "title":"Customize Package",
              "payload":"cp",
              "image_url":"http://example.com/img/green.png"
            },{
              "content_type":"text",
              "title":"Choose your activity",
              "payload":"cya",
              "image_url":"http://example.com/img/green.png"
            },{
              "content_type":"text",
              "title":"detail",
              "payload":"detail",
              "image_url":"http://example.com/img/green.png"
            }
            ]
          }
        } 

        send(welcomeMessage);
      }
      //end of ok by yes answer



      if (userInput == 'Not ok' || quickdata == 'notok' ){
        let welcomeMessage = {
          "recipient":{
            "id":webhook_event.sender.id
          },
          "messaging_type": "RESPONSE",
          "message":{
            "text": "Sorry to hear that. Is there anything you want to change during your trip",
            "quick_replies":[
            {
              "content_type":"text",
              "title":"Hotel option",
              "payload":"hp",
              "image_url":"http://example.com/img/red.png"
            },{
              "content_type":"text",
              "title":"Transportation option",
              "payload":"tp",
              "image_url":"http://example.com/img/green.png"
            },{
              "content_type":"text",
              "title":"Restaurants option",
              "payload":"rp",
              "image_url":"http://example.com/img/green.png"
            }
            ]
          }
        } 

        send(welcomeMessage);
      }
      //end of not ok by yes answer



       
        



      if (userInput == 'Planning to Travel' || quickdata == "no" ){
          let welcomeMessage = {
           "recipient":{
            "id":webhook_event.sender.id
          },
              "message":{
                "attachment":{
                  "type":"template",
                  "payload":{
                    "template_type":"generic",
                    "elements":[
                    {
                      "title":"Shwedagon",
                      "image_url":"https://osugamyanmartravels.com/wp-content/uploads/2018/04/shwedagon-pagoda-yangon-burma-myanmar.jpg",
                      "subtitle":"Choose the transportation what you want",
                      "default_action": {
                        "type": "web_url",
                        "url": "https://eyeofeagle.herokuapp.com",
                        "webview_height_ratio": "tall",
                      },
                      "buttons": [ 

                          {
                            "type": "web_url",
                            "title": "View Detail",
                            "url":"https://eyeofeagle.herokuapp.com/shwedagonpackage/",
                             "webview_height_ratio": "full",
                            "messenger_extensions": true,          
                          },

                          {
                            "type": "web_url",
                            "title": "create",
                            "url":"https://eyeofeagle.herokuapp.com/test/Shwedagon/"+webhook_event.sender.id,
                             "webview_height_ratio": "full",
                            "messenger_extensions": true,          
                          },
                          
                        ],


                    },{
                      "title":"Sule",
                      "image_url":"https://res.cloudinary.com/fleetnation/image/private/c_fit,w_1120/g_south,l_text:style_gothic2:%C2%A9%20Frank%20Bienewald%20,o_20,y_10/g_center,l_watermark4,o_25,y_50/v1545300898/svhcrxyne1pgny6hcy41.jpg",
                      "subtitle":"Choose the transportation what you want",
                      "default_action": {
                        "type": "web_url",
                        "url": "https://petersfancybrownhats.com/view?item=103",
                        "webview_height_ratio": "tall",
                      },
                      "buttons": [              
                          {
                            "type": "web_url",
                            "title": "create",
                            "url":"https://eyeofeagle.herokuapp.com/test/Shwedagon/"+webhook_event.sender.id,
                             "webview_height_ratio": "full",
                            "messenger_extensions": true,          
                          },
                          
                        ],
                    },{
                      "title":"Kyauk Taw Gyi",
                      "image_url":"https://yangonlife.com.mm/sites/yangonlife.com.mm/files/styles/detail_page_main_image/public/article_images/IMG_6800.jpg?itok=xuQuCJ-l",
                      "subtitle":"Choose the transportation what you want",
                      "default_action": {
                        "type": "web_url",
                        "url": "https://petersfancybrownhats.com/view?item=103",
                        "webview_height_ratio": "tall",
                      },
                      "buttons": [              
                          {
                            "type": "web_url",
                            "title": "create",
                            "url":"https://eyeofeagle.herokuapp.com/test/Shwedagon/"+webhook_event.sender.id,
                             "webview_height_ratio": "full",
                            "messenger_extensions": true,          
                          },
                          
                        ],
                    },{
                      "title":"Yay ll Kyauk Tan",
                      "image_url":"https://yangonlife.com.mm/sites/yangonlife.com.mm/files/article_images/IMG_1381.JPG",
                      "subtitle":"Choose the transportation what you want",
                      "default_action": {
                        "type": "web_url",
                        "url": "https://petersfancybrownhats.com/view?item=103",
                        "webview_height_ratio": "tall",
                      },
                      "buttons": [              
                          {
                            "type": "web_url",
                            "title": "create",
                            "url":"https://eyeofeagle.herokuapp.com/test/Shwedagon/"+webhook_event.sender.id,
                             "webview_height_ratio": "full",
                            "messenger_extensions": true,          
                          },
                          
                        ],
                    }

                    ]
                  }
                }
              }
            }
            send(welcomeMessage);
      } 
        //end of customize by pagodas in yangon



     
     
         


         

      });
  
      // Returns a '200 OK' response to all requests
      res.status(200).send('EVENT_RECEIVED');
    } else {
      // Returns a '404 Not Found' if event is not from a page subscription
      res.sendStatus(404);
    }
  
  });

function send(welcomeMessage){
  requestify.post(`https://graph.facebook.com/v5.0/me/messages?access_token=${pageaccesstoken}`, 
          welcomeMessage
          ).then(response=>{
            console.log("ok welcome") //
          }).fail(error=> {
            console.log(error)
          })
}

function YangonPackage(senderID){
    let welcomeMessage = {
            "recipient":{
              "id":senderID
            },
            "messaging_type": "RESPONSE",
            "message":{
              "text": " Customize Your Packages: Yangon",
              "quick_replies":[
               {
                "content_type":"text",
                "title":"Pagodas",
                "payload":"pagodasinyangon",
                "image_url":"http://example.com/img/red.png"
              },
              {
                "content_type":"text",
                "title":"Hotel",
                "payload":"hotelinyangon",
                "image_url":"http://example.com/img/red.png"
              },{
                "content_type":"text",
                "title":"Transportation",
                "payload":"transportationinyangon",
                "image_url":"http://example.com/img/green.png"
              },{
                "content_type":"text",
                "title":"Guides",
                "payload":"guidesinyangon",
                "image_url":"http://example.com/img/green.png"
              },{
                "content_type":"text",
                "title":"Restaurants",
                "payload":"restaurantsinyangon",
                "image_url":"http://example.com/img/green.png"
              }
              ]
            }
          } 

          send(welcomeMessage);

}

const whitelistDomains = (res) => {
  var messageData = {
          "whitelisted_domains": [
             "https://eyeofeagle.herokuapp.com" , 
             "https://herokuapp.com"                           
          ]               
  };  
  request({
      url: 'https://graph.facebook.com/v2.6/me/messenger_profile?access_token='+ pageaccesstoken,
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      form: messageData
  },
  function (error, response, body) {
      if (!error && response.statusCode == 200) {          
          res.send(body);
      } else {           
          res.send(body);
      }
  });
} 
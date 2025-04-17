const AssistantV2 = require('ibm-watson/assistant/v2');
const { IamAuthenticator, CloudPakForDataAuthenticator } = require('ibm-watson/auth');
const { createParser } = require('eventsource-parser');

// Create Assistant service object.
// const assistant = new AssistantV2({
//   version: '2024-08-25',
//   authenticator: new IamAuthenticator({
//     apikey: process.env.WA_APIKEY,
//   }),
//   url: process.env.WA_SERVICE_URL,
// });

// Create CP4D Assistant service object.
const assistant = new AssistantV2({
  version: '2024-08-25',
  authenticator: new CloudPakForDataAuthenticator({
    username: process.env.CP4D_USERNAME,
    password: process.env.CP4D_PASSWORD,
    url: process.env.CP4D_AUTH_URL
  }),
  serviceUrl: process.env.WA_SERVICE_URL
});

const assistantId = process.env.WA_ENV_ID;

const watson = {};

watson.createSession = async function () {
  let ret = await assistant.createSession({ assistantId: assistantId });
  return ret.result.session_id;
}

watson.streamMessage = async function (sessionId, messageInput, handler) {
  //console.log(sessionId, messageInput);
  const params = {
    assistantId: assistantId,
    environmentId: assistantId,
    sessionId: sessionId,
    input: {
      message_type: 'text',
      text: messageInput
    }
  }
  const res = await assistant.messageStream(params);
  const sseStream = res.result;

  const parser = createParser({onEvent: function(event) {
    // console.log('Received event!')
    // console.log(event.event)
    // console.log(event.data)
  
    const parsedJSON = JSON.parse(event.data);
    handler(parsedJSON);
  }});
  
  for await (const chunk of sseStream) {
    parser.feed(chunk.toString('utf-8'));
  }
}

module.exports = {watson};
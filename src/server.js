const express = require("express");
const cors = require("cors");
require("dotenv").config({ path: "./.env" });


const { watson } = require('./watson');

var SESSION_ID_MAPPING = {};

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json({ limit: "50mb", extended: true }));

app.post("/api/generate/:avatarName", authenticateBearerToken, async (req, res) => {
  await generate(req, res);
});

app.post("/api/generate", authenticateBearerToken, async (req, res) => {
  await generate(req, res);
});

function authenticateBearerToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  if (token !== process.env.ACCESS_TOKEN) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  next();
}

async function generate(req, res) {
  const avatarName = req.params?.avatarName ?? "";
  const conversation = req.body.conversation ?? [];
  const base64Image = req.body.base64Image ?? "";
  var session_id = req.body.session_id ?? "";

  try {
    if (!session_id) {
      res.status(400).json({ error: "Session ID cannot be blank" });
      return;
    }

    // store a mapping of proto session IDs to watson session IDs
    if (!SESSION_ID_MAPPING[session_id]) {
      SESSION_ID_MAPPING[session_id] = await watson.createSession();
    }


    const msg = conversation.at(-1);
    if (!msg) {
      res.status(400).json({ error: "Could not read last message in the conversation" });
      return;
    }
    if (msg.role != "user") {
      res.status(400).json({ error: "Last message in the conversation must be from the user" });
      return;
    }
    const message = msg.content;
    if (!message) {
      res.status(400).json({ error: "Last message in the conversation must not be blank" });
      return;
    }

    let stream;
    res.setHeader("Content-Type", "text/plain");

    let response = "";
    const sid = SESSION_ID_MAPPING[session_id];
    stream = await watson.streamMessage(sid, message, function (data) {
      if (partial = data?.partial_item?.text) { // partial / stream chunk message
        //console.log(partial);
        res.write(partial);
        response += partial;

      } else if (complete = data?.complete_item?.text) { // complete message from WA
        //console.log("Complete answer: " + complete);

        // if the complete response is different from the previous response, write a newline and then the complete response.
        // if the complete response is the same as the concatenated streamed answer, do not re-output the same message
        if (complete != response) {
          if (response) // if there was a previously streamed response - add a newline before the next "whole" message
            complete = "\n" + complete;

          response = ""; // clear the streamed response, since we received a new complete response (follow-up message/answer)
          res.write(complete);
        }
      } else if (final = data?.final_response) {
        // pass - complete API response
      }
    });

    res.end();
  } catch (error) {
    console.error(error, error.message);
    res.status(500).json({ error: "Internal server error" });
  }
  //console.log(SESSION_ID_MAPPING);
}

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

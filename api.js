const WebSocket = require('ws');
const DerivAPIBasic = require('@deriv/deriv-api/dist/DerivAPIBasic');
const connection = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=36807');
const ta = require('ta.js')
const express = require('express')
const api = new DerivAPIBasic({ connection })
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'christariccykid55@gmail.com',
    pass: 'gasuwkwlhibgzqpz'
  }
});

const app = express();

app.get('/', async(req, res) => {
  res.send('Hello, this is a simple Express server!');
});

let interval
const PORT = 3000;

const server = app.listen(PORT, () => {
  interval = setInterval(()=> getTicksHistory(), 10000)
  console.log(`Server is running on port ${PORT}`);
});

function getTimeFrame(count, time){
  if(time == "mins"){
    return count * 60
  }
  if(time == "hrs"){
    return count * 3600
  }
}

let sendTime = 0
let send = true
let timeframe = getTimeFrame(4, "hrs")

function getTicksRequest(symbol, count){
  const ticks_history_request = {
    ticks_history: symbol,
    count: count,
    end: 'latest',
    style: 'candles',
    granularity: timeframe,
  };
  return ticks_history_request
}
const symbol = 'R_75'

const getTicksHistory = async () => {
  const date = new Date()
  try{
    const period = getTicksRequest(symbol, 50)
    const candles = await api.ticksHistory(period);
    const closePrices = candles?.candles?.map(i => {return i?.close})
    const openPrices = candles?.candles?.map(i => {return i?.open})
    const ema = ta.ema(closePrices, closePrices?.length)
    let isUptrend = closePrices[49] > ema ? true : false
    
    const timePassed = date - sendTime
    const secondsPassed = timePassed / 1000
    const minutesPassed = secondsPassed / 60
    if(minutesPassed < 20){
      send = false
    } else{
      send = true
    }

    function sendEmail(message){
      sendTime = new Date()
        const mailOptions = {
          from: 'christariccykid55@gmail.com',
          to: 'meliodasdemonk8ng@gmail.com',
          subject: message,
          text: 'Trading Signal'
        };

        transporter.sendMail(mailOptions, function(error, info){
          if (error) {
            console.log(error);
          } else {
            console.log('Email sent: ' + info.response);
          }
        });
    }

    if(send){
      if(isUptrend){
        if(openPrices[48] > closePrices[48] && closePrices[49] - openPrices[49] > 500){
          sendEmail(`Possible Uptrend Continuation by ${date}`)
        }
        if(closePrices[48] > openPrices[48] && openPrices[49] - closePrices[49] > 500){
          sendEmail(`Possible Trend Retracement by ${date}`)
        }
      } else{
          if(closePrices[48] > openPrices[48] && openPrices[49] - closePrices[49] > 500){
            sendEmail(`Possible Downtrend Continuation by ${date}`)
          }
          if(openPrices[48] > closePrices[48] && closePrices[49] - openPrices[49] > 500){
            sendEmail(`Possible Trend Retracement by ${date}`)
          }
      }
    }
  } catch (error){
    console.log(error)
  }
};
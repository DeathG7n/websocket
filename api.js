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
  getTicksHistory()
  interval = setInterval(()=> getTicksHistory(), 300000)
  console.log(`Server is running on port ${PORT}`);
});

const io = require("socket.io")(server, {
    cors:{
        origin: "*"
    }
})

io.on("connection", (socket) =>{
  console.log("connected to socket.io")
})

let breakOfStructure
let changeOfCharacter

function getTicksRequest(symbol, count){
    const ticks_history_request = {
        ticks_history: symbol,
        count: count,
        end: 'latest',
        style: 'candles',
        granularity: 300,
    };
    return ticks_history_request
}
console.log(1)
const symbol = 'R_75'
const getTicksHistory = async () => {
  try{
    const period_21 = getTicksRequest(symbol, 21)
    const period_50 = getTicksRequest(symbol, 50)
    const period_51 = getTicksRequest(symbol, 51)
    const candles_21 = await api.ticksHistory(period_21);
    const candles_50 = await api.ticksHistory(period_50);
    const candles_51 = await api.ticksHistory(period_51);
    const closePrices21 = candles_21?.candles?.map(i => {return i?.close - 39.9991})
    const highPrices = candles_50?.candles?.map(i => {return i?.high - 35.4976})
    const lowPrices = candles_50?.candles?.map(i => {return i?.low - 35.5046})
    const openPrices21 = candles_21?.candles?.map(i => {return i?.open - 35.5046})
    const closePrices50 = candles_50?.candles?.map(i => {return i?.close - 39.9991})
    const closePrices51 = candles_51?.candles?.map(i => {return i?.close - 39.9991})
    const ma21 = ta.ema(closePrices21, closePrices21.length)
    const ma50 = ta.ema(closePrices50, closePrices50.length)
    const prevMa50 = ta.ema(closePrices51, closePrices51.length - 1)
    const data = []
    const isUptrend = ma21[0] > ma50[0] ? true : false
    for (let i = 0; i < highPrices.length; i++) {
        data.push([highPrices[i], lowPrices[i]])
    }
    const fractals = ta.fractals(data)
    if (isUptrend){
        if (openPrices21[19] > prevMa50[0] && closePrices21[19] < prevMa50[0]){
            const mailOptions = {
                from: 'christariccykid55@gmail.com',
                to: 'meliodasdemonk8ng@gmail.com',
                subject: `Market Structure broken at ${prevMa50[0]}`,
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
    } else {
      if (openPrices21[19] < prevMa50[0] && closePrices21[19] > prevMa50[0]){
        const mailOptions = {
            from: 'christariccykid55@gmail.com',
            to: 'meliodasdemonk8ng@gmail.com',
            subject: `Market Structure broken at ${prevMa50[0]}`,
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
    }
  } catch (error){
      console.log(error)
  }
};
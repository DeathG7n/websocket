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
  interval = setInterval(()=> getTicksHistory(), 1000)
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

let breakOfStructure = 0
let changeOfCharacter = 0
let sendTime = 0
let send = true

function getTicksRequest(symbol, count){
    const ticks_history_request = {
        ticks_history: symbol,
        count: count,
        end: 'latest',
        style: 'candles',
        granularity: 60,
    };
    return ticks_history_request
}
const symbol = 'R_75'

const getTicksHistory = async () => {
  const date = new Date()
  try{
    const period_21 = getTicksRequest(symbol, 21)
    const period_50 = getTicksRequest(symbol, 50)
    const period_38 = getTicksRequest(symbol, 38)
    const candles_21 = await api.ticksHistory(period_21);
    const candles_50 = await api.ticksHistory(period_50);
    const candles_38 = await api.ticksHistory(period_38);
    const closePrices21 = candles_21?.candles?.map(i => {return i?.close})
    const highPrices = candles_50?.candles?.map(i => {return i?.high})
    const lowPrices = candles_50?.candles?.map(i => {return i?.low})
    const openPrices21 = candles_21?.candles?.map(i => {return i?.open})
    const closePrices50 = candles_50?.candles?.map(i => {return i?.close})
    const closePrices38 = candles_38?.candles?.map(i => {return i?.close})
    const ma21 = ta.ema(closePrices21, closePrices21.length)
    const ma38 = ta.ema(closePrices38, closePrices38.length)
    const ma50 = ta.ema(closePrices50, closePrices50.length)
    const data = []
    const isUptrend = closePrices21[20] > ma38 ? true : false
    for (let i = 0; i < highPrices.length; i++) {
      data.push([highPrices[i], lowPrices[i]])
    }
    if(sendTime == date.getMinutes()){
      send = false
    } else{
      send = true
    }
    const fractals = ta.fractals(data)

    const upperFractals = []
    const lowerFractals = []

    for (let i = 0; i < fractals.length; i++) {
      if(fractals[i][0]){
        upperFractals?.push([data[i][0]])
      }
      if(fractals[i][1]){
        lowerFractals?.push([data[i][0]])
      }
    }
    if(send == true){
      if(isUptrend){
        if(breakOfStructure == 0){
          breakOfStructure = upperFractals[upperFractals.length - 1]
        }
        if(changeOfCharacter == 0){
          changeOfCharacter = lowerFractals[lowerFractals.length - 1]
        }
        if(fractals[47][0] == true && data[47][0] > upperFractals[upperFractals?.length - 2] ){
          breakOfStructure = data[47][0]
        }
        if(fractals[47][1] == true && data[47][1] > lowerFractals[lowerFractals?.length - 2]){
          changeOfCharacter = data[47][1]
        }
        if(closePrices21[20] > breakOfStructure && openPrices21[20] < breakOfStructure){
          sendTime = date.getMinutes()
          console.log("BOS")
          const mailOptions = {
            from: 'christariccykid55@gmail.com',
            to: 'meliodasdemonk8ng@gmail.com',
            subject: `Break of Structure at ${breakOfStructure}`,
            text: 'Trading Signal'
          };
                      
          transporter.sendMail(mailOptions, function(error, info){
          if (error) {
            console.log(error);
          } else {
              console.log('Email sent: ' + info.response);
            }
          });
          io.on("connection", (socket) =>{
            io.emit("BOS", "Break Of Structure in Uptrend")
          }) 
        }
        if(closePrices21[20] < changeOfCharacter && openPrices21[20] > changeOfCharacter){
          sendTime = date.getMinutes()
          console.log("CHOCH")
          const mailOptions = {
            from: 'christariccykid55@gmail.com',
            to: 'meliodasdemonk8ng@gmail.com',
            subject: `Change of Character at ${changeOfCharacter}`,
            text: 'Trading Signal'
          };
                      
          transporter.sendMail(mailOptions, function(error, info){
          if (error) {
            console.log(error);
          } else {
              console.log('Email sent: ' + info.response);
            }
          });
          io.on("connection", (socket) =>{
            io.emit("CHOCH", "Change of Character in Uptrend")
          }) 
        }
      } else{
        if(breakOfStructure == 0){
          breakOfStructure = lowerFractals[lowerFractals.length - 1]
        }
        if(changeOfCharacter == 0){
          changeOfCharacter = upperFractals[upperFractals.length - 1]
        }
        if(fractals[47][0] == true && data[47][0] < upperFractals[upperFractals?.length - 2] ){
          changeOfCharacter = data[47][0]
        }
        if(fractals[47][1] == true && data[47][1] < lowerFractals[lowerFractals?.length - 2]){
          breakOfStructure = data[47][0]
        }
        if(closePrices21[20] < breakOfStructure && openPrices21[20] > breakOfStructure){
          sendTime = date.getMinutes()
          console.log("BOS")
          const mailOptions = {
            from: 'christariccykid55@gmail.com',
            to: 'meliodasdemonk8ng@gmail.com',
            subject: `Break of Structure at ${breakOfStructure}`,
            text: 'Trading Signal'
          };
                      
          transporter.sendMail(mailOptions, function(error, info){
          if (error) {
            console.log(error);
          } else {
              console.log('Email sent: ' + info.response);
            }
          });
          io.on("connection", (socket) =>{
            io.emit("BOS", "Break Of Structure in Downtrend")
          }) 
        }
        if(closePrices21[20] > changeOfCharacter && openPrices21[20] < changeOfCharacter){
          sendTime = date.getMinutes()
          console.log("CHOCH")
          const mailOptions = {
            from: 'christariccykid55@gmail.com',
            to: 'meliodasdemonk8ng@gmail.com',
            subject: `Change of Character at ${changeOfCharacter}`,
            text: 'Trading Signal'
          };
                      
          transporter.sendMail(mailOptions, function(error, info){
          if (error) {
            console.log(error);
          } else {
              console.log('Email sent: ' + info.response);
            }
          });
          io.on("connection", (socket) =>{
            io.emit("CHOCH", "Change of Character in Downtrend")
          }) 
        }
      }
    }
   console.log(send)
  } catch (error){
      console.log(error)
  }
};
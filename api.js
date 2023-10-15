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
  console.log(`Server is running on port ${PORT}`);
});

const io = require("socket.io")(server, {
  cors:{
    origin: "*"
  }
})

let breakOfStructure = 0
let changeOfCharacter = 0
let sendTime = 0
let send = true
let timeframe = 3600

io.on("connection", (socket) =>{
  interval = setInterval(()=> getTicksHistory(), 10000)
})

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
  io.on("disconnect",(socket) =>{
    console.log("Disconnected")
  })
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
    io.emit("ASK", closePrices21[20])
    console.log(date.getSeconds())
    
    if(send == true){
      if(isUptrend){
        if(closePrices21[20] > openPrices21[20] && openPrices21[19] > closePrices21[19]){
          io.emit("Bull", true)
        } else{
          io.emit("Bull", false)
        }
        if(breakOfStructure == 0){
          breakOfStructure = Math.max(upperFractals)
        }
        if(changeOfCharacter == 0){
          changeOfCharacter = Math.max(lowerFractals)
        }
        if(fractals[47][0] == true && data[47][0] > breakOfStructure ){
          breakOfStructure = data[47][0]
        }
        if(fractals[47][1] == true && data[47][1] > changeOfCharacter){
          changeOfCharacter = data[47][1]
        }
        if(closePrices21[20] > breakOfStructure && openPrices21[20] < breakOfStructure){
          sendTime = date.getMinutes()
          io.emit("BOS", true)
        } else{
          io.emit("BOS", false)
        }
        if(closePrices21[20] < changeOfCharacter && openPrices21[20] > changeOfCharacter){
          sendTime = date.getMinutes()
          io.emit("CHOCH", true)
        } else{
          io.emit("CHOCH", false)
        }
      } else{
        if(openPrices21[20] > closePrices21[20] && closePrices21[19] > openPrices21[19]){
          io.emit("Bear", true)
        } else{
          io.emit("Bear", false)
        }
        if(breakOfStructure == 0){
          breakOfStructure = Math.min(lowerFractals)
        }
        if(changeOfCharacter == 0){
          changeOfCharacter = Math.min(upperFractals)
        }
        if(fractals[47][0] == true && data[47][0] < changeOfCharacter ){
          changeOfCharacter = data[47][0]
        }
        if(fractals[47][1] == true && data[47][1] < breakOfStructure){
          breakOfStructure = data[47][0]
        }
        if(closePrices21[20] < breakOfStructure && openPrices21[20] > breakOfStructure){
          sendTime = date.getMinutes()
          io.emit("BOS", true) 
        } else{
          io.emit("BOS", false)
        }
        if(closePrices21[20] > changeOfCharacter && openPrices21[20] < changeOfCharacter){
          sendTime = date.getMinutes()
          io.emit("CHOCH", true)
        } else{
          io.emit("CHOCH", false)
        }
      }
    }
  } catch (error){
    io.emit("error", true)
    clearInterval(interval)
  }
};
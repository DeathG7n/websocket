const WebSocket = require('ws');
const DerivAPIBasic = require('@deriv/deriv-api/dist/DerivAPIBasic');
const connection = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=36807');
const ta = require('ta.js')
const express = require('express')
const path = require("path")

const PORT = 3000;

const api = new DerivAPIBasic({ connection });

// -----------------------Deployment-------------------------


// ----------------------------------------------------------

const app = express();

app.get('/', async(req, res) => {
  res.send('Hello, this is a simple Express server!');
});

const server = app.listen(PORT, () => {
  setInterval(()=> getTicksHistory(), 1000)
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
    const period_21 = getTicksRequest(symbol, 21)
    const period_50 = getTicksRequest(symbol, 50)
    const candles_21 = await api.ticksHistory(period_21);
    const candles_50 = await api.ticksHistory(period_50);
    const closePrices21 = candles_21?.candles?.map(i => {return i?.close - 39.9991})
    const highPrices = candles_50?.candles?.map(i => {return i?.high - 35.4976})
    const lowPrices = candles_50?.candles?.map(i => {return i?.low - 35.5046})
    const openPrices21 = candles_21?.candles?.map(i => {return i?.open - 35.5046})
    const closePrices50 = candles_50?.candles?.map(i => {return i?.close - 39.9991})
    const ma21 = ta.sma(closePrices21, closePrices21.length)
    const ma50 = ta.sma(closePrices50, closePrices50.length)
    const data = []
    const isUptrend = ma21 > ma50 ? true : false
    for (let i = 0; i < highPrices.length; i++) {
        data.push([highPrices[i], lowPrices[i]])
    }
    const fractals = ta.fractals(data)
    if (isUptrend){
        if (fractals[47][0] == true){
            console.log("upperfractal")
        }
    } else {
        if (fractals[47][1] == true){
            console.log("lowerfractal")
        }
    }
    console.log(fractals[47][1])
};
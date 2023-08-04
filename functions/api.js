const WebSocket = require('ws');
const DerivAPIBasic = require('@deriv/deriv-api/dist/DerivAPIBasic');
const connection = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=36807');
const ta = require('ta.js')
const express = require('express')
const serverless = require('serverless-http')

const PORT = 8080;

const server = new WebSocket.Server({ port: PORT });

server.on('connection', (socket) => {
    console.log('A new client connected')
    socket.send("Connected")
    const alert = async() => {
        const alert = await getTicksHistory()
        if(alert){
            socket.send("Possible Trade Opportunity")
            pause()
        }
    }
    let interval = setInterval(()=> alert(), 1000)
    const pause = ()=> {
        console.log("function paused")
        clearInterval(interval)
        setTimeout(() => {
            interval = setInterval(()=>alert(), 1000);
        }, 300000);
    }
});

const api = new DerivAPIBasic({ connection });

const ticks_history_request = {
    ticks_history: 'R_75',
    count: 21,
    end: 'latest',
    style: 'candles',
    granularity: 300,
};

const getTicksHistory = async () => {
    const candles = await api.ticksHistory(ticks_history_request);
    const closePrices = candles?.candles?.map(i => {return i?.close - 35.495})
    const highPrices = candles?.candles?.map(i => {return i?.high - 35.4976})
    const lowPrices = candles?.candles?.map(i => {return i?.low - 35.5046})
    const openPrices = candles?.candles?.map(i => {return i?.open - 35.5046})
    const sma = ta.ema(closePrices, closePrices.length)
    let trade = false
    if(closePrices[19] > sma && openPrices[19] < sma ||  closePrices[19] < sma && openPrices[19] > sma){
        trade =  true
    } else {
        trade =  false
    }
    return trade
};

const app = express();
const router = express.Router()

router.get('/', async(req, res) => {
  res.send('Hello, this is a simple Express server!');
});

const port = 3000;

app.use("/", router)

module.exports.handler =serverless(app)

// app.listen(port, () => {
//   console.log(`Server is running on port 3000`);
// });

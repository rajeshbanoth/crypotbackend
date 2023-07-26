import Binance from "node-binance-api";

const { Spot } = require("@binance/connector");
import dotenv from "dotenv";

dotenv.config();

export const binance = new Binance().options({
  APIKEY: process.env.BINANCE_TEST_API_KEY,
  APISECRET: process.env.BINANCE_SECRET_API_KEY,
  useServerTime: true,
  test: true,
  urls: {
    base: "https://testnet.binance.vision/api/",
  },
});

const apiKey = process.env.BINANCE_TEST_API_KEY;
const apiSecret = process.env.BINANCE_SECRET_API_KEY;

const options = {
  baseURL: "https://testnet.binance.vision",
};
export const client = new Spot(apiKey, apiSecret, options);

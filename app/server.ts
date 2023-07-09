import express, { Express, Request, Response } from 'express';
import axios, { AxiosResponse } from 'axios';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import {ServerClient} from 'postmark';
import { Data } from './types'; 

dotenv.config();

export const app: Express = express();
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

const data: Data = { 
    cryptoList: ['BTC', 'ETH', 'XRP'],
    port: process.env.PORT || '3000'
};

// fetch information from the API's so they can get displayed on the form.ejs
app.get('/', async (req: Request, res: Response) => {
    try {

        const cryptoDataPromises: Promise<AxiosResponse>[] = data.cryptoList.map((crypto: string) => {
            return axios.get(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${crypto}`, {
                headers: { 'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY }
            });
        });

        const cryptoDataResponses: AxiosResponse[] = await Promise.all(cryptoDataPromises);

        const cryptoPrices: { [key: string]: number } = {};
        cryptoDataResponses.forEach((cryptoData: AxiosResponse, index: number) => {
            const crypto = data.cryptoList[index];
            const prices = cryptoData?.data?.data?.[crypto]?.quote?.USD?.price;
            if (typeof prices === 'number') {
                cryptoPrices[crypto] = prices;
            }
        });

        res.render('form', { cryptoList: data.cryptoList, cryptoPrices });
    } catch (error) {
        if (process.env.NODE_ENV !== 'test') {
            console.error(error);
        }
        res.status(500).send('Error fetching cryptocurrency data');
    }
});

// this is the E-mail functionality, where we are fetching data for both the crypto's and the exchange rates between currencies so we can put them in the E-mail content and post them using postmark to the email given in the form
app.post('/api/notify', async (req: Request, res: Response) => {
    const email = req.body.email;
    const crypto = req.body.crypto;

    try {
        const cryptoData: AxiosResponse = await axios.get(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${crypto}`, {
            headers: { 'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY }
        });

        const prices = cryptoData?.data?.data?.[crypto]?.quote?.USD?.price;
        if (typeof prices !== 'number') {
            throw new Error('Invalid crypto or missing price data');
        }

        const rates = await axios.get(`http://api.exchangeratesapi.io/latest?access_key=${process.env.EXCHANGE_API_KEY}`);
        const convertedPrices = {
            'USD': prices,
            'EUR': prices / rates.data.rates.USD * rates.data.rates.EUR,
            'BRL': prices / rates.data.rates.USD * rates.data.rates.BRL,
            'GBP': prices / rates.data.rates.USD * rates.data.rates.GBP,
            'AUD': prices / rates.data.rates.USD * rates.data.rates.AUD
        };

        const client = new ServerClient(process.env.POSTMARK_API_KEY || '');

        const message = {
            From: process.env.POSTMARK_SENDER_EMAIL || '',
            To: email,
            Subject: `${crypto} Latest Price`,
            TextBody: `The latest price for ${crypto} is: $${prices.toFixed(2)}\n\n` +
                `Converted Prices:\n` +
                `USD: $${convertedPrices.USD.toFixed(2)}\n` +
                `EUR: €${convertedPrices.EUR.toFixed(2)}\n` +
                `BRL: R$${convertedPrices.BRL.toFixed(2)}\n` +
                `GBP: £${convertedPrices.GBP.toFixed(2)}\n` +
                `AUD: A$${convertedPrices.AUD.toFixed(2)}`,
            Tag: 'crypto-notification'
        };

        await client.sendEmail(message);

       res.redirect('/?good');
    } catch (error) {
        if (process.env.NODE_ENV !== 'test') {
            console.error(error);
        }
        res.redirect('/?bad');
    }
});

export const server = app.listen(process.env.PORT || 3000, () => console.log(`Server running on port ${process.env.PORT || 3000}`));

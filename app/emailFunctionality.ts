import axios, { AxiosResponse } from 'axios';
import { ServerClient } from 'postmark';
import fs from 'fs';
import { Data } from './types'; 

const data: Data = {
    cryptoList: ['BTC', 'ETH', 'XRP'],
    port: process.env.PORT || '3000',
  };

export const sendWeeklyEmails = async () => {
    try {
      const emailList: string[] = JSON.parse(fs.readFileSync('app/emails.json', 'utf8')) || [];
      if (emailList.length === 0) {
        console.log('No emails to send');
        return;
      }
  
      const rates = await axios.get(`http://api.exchangeratesapi.io/latest?access_key=${process.env.EXCHANGE_API_KEY || ''}`);
      const client = new ServerClient(process.env.POSTMARK_API_KEY || '');
  
      emailList.forEach(async (email) => {
        data.cryptoList.forEach(async (crypto) => {
          const cryptoData: AxiosResponse = await axios.get(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${crypto}`, {
            headers: { 'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY || '' },
          });
  
          const prices = cryptoData?.data?.data?.[crypto]?.quote?.USD?.price;
          if (typeof prices === 'number') {
            const convertedPrices = {
              'USD': prices,
              'EUR': prices / rates.data.rates.USD * rates.data.rates.EUR,
              'BRL': prices / rates.data.rates.USD * rates.data.rates.BRL,
              'GBP': prices / rates.data.rates.USD * rates.data.rates.GBP,
              'AUD': prices / rates.data.rates.USD * rates.data.rates.AUD,
            };
  
            const message = {
              From: process.env.POSTMARK_SENDER_EMAIL || '',
              To: email,
              Subject: `${crypto} Latest Price`,
              TextBody: `The latest price for ${crypto} is: $${prices.toFixed(2)}\n\n` +
                `The latest price is:\n` +
                `USD: $${convertedPrices.USD.toFixed(2)}\n` +
                `EUR: €${convertedPrices.EUR.toFixed(2)}\n` +
                `BRL: R$${convertedPrices.BRL.toFixed(2)}\n` +
                `GBP: £${convertedPrices.GBP.toFixed(2)}\n` +
                `AUD: A$${convertedPrices.AUD.toFixed(2)}`,
              Tag: 'weekly-update',
            };
  
            await client.sendEmail(message);
          }
        });
      });
    } catch (error) {
      console.error('Error sending weekly emails:', error);
    }
  };

export const saveEmail = (email: string) => {
    try {
      let emails: string[] = [];
      const existingEmails = fs.readFileSync('app/emails.json', 'utf8');
  
      if (existingEmails.trim() !== '') {
        emails = JSON.parse(existingEmails);
      }
  
      if (emails.includes(email)) {
        return console.log('Email already exists:', email);
      }
      emails.push(email);

      fs.writeFileSync('app/emails.json', JSON.stringify(emails));
    } catch (error) {
      console.error('Error saving email:', error);
    }
  };

  export const scheduleWeeklyEmails = async () => {
    if (process.env.NODE_ENV !== 'test') {
        const oneWeekInMilliseconds = 7 * 24 * 60 * 60 * 1000;
        const currentDay = new Date().getDay();
        const daysUntilSunday = currentDay === 0 ? 0 : 7 - currentDay;
        const timeUntilSunday = daysUntilSunday * 24 * 60 * 60 * 1000;
    
        setTimeout(async () => {
        await sendWeeklyEmails();
        scheduleWeeklyEmails();
        }, timeUntilSunday + oneWeekInMilliseconds);
    }
  };
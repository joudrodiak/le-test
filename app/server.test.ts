import request from 'supertest';
import axios from 'axios';
import { ServerClient } from 'postmark';
import dotenv from 'dotenv';
import { app, server } from './server'; 
dotenv.config();

jest.mock('axios');
jest.mock('postmark');

describe('GET /', () => {
  it('responds with 200', async () => {
    (axios.get as jest.Mock).mockResolvedValue({
      data: {
        data: {
          BTC: {
            quote: {
              USD: {
                price: 50000,
              },
            },
          },
        },
      },
    });

    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
  });

  it('responds with 500 when there is an error', async () => {
    (axios.get as jest.Mock).mockRejectedValue(new Error('Error fetching cryptocurrency data'));

    const response = await request(app).get('/');
    expect(response.statusCode).toBe(500);
  });
});

describe('POST /api/notify', () => {
  it('responds with a redirect on success', async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({
      data: {
        data: {
          BTC: {
            quote: {
              USD: {
                price: 50000,
              },
            },
          },
        },
      },
    }).mockResolvedValueOnce({
      data: {
        rates: {
          USD: 1,
          EUR: 0.85,
          BRL: 5.04,
          GBP: 0.72,
          AUD: 1.30,
        },
      },
    });

    (ServerClient.prototype.sendEmail as jest.Mock).mockResolvedValue({});

    const response = await request(app)
      .post('/api/notify')
      .send({ email: process.env.POSTMARK_SENDER_EMAIL, crypto: 'BTC' });

    expect(response.statusCode).toBe(302);
  });

  it('responds with a redirect to /?bad on error', async () => {
    (axios.get as jest.Mock).mockRejectedValue(new Error('Error processing request'));

    const response = await request(app)
      .post('/api/notify')
      .send({ email: process.env.POSTMARK_SENDER_EMAIL, crypto: 'BTC' });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe('/?bad');
  });
});

afterAll(done => {
  server.close(done);
});

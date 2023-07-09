# Crypto Price Notifier

This application provides real-time cryptocurrency prices and sends notifications about the latest prices to a specified email.

## Features

- Fetches real-time prices for Bitcoin (BTC), Ethereum (ETH), and Ripple (XRP).
- Sends an email notification with the latest prices and their conversions to different currencies (USD, EUR, BRL, GBP, AUD).

## Installation

1. Clone the repository:

```
git clone https://github.com/yourusername/cryptopricenotifier.git
```

2. Install the dependencies:

```
cd cryptopricenotifier
npm install
```

## Configuration

Create a \`.env\` file in the root directory of the project and add the following environment variables:

```
NODE_ENV=development
PORT=3000
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key
EXCHANGE_API_KEY=your_exchange_api_key
POSTMARK_API_KEY=your_postmark_api_key
POSTMARK_SENDER_EMAIL=your_postmark_sender_email
```

Replace \`your_coinmarketcap_api_key\`, \`your_exchange_api_key\`, \`your_postmark_api_key\`, and \`your_postmark_sender_email\` with your actual API keys and email.

## Usage

To run the server you have 2 options:

First option:

Start the server:

```
npm start
```

The server will start running at \`http://localhost:3000\`.

Second option:

build the dockerfile with:
```
docker build -t {chosenName} .  
```

then run it with exposting the port 3000 with:
```
docker run -p 3000:3000 {chosenName}  
```

## Endpoints

- \`GET /\`: Fetches the latest prices for BTC, ETH, and XRP and renders them on a form.
- \`POST /api/notify\`: Sends an email notification with the latest prices and their conversions to different currencies. The email and the cryptocurrency symbol (BTC, ETH, or XRP) should be provided in the request body.

## Testing

To run the tests:

Change NODE_ENV to test env by:

```
export NODE_ENV=test
```

```
npm test
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

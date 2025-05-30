# MyFinances

A React Native mobile application for tracking investments and managing your portfolio. Built with Expo, React Native, and Zustand.

## Features

- Track stocks, cryptocurrencies, ETFs, and cash holdings
- Real-time price updates
- Portfolio distribution visualization
- Currency conversion for cash holdings
- Secure authentication
- Offline support with AsyncStorage

## Tech Stack

- React Native
- Expo
- Zustand (State Management)
- React Navigation
- React Native Chart Kit
- AsyncStorage
- OpenExchangeRates API
- Yahoo Finance API
- CoinGecko API

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/santiagogarzon/myfinances.git
cd myfinances
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Start the development server:

```bash
npx expo start
```

## Environment Setup

1. Create a `.env` file in the root directory
2. Add your API keys:

```
OPEN_EXCHANGE_RATES_APP_ID=your_app_id_here
```

## Building for Production

### iOS

```bash
eas build --platform ios
```

### Android

```bash
eas build --platform android
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

Santiago Garzon - [@santiagogarzon](https://github.com/santiagogarzon)

Project Link: [https://github.com/santiagogarzon/myfinances](https://github.com/santiagogarzon/myfinances)

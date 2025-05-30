# MyFinances - Investment Portfolio Tracker

A React Native mobile application built with Expo that helps users track their investments in stocks, ETFs, and cryptocurrencies.

## Features

- Track stocks, ETFs, and cryptocurrencies in one place
- Real-time price updates from Yahoo Finance (stocks/ETFs) and CoinGecko (crypto)
- Add and remove assets with quantity tracking
- View total portfolio value and individual asset values
- Dark mode support
- Offline data persistence
- Pull-to-refresh for price updates
- Toast notifications for user feedback

## Tech Stack

- Expo with React Native
- TypeScript for type safety
- Zustand for state management
- TanStack Query (React Query) for data fetching
- React Hook Form for form management
- FlashList for efficient list rendering
- NativeWind (Tailwind CSS) for styling
- AsyncStorage for local data persistence

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Expo CLI
- iOS Simulator (for Mac) or Android Emulator

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd MyFinances
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm start
```

4. Run on iOS or Android:

```bash
# For iOS
npm run ios

# For Android
npm run android
```

## Project Structure

```
src/
  ├── components/     # Reusable UI components
  ├── screens/        # Screen components
  ├── hooks/          # Custom React hooks
  ├── store/          # Zustand store
  ├── services/       # API services
  ├── types/          # TypeScript types
  ├── utils/          # Utility functions
  └── constants/      # Constants and configuration
```

## API Integration

The app uses two main APIs:

- Yahoo Finance API for stocks and ETFs
- CoinGecko API for cryptocurrencies

Note: These are free APIs with rate limits. For production use, consider using paid API keys.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

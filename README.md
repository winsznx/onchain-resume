# On-Chain Resume 🚀

Your Web3 builder profile in one place.

## Features

- 🔗 **WalletConnect Integration** - Connect with any Web3 wallet
- 📊 **On-Chain Stats** - Transaction history, gas spent, wallet age
- 🏆 **POAP Collection** - Display your achievement badges
- 📜 **Smart Contracts** - Showcase contracts you've deployed
- 🌐 **Multi-Chain Support** - Ethereum, Base, Optimism, Sepolia
- 📱 **Responsive Design** - Beautiful on desktop and mobile

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Web3**: WalletConnect AppKit, Wagmi, Viem
- **APIs**: Etherscan, SimpleHash
- **Hosting**: Vercel

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your API keys to .env

# Run development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

Create a `.env` file with:

```bash
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
VITE_ETHERSCAN_API_KEY=your_etherscan_key
VITE_SIMPLEHASH_API_KEY=your_simplehash_key
```

### Get Your API Keys

1. **WalletConnect**: https://cloud.walletconnect.com/
2. **Etherscan**: https://etherscan.io/apis
3. **SimpleHash**: https://simplehash.com/

## Project Structure

```
onchain-resume/
├── src/
│   ├── components/
│   │   └── Resume.jsx         # Main resume component
│   ├── config/
│   │   └── wallet.js          # WalletConnect configuration
│   ├── App.jsx                # App wrapper
│   ├── main.jsx               # Entry point
│   └── index.css              # Global styles
├── .env                       # Environment variables
├── package.json
└── vite.config.js
```

## Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

Or connect your GitHub repo to Vercel dashboard for automatic deployments.

## Features Roadmap

- [ ] Multi-chain balance display
- [ ] Farcaster profile integration
- [ ] PDF export functionality
- [ ] Custom themes
- [ ] Shareable profile links
- [ ] GitHub activity integration
- [ ] DAO membership badges

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

MIT

## Built With 💜

Built using WalletConnect AppKit for seamless Web3 wallet connection.

---

**Live Demo**: [Add your Vercel URL here]

**Creator**: winszn
// src/config/wallet.js
import { createAppKit } from '@reown/appkit/react'
import { mainnet, base, optimism, sepolia } from '@reown/appkit/networks'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { QueryClient } from '@tanstack/react-query'

// Get your project ID from https://cloud.walletconnect.com/
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID_HERE'

// Set up networks
export const networks = [mainnet, base, optimism, sepolia]

// Set up Wagmi adapter
export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId
})

// Create the modal
const metadata = {
  name: 'On-Chain Resume',
  description: 'Your Web3 Builder Profile',
  url: 'https://onchainresume.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  metadata,
  projectId,
  features: {
    analytics: true
  }
})

// Query client
export const queryClient = new QueryClient()

// Export config
export const config = wagmiAdapter.wagmiConfig
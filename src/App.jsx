// src/App.jsx
import { WagmiProvider } from 'wagmi'
import { QueryClientProvider } from '@tanstack/react-query'
import { config, queryClient } from './config/wallet'
import Resume from './components/Resume'

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Resume />
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App
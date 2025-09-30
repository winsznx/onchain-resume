// src/components/Resume.jsx - COMPLETE FIXED VERSION
import { useState, useEffect } from 'react'
import { useAccount, useEnsName } from 'wagmi'
import { useAppKit } from '@reown/appkit/react'
import { 
  Wallet, Github, MessageCircle, Award, 
  Code, TrendingUp, Calendar, ExternalLink, Loader2 
} from 'lucide-react'

export default function Resume() {
  const { address, isConnected } = useAccount()
  const { data: ensName } = useEnsName({ address })
  const { open } = useAppKit()
  
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState(null)
  const [socialLinks, setSocialLinks] = useState({
    github: '',
    farcaster: '',
    website: ''
  })
  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    if (address) {
      fetchProfileData(address)
    }
  }, [address])

  const fetchProfileData = async (walletAddress) => {
    setLoading(true)
    try {
      const [txData, nftData] = await Promise.all([
        fetchTransactionData(walletAddress),
        fetchNFTData(walletAddress)
      ])

      setProfileData({
        ...txData,
        ...nftData
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactionData = async (address) => {
    const ETHERSCAN_API_KEY = import.meta.env.VITE_ETHERSCAN_API_KEY
    
    const networks = [
      { name: 'Ethereum Mainnet', api: 'https://api.etherscan.io/api', key: ETHERSCAN_API_KEY },
      { name: 'Sepolia Testnet', api: 'https://api-sepolia.etherscan.io/api', key: ETHERSCAN_API_KEY },
      { name: 'Base', api: 'https://api.basescan.org/api', key: ETHERSCAN_API_KEY },
      { name: 'Optimism', api: 'https://api-optimistic.etherscan.io/api', key: ETHERSCAN_API_KEY },
      { name: 'Arbitrum', api: 'https://api.arbiscan.io/api', key: ETHERSCAN_API_KEY },
      { name: 'Polygon', api: 'https://api.polygonscan.com/api', key: ETHERSCAN_API_KEY }
    ]
    
    let allTransactions = []
    let activeChains = []
    let totalGasSpent = 0
    let contractDeployments = 0
    let firstTxDate = null
    
    const results = await Promise.all(
      networks.map(async (network) => {
        try {
          const response = await fetch(
            `${network.api}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc&apikey=${network.key}`
          )
          const data = await response.json()
          
          if (data.status === '1' && data.result && data.result.length > 0) {
            return {
              network: network.name,
              transactions: data.result
            }
          }
          return null
        } catch (error) {
          console.error(`Error fetching from ${network.name}:`, error)
          return null
        }
      })
    )
    
    results.forEach(result => {
      if (result && result.transactions.length > 0) {
        activeChains.push(result.network)
        allTransactions.push(...result.transactions)
        
        const deploys = result.transactions.filter(tx => tx.to === '')
        contractDeployments += deploys.length
        
        const chainGas = result.transactions.reduce((sum, tx) => {
          return sum + (parseInt(tx.gasUsed) * parseInt(tx.gasPrice))
        }, 0)
        totalGasSpent += chainGas
        
        const firstTx = result.transactions[0]
        const txDate = new Date(parseInt(firstTx.timeStamp) * 1000)
        if (!firstTxDate || txDate < firstTxDate) {
          firstTxDate = txDate
        }
      }
    })
    
    if (allTransactions.length === 0) {
      return {
        totalTransactions: 0,
        walletAge: 'Unknown',
        gasSpent: '0 ETH',
        contractsDeployed: 0,
        firstTransaction: 'N/A',
        chainsActive: []
      }
    }
    
    const walletAge = Math.floor((Date.now() - firstTxDate) / (1000 * 60 * 60 * 24))
    const walletAgeStr = walletAge < 1 
      ? 'Less than 1 day' 
      : walletAge < 365
      ? `${walletAge} days`
      : `${Math.floor(walletAge / 365)} years ${walletAge % 365} days`
    
    const gasInEth = (totalGasSpent / 1e18).toFixed(4)
    
    return {
      totalTransactions: allTransactions.length,
      walletAge: walletAgeStr,
      gasSpent: `${gasInEth} ETH`,
      contractsDeployed: contractDeployments,
      firstTransaction: firstTxDate.toLocaleDateString(),
      chainsActive: activeChains
    }
  }

  const fetchNFTData = async (address) => {
    const ALCHEMY_API_KEY = import.meta.env.VITE_ALCHEMY_API_KEY
    
    try {
      const response = await fetch(
        `https://eth-mainnet.g.alchemy.com/nft/v3/${ALCHEMY_API_KEY}/getNFTsForOwner?owner=${address}&withMetadata=true&pageSize=100`
      )
      const data = await response.json()
      
      if (!data.ownedNfts || data.ownedNfts.length === 0) {
        return {
          poaps: [],
          totalNFTs: 0,
          nfts: []
        }
      }

      const POAP_CONTRACT = '0x22c1f6050e56d2876009903609a2cc3fef83b415'
      const poaps = data.ownedNfts
        .filter(nft => nft.contract?.address?.toLowerCase() === POAP_CONTRACT.toLowerCase())
        .slice(0, 8)
        .map(nft => ({
          id: nft.tokenId,
          name: nft.name || nft.contract?.name || 'POAP',
          image: nft.image?.thumbnailUrl || nft.image?.cachedUrl || nft.image?.originalUrl || '🏆',
          description: nft.description || ''
        }))

      const otherNFTs = data.ownedNfts
        .filter(nft => nft.contract?.address?.toLowerCase() !== POAP_CONTRACT.toLowerCase())
        .slice(0, 12)
        .map(nft => ({
          id: nft.tokenId,
          name: nft.name || nft.contract?.name || 'NFT',
          image: nft.image?.thumbnailUrl || nft.image?.cachedUrl || nft.image?.originalUrl,
          collection: nft.contract?.name || 'Unknown Collection'
        }))

      return {
        poaps,
        totalNFTs: data.ownedNfts.length,
        nfts: otherNFTs
      }
    } catch (error) {
      console.error('Error fetching NFTs from Alchemy:', error)
      console.log('Make sure your Alchemy API key is correct in .env file')
      return {
        poaps: [],
        totalNFTs: 0,
        nfts: []
      }
    }
  }

  const formatAddress = (addr) => {
    return `${addr?.slice(0, 6)}...${addr?.slice(-4)}`
  }

  const exportToPDF = () => {
    const content = `
ON-CHAIN RESUME
===============

Profile: ${ensName || formatAddress(address)}
Builder since: ${profileData?.walletAge || 'recently'}
First transaction: ${profileData?.firstTransaction || 'N/A'}

STATS
-----
Total Transactions: ${profileData?.totalTransactions?.toLocaleString() || '0'}
Contracts Deployed: ${profileData?.contractsDeployed || '0'}
NFTs Collected: ${profileData?.totalNFTs || '0'}
Gas Spent: ${profileData?.gasSpent || '0 ETH'}

CHAINS ACTIVE
-------------
${profileData?.chainsActive?.join(', ') || 'None'}

SOCIAL LINKS
------------
GitHub: ${socialLinks.github ? `https://github.com/${socialLinks.github}` : 'Not provided'}
Farcaster: ${socialLinks.farcaster ? `https://warpcast.com/${socialLinks.farcaster}` : 'Not provided'}
Website: ${socialLinks.website || 'Not provided'}

Generated from: ${window.location.href}
Generated on: ${new Date().toLocaleString()}
    `.trim()

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${ensName || 'onchain'}-resume.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportToImage = () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    canvas.width = 1200
    canvas.height = 630
    
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, '#0f172a')
    gradient.addColorStop(0.5, '#581c87')
    gradient.addColorStop(1, '#0f172a')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.fillText('On-Chain Resume', 60, 80)
    
    ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.fillStyle = '#e9d5ff'
    ctx.fillText(ensName || formatAddress(address), 60, 150)
    
    ctx.font = '24px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.fillStyle = '#c084fc'
    ctx.fillText(`Builder since ${profileData?.walletAge || 'recently'}`, 60, 190)
    
    const stats = [
      { label: 'Transactions', value: profileData?.totalTransactions?.toLocaleString() || '0', color: '#a78bfa' },
      { label: 'Contracts', value: profileData?.contractsDeployed || '0', color: '#ec4899' },
      { label: 'NFTs', value: profileData?.totalNFTs || '0', color: '#60a5fa' },
      { label: 'Gas Spent', value: profileData?.gasSpent || '0 ETH', color: '#34d399' }
    ]
    
    let xPos = 60
    const yPos = 260
    const boxWidth = 250
    const boxHeight = 120
    const gap = 30
    
    stats.forEach((stat, i) => {
      if (i === 2) {
        xPos = 60
      }
      
      const currentY = i < 2 ? yPos : yPos + boxHeight + gap
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.fillRect(xPos, currentY, boxWidth, boxHeight)
      
      ctx.fillStyle = stat.color
      ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, sans-serif'
      ctx.fillText(stat.value, xPos + 20, currentY + 50)
      
      ctx.fillStyle = '#c084fc'
      ctx.font = '18px -apple-system, BlinkMacSystemFont, sans-serif'
      ctx.fillText(stat.label, xPos + 20, currentY + 85)
      
      if (i < 2) xPos += boxWidth + gap
    })
    
    ctx.fillStyle = '#9333ea'
    ctx.font = '16px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.fillText('Built by Winszn', 60, 580)
    
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${ensName || 'onchain'}-resume.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    })
  }

  if (loading && isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto" />
          <p className="text-purple-200 text-xl">Loading your on-chain resume...</p>
          <p className="text-purple-400 text-sm">Scanning multiple blockchains...</p>
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center space-y-8 max-w-2xl">
          <div className="space-y-4">
            <h1 className="text-6xl font-bold text-white">
              On-Chain Resume
            </h1>
            <p className="text-xl text-purple-200">
              Your Web3 identity, achievements, and builder journey in one place
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <div className="grid grid-cols-2 gap-4 mb-8 text-left">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-purple-300">
                  <Award className="w-5 h-5" />
                  <span className="font-semibold">POAPs & NFTs</span>
                </div>
                <div className="flex items-center gap-2 text-purple-300">
                  <Code className="w-5 h-5" />
                  <span className="font-semibold">Smart Contracts</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-purple-300">
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-semibold">Social Presence</span>
                </div>
                <div className="flex items-center gap-2 text-purple-300">
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-semibold">Multi-Chain Support</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => open()}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-105 flex items-center justify-center gap-3"
            >
              <Wallet className="w-6 h-6" />
              Connect Wallet to Continue
            </button>
          </div>

          <p className="text-sm text-purple-300">
            Powered by WalletConnect • Built for Web3 Builders
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-lg sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">On-Chain Resume</h1>
          <div className="flex items-center gap-4">
            <div className="bg-white/10 px-4 py-2 rounded-lg border border-white/20">
              <span className="text-sm text-purple-300">
                {ensName || formatAddress(address)}
              </span>
            </div>
            <button
              onClick={() => open()}
              className="bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded-lg transition-colors text-sm"
            >
              Change Wallet
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-4xl">
              👤
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h2 className="text-3xl font-bold">{ensName || 'Web3 Builder'}</h2>
                <p className="text-purple-300">
                  Builder since {profileData?.walletAge || 'recently'}
                </p>
                <p className="text-sm text-purple-400 mt-1">
                  First transaction: {profileData?.firstTransaction}
                </p>
              </div>
              {editMode ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="GitHub username"
                    value={socialLinks.github}
                    onChange={(e) => setSocialLinks({...socialLinks, github: e.target.value})}
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-purple-400"
                  />
                  <input
                    type="text"
                    placeholder="Farcaster username"
                    value={socialLinks.farcaster}
                    onChange={(e) => setSocialLinks({...socialLinks, farcaster: e.target.value})}
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-purple-400"
                  />
                  <input
                    type="text"
                    placeholder="Website URL"
                    value={socialLinks.website}
                    onChange={(e) => setSocialLinks({...socialLinks, website: e.target.value})}
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-purple-400"
                  />
                  <button
                    onClick={() => setEditMode(false)}
                    className="text-sm text-purple-400 hover:text-purple-300"
                  >
                    ✓ Save Links
                  </button>
                </div>
              ) : (
                <div className="flex gap-4 items-center">
                  {socialLinks.github ? (
                    <a 
                      href={`https://github.com/${socialLinks.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-purple-300 hover:text-purple-200 transition-colors"
                    >
                      <Github className="w-5 h-5" />
                      <span>GitHub</span>
                    </a>
                  ) : (
                    <span className="flex items-center gap-2 text-purple-500">
                      <Github className="w-5 h-5" />
                      <span>GitHub</span>
                    </span>
                  )}
                  {socialLinks.farcaster ? (
                    <a 
                      href={`https://warpcast.com/${socialLinks.farcaster}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-purple-300 hover:text-purple-200 transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>Farcaster</span>
                    </a>
                  ) : (
                    <span className="flex items-center gap-2 text-purple-500">
                      <MessageCircle className="w-5 h-5" />
                      <span>Farcaster</span>
                    </span>
                  )}
                  {socialLinks.website && (
                    <a 
                      href={socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-purple-300 hover:text-purple-200 transition-colors"
                    >
                      <ExternalLink className="w-5 h-5" />
                      <span>Website</span>
                    </a>
                  )}
                  <button
                    onClick={() => setEditMode(true)}
                    className="text-sm text-purple-400 hover:text-purple-300 ml-2"
                  >
                    ✏️ Edit
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="text-3xl font-bold text-purple-400">
              {profileData?.totalTransactions?.toLocaleString() || '0'}
            </div>
            <div className="text-sm text-purple-300 mt-1">Total Transactions</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="text-3xl font-bold text-pink-400">
              {profileData?.contractsDeployed || '0'}
            </div>
            <div className="text-sm text-purple-300 mt-1">Contracts Deployed</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="text-3xl font-bold text-blue-400">
              {profileData?.totalNFTs || '0'}
            </div>
            <div className="text-sm text-purple-300 mt-1">NFTs Collected</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="text-3xl font-bold text-green-400">
              {profileData?.gasSpent || '0 ETH'}
            </div>
            <div className="text-sm text-purple-300 mt-1">Gas Spent</div>
          </div>
        </div>

        {profileData?.chainsActive && profileData.chainsActive.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-purple-400" />
              Active Chains ({profileData.chainsActive.length})
            </h3>
            <div className="flex flex-wrap gap-3">
              {profileData.chainsActive.map((chain) => (
                <span key={chain} className="bg-purple-500/20 border border-purple-500/30 px-4 py-2 rounded-lg text-purple-200">
                  {chain}
                </span>
              ))}
            </div>
          </div>
        )}

        {profileData?.poaps && profileData.poaps.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Award className="w-6 h-6 text-purple-400" />
              POAPs Collected ({profileData.poaps.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {profileData.poaps.map((poap, index) => (
                <div 
                  key={`${poap.id}-${index}`}
                  className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-purple-500/50 transition-all cursor-pointer group"
                >
                  {poap.image && poap.image !== '🏆' ? (
                    <img 
                      src={poap.image} 
                      alt={poap.name}
                      className="w-full aspect-square object-cover rounded-lg mb-2 group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ctext y="50" font-size="50"%3E🏆%3C/text%3E%3C/svg%3E'
                      }}
                    />
                  ) : (
                    <div className="w-full aspect-square bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg mb-2 flex items-center justify-center text-4xl">
                      🏆
                    </div>
                  )}
                  <div className="text-sm text-purple-200 text-center line-clamp-2">
                    {poap.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {profileData?.nfts && profileData.nfts.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Code className="w-6 h-6 text-purple-400" />
              Notable NFTs
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {profileData.nfts.map((nft, index) => (
                <div 
                  key={`${nft.id}-${index}`}
                  className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-pink-500/50 transition-all cursor-pointer"
                >
                  {nft.image ? (
                    <img 
                      src={nft.image} 
                      alt={nft.name}
                      className="w-full aspect-square object-cover rounded-lg mb-2"
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="w-full aspect-square bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg mb-2 flex items-center justify-center text-4xl">
                      🖼️
                    </div>
                  )}
                  <div className="text-sm text-purple-200 text-center truncate">
                    {nft.name}
                  </div>
                  <div className="text-xs text-purple-400 text-center truncate">
                    {nft.collection}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center">
          <h3 className="text-2xl font-bold mb-4">Share Your Resume</h3>
          <p className="text-purple-200 mb-6">
            Your profile: {ensName || formatAddress(address)}
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button 
              onClick={() => {
                navigator.clipboard.writeText(window.location.href)
                alert('Link copied to clipboard!')
              }}
              className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-lg border border-white/20 transition-colors"
            >
              📋 Copy Link
            </button>
            <button 
              onClick={exportToImage}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-6 py-3 rounded-lg transition-all"
            >
              🖼️ Export as Image
            </button>
            <button 
              onClick={exportToPDF}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-6 py-3 rounded-lg transition-all"
            >
              📄 Download Resume
            </button>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 bg-black/20 backdrop-blur-lg mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-purple-300 text-sm">
        </div>
      </footer>
    </div>
  )
}
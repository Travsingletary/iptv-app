import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
// Note: Replace these with your actual Supabase URL and anon key
const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'
const supabase = createClient(supabaseUrl, supabaseKey)

// IPTV App State Management (using simple state for now)
const appState = {
    channels: [],
    currentChannel: null,
    loading: false
}

// Sample channel data (replace with actual data from your backend)
const sampleChannels = [
    {
        id: 1,
        name: "Sports Channel",
        description: "Live sports and entertainment",
        url: "https://example.com/stream1",
        logo: "https://via.placeholder.com/100x60?text=SPORTS"
    },
    {
        id: 2,
        name: "News Channel",
        description: "24/7 news coverage",
        url: "https://example.com/stream2",
        logo: "https://via.placeholder.com/100x60?text=NEWS"
    },
    {
        id: 3,
        name: "Entertainment",
        description: "Movies and shows",
        url: "https://example.com/stream3",
        logo: "https://via.placeholder.com/100x60?text=MOVIES"
    }
]

// Initialize the app
async function initApp() {
    console.log('Initializing IPTV App...')
    
    try {
        // Load channels (from Supabase or use sample data)
        await loadChannels()
        
        // Render the UI
        renderChannels()
        
        console.log('IPTV App initialized successfully!')
    } catch (error) {
        console.error('Failed to initialize app:', error)
        showError('Failed to load channels. Please check your connection.')
    }
}

// Load channels from backend
async function loadChannels() {
    appState.loading = true
    
    try {
        // Uncomment this when your Supabase is configured:
        // const { data, error } = await supabase
        //     .from('channels')
        //     .select('*')
        // 
        // if (error) throw error
        // appState.channels = data
        
        // For now, use sample data
        appState.channels = sampleChannels
    } catch (error) {
        console.error('Error loading channels:', error)
        appState.channels = sampleChannels // Fallback to sample data
    } finally {
        appState.loading = false
    }
}

// Render channels in the UI
function renderChannels() {
    const channelList = document.getElementById('channel-list')
    
    if (!channelList) {
        console.error('Channel list element not found')
        return
    }
    
    if (appState.loading) {
        channelList.innerHTML = '<div class="col-span-full text-center">Loading channels...</div>'
        return
    }
    
    if (appState.channels.length === 0) {
        channelList.innerHTML = '<div class="col-span-full text-center text-gray-400">No channels available</div>'
        return
    }
    
    channelList.innerHTML = appState.channels.map(channel => `
        <div class="channel-card" onclick="selectChannel(${channel.id})">
            <img src="${channel.logo}" alt="${channel.name}" class="w-full h-16 object-cover mb-2 rounded">
            <h3>${channel.name}</h3>
            <p>${channel.description}</p>
        </div>
    `).join('')
}

// Select and play a channel
function selectChannel(channelId) {
    const channel = appState.channels.find(ch => ch.id === channelId)
    if (!channel) {
        console.error('Channel not found:', channelId)
        return
    }
    
    appState.currentChannel = channel
    console.log('Selected channel:', channel.name)
    
    // Here you would typically integrate with your video player
    // For now, just show an alert
    alert(`Selected: ${channel.name}\n\nIn a full implementation, this would start playing the stream from: ${channel.url}`)
}

// Show error message to user
function showError(message) {
    const channelList = document.getElementById('channel-list')
    if (channelList) {
        channelList.innerHTML = `<div class="col-span-full text-center text-red-400">${message}</div>`
    }
}

// Make selectChannel available globally
window.selectChannel = selectChannel

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp)

console.log('IPTV App script loaded')
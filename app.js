// IPTV App JavaScript
class IPTVApp {
    constructor() {
        this.channels = [];
        this.categories = [];
        this.currentChannel = null;
        this.videoPlayer = document.getElementById('videoPlayer');
        this.settings = {
            autoplay: true,
            volume: 0.7,
            playlistUrl: ''
        };
        
        this.init();
        this.loadSettings();
    }

    init() {
        this.setupEventListeners();
        this.loadSampleChannels();
        this.renderCategories();
        this.renderChannels();
    }

    setupEventListeners() {
        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterChannels(e.target.value);
        });

        // Settings modal
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.showSettingsModal();
        });

        document.getElementById('closeSettings').addEventListener('click', () => {
            this.hideSettingsModal();
        });

        document.getElementById('cancelSettings').addEventListener('click', () => {
            this.hideSettingsModal();
        });

        document.getElementById('saveSettings').addEventListener('click', () => {
            this.saveSettings();
        });

        // Volume control
        document.getElementById('volumeSlider').addEventListener('input', (e) => {
            this.setVolume(e.target.value / 100);
        });

        // Fullscreen toggle
        document.getElementById('fullscreenBtn').addEventListener('click', () => {
            this.toggleFullscreen();
        });

        // Video player events
        this.videoPlayer.addEventListener('loadstart', () => {
            this.showLoading();
        });

        this.videoPlayer.addEventListener('canplay', () => {
            this.hideLoading();
        });

        this.videoPlayer.addEventListener('error', (e) => {
            this.hideLoading();
            this.showError('Failed to load stream. Please try another channel.');
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });
    }

    loadSampleChannels() {
        // Sample IPTV channels for demonstration
        this.channels = [
            {
                id: 1,
                name: "News Channel 1",
                category: "News",
                url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                logo: "https://via.placeholder.com/50x50/4F46E5/white?text=N1"
            },
            {
                id: 2,
                name: "Sports Network",
                category: "Sports",
                url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
                logo: "https://via.placeholder.com/50x50/EF4444/white?text=SP"
            },
            {
                id: 3,
                name: "Movie Channel",
                category: "Entertainment",
                url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
                logo: "https://via.placeholder.com/50x50/10B981/white?text=MC"
            },
            {
                id: 4,
                name: "Documentary Plus",
                category: "Documentary",
                url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
                logo: "https://via.placeholder.com/50x50/F59E0B/white?text=DP"
            },
            {
                id: 5,
                name: "Kids TV",
                category: "Kids",
                url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
                logo: "https://via.placeholder.com/50x50/8B5CF6/white?text=KTV"
            },
            {
                id: 6,
                name: "Music Videos",
                category: "Music",
                url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
                logo: "https://via.placeholder.com/50x50/EC4899/white?text=MV"
            }
        ];

        this.categories = [...new Set(this.channels.map(ch => ch.category))];
    }

    renderCategories() {
        const categoryList = document.getElementById('categoryList');
        categoryList.innerHTML = '';

        // All channels option
        const allOption = this.createCategoryElement('All', this.channels.length, true);
        categoryList.appendChild(allOption);

        // Individual categories
        this.categories.forEach(category => {
            const count = this.channels.filter(ch => ch.category === category).length;
            const categoryElement = this.createCategoryElement(category, count);
            categoryList.appendChild(categoryElement);
        });
    }

    createCategoryElement(name, count, isActive = false) {
        const div = document.createElement('div');
        div.className = `cursor-pointer p-3 rounded-lg transition-colors ${
            isActive ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'
        }`;
        div.innerHTML = `
            <div class="flex justify-between items-center">
                <span class="font-medium">${name}</span>
                <span class="text-sm text-gray-300">${count}</span>
            </div>
        `;

        div.addEventListener('click', () => {
            this.filterByCategory(name === 'All' ? null : name);
            this.updateCategorySelection(div);
        });

        return div;
    }

    renderChannels(channelsToRender = this.channels) {
        const channelList = document.getElementById('channelList');
        channelList.innerHTML = '';

        if (channelsToRender.length === 0) {
            channelList.innerHTML = '<p class="text-gray-400 text-center py-4">No channels found</p>';
            return;
        }

        channelsToRender.forEach(channel => {
            const channelElement = this.createChannelElement(channel);
            channelList.appendChild(channelElement);
        });
    }

    createChannelElement(channel) {
        const div = document.createElement('div');
        div.className = 'cursor-pointer p-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors';
        div.innerHTML = `
            <div class="flex items-center space-x-3">
                <img src="${channel.logo}" alt="${channel.name}" class="w-8 h-8 rounded">
                <div class="flex-1 min-w-0">
                    <p class="font-medium truncate">${channel.name}</p>
                    <p class="text-sm text-gray-400">${channel.category}</p>
                </div>
            </div>
        `;

        div.addEventListener('click', () => {
            this.playChannel(channel);
        });

        return div;
    }

    playChannel(channel) {
        this.currentChannel = channel;
        this.showLoading();

        // Update UI
        document.getElementById('welcomeScreen').style.display = 'none';
        document.getElementById('videoPlayer').style.display = 'block';
        document.getElementById('nowPlaying').style.display = 'block';

        // Update now playing info
        document.getElementById('currentChannelName').textContent = channel.name;
        document.getElementById('currentChannelCategory').textContent = channel.category;

        // Load and play video
        this.videoPlayer.src = channel.url;
        this.videoPlayer.volume = this.settings.volume;
        
        if (this.settings.autoplay) {
            this.videoPlayer.play().catch(e => {
                console.warn('Autoplay failed:', e);
                this.hideLoading();
            });
        } else {
            this.hideLoading();
        }

        // Update channel selection
        this.updateChannelSelection();
    }

    filterChannels(searchTerm) {
        const filteredChannels = this.channels.filter(channel =>
            channel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            channel.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.renderChannels(filteredChannels);
    }

    filterByCategory(category) {
        if (category) {
            const filteredChannels = this.channels.filter(ch => ch.category === category);
            this.renderChannels(filteredChannels);
        } else {
            this.renderChannels(this.channels);
        }
    }

    updateCategorySelection(selectedElement) {
        // Remove active class from all categories
        document.querySelectorAll('#categoryList > div').forEach(el => {
            el.className = el.className.replace('bg-blue-600 text-white', 'bg-gray-700 hover:bg-gray-600');
        });

        // Add active class to selected category
        selectedElement.className = selectedElement.className.replace('bg-gray-700 hover:bg-gray-600', 'bg-blue-600 text-white');
    }

    updateChannelSelection() {
        // Remove active styling from all channels
        document.querySelectorAll('#channelList > div').forEach(el => {
            el.className = el.className.replace('bg-blue-600', 'bg-gray-700');
        });

        // Add active styling to current channel (if visible)
        if (this.currentChannel) {
            const channelElements = document.querySelectorAll('#channelList > div');
            channelElements.forEach(el => {
                if (el.textContent.includes(this.currentChannel.name)) {
                    el.className = el.className.replace('bg-gray-700', 'bg-blue-600');
                }
            });
        }
    }

    setVolume(volume) {
        this.settings.volume = volume;
        this.videoPlayer.volume = volume;
        this.saveSettings();
    }

    toggleFullscreen() {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            this.videoPlayer.requestFullscreen().catch(e => {
                console.warn('Fullscreen failed:', e);
            });
        }
    }

    showLoading() {
        document.getElementById('loadingOverlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }

    showError(message) {
        // Simple error display - could be enhanced with a proper modal
        alert(message);
    }

    showSettingsModal() {
        document.getElementById('settingsModal').style.display = 'flex';
        document.getElementById('playlistUrl').value = this.settings.playlistUrl;
        document.getElementById('autoplayToggle').checked = this.settings.autoplay;
    }

    hideSettingsModal() {
        document.getElementById('settingsModal').style.display = 'none';
    }

    saveSettings() {
        this.settings.playlistUrl = document.getElementById('playlistUrl').value;
        this.settings.autoplay = document.getElementById('autoplayToggle').checked;
        
        // Save to localStorage
        localStorage.setItem('iptvSettings', JSON.stringify(this.settings));
        
        // If playlist URL is provided, load it
        if (this.settings.playlistUrl) {
            this.loadPlaylist(this.settings.playlistUrl);
        }
        
        this.hideSettingsModal();
    }

    loadSettings() {
        const saved = localStorage.getItem('iptvSettings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
            document.getElementById('volumeSlider').value = this.settings.volume * 100;
        }
    }

    async loadPlaylist(url) {
        try {
            this.showLoading();
            const response = await fetch(url);
            const m3uContent = await response.text();
            this.parseM3U(m3uContent);
            this.renderCategories();
            this.renderChannels();
        } catch (error) {
            console.error('Failed to load playlist:', error);
            this.showError('Failed to load playlist. Please check the URL.');
        } finally {
            this.hideLoading();
        }
    }

    parseM3U(content) {
        // Basic M3U parser
        const lines = content.split('\n');
        const channels = [];
        let currentChannel = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.startsWith('#EXTINF:')) {
                // Parse channel info
                const info = line.substring(8);
                const nameMatch = info.match(/,(.+)$/);
                const groupMatch = info.match(/group-title="([^"]+)"/);
                const logoMatch = info.match(/tvg-logo="([^"]+)"/);
                
                currentChannel = {
                    id: channels.length + 1,
                    name: nameMatch ? nameMatch[1] : `Channel ${channels.length + 1}`,
                    category: groupMatch ? groupMatch[1] : 'General',
                    logo: logoMatch ? logoMatch[1] : `https://via.placeholder.com/50x50/4F46E5/white?text=${channels.length + 1}`
                };
            } else if (line && !line.startsWith('#') && currentChannel) {
                // This should be the stream URL
                currentChannel.url = line;
                channels.push(currentChannel);
                currentChannel = null;
            }
        }

        this.channels = channels;
        this.categories = [...new Set(this.channels.map(ch => ch.category))];
    }

    handleKeyboard(e) {
        switch (e.key) {
            case ' ':
                if (this.currentChannel) {
                    e.preventDefault();
                    if (this.videoPlayer.paused) {
                        this.videoPlayer.play();
                    } else {
                        this.videoPlayer.pause();
                    }
                }
                break;
            case 'f':
            case 'F':
                if (this.currentChannel) {
                    this.toggleFullscreen();
                }
                break;
            case 'Escape':
                if (document.getElementById('settingsModal').style.display === 'flex') {
                    this.hideSettingsModal();
                }
                break;
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new IPTVApp();
});
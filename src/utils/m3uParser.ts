import { Channel } from '../components/channel/ChannelList'

export interface ParsedPlaylist {
  channels: Channel[]
  totalChannels: number
  groups: string[]
  errors: string[]
}

export interface M3UEntry {
  duration: number
  title: string
  url: string
  attributes: Record<string, string>
}

/**
 * Parse M3U playlist content into structured channel data
 */
export function parseM3U(content: string): ParsedPlaylist {
  const lines = content.split('\n').map(line => line.trim()).filter(line => line)
  const channels: Channel[] = []
  const errors: string[] = []
  const groups = new Set<string>()
  
  let currentEntry: Partial<M3UEntry> = {}
  let channelNumber = 1

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Skip comments and empty lines
    if (line.startsWith('#') && !line.startsWith('#EXTINF')) {
      continue
    }

    // Parse EXTINF line
    if (line.startsWith('#EXTINF')) {
      try {
        const parsed = parseEXTINF(line)
        currentEntry = parsed
      } catch (error) {
        errors.push(`Line ${i + 1}: Invalid EXTINF format - ${error}`)
        continue
      }
    }
    // Parse URL line
    else if (line.startsWith('http') || line.startsWith('rtmp') || line.startsWith('rtsp')) {
      if (currentEntry.title) {
        const channel = createChannelFromEntry(currentEntry, line, channelNumber++)
        channels.push(channel)
        
        if (channel.group) {
          groups.add(channel.group)
        }
        
        currentEntry = {}
      } else {
        errors.push(`Line ${i + 1}: URL without EXTINF information`)
      }
    }
  }

  return {
    channels,
    totalChannels: channels.length,
    groups: Array.from(groups),
    errors
  }
}

/**
 * Parse EXTINF line to extract metadata
 */
function parseEXTINF(line: string): M3UEntry {
  // Format: #EXTINF:duration,title
  // or: #EXTINF:duration tvg-id="id" tvg-name="name" tvg-logo="logo" group-title="group",title
  
  const match = line.match(/^#EXTINF:(-?\d+(?:\.\d+)?)\s*(.*)$/)
  if (!match) {
    throw new Error('Invalid EXTINF format')
  }

  const duration = parseFloat(match[1])
  const rest = match[2]
  
  // Extract attributes
  const attributes: Record<string, string> = {}
  let title = rest
  
  // Parse attributes like tvg-id="value" tvg-name="value" etc.
  const attributeRegex = /(\w+(?:-\w+)*)=["']([^"']*?)["']/g
  let attributeMatch
  
  while ((attributeMatch = attributeRegex.exec(rest)) !== null) {
    attributes[attributeMatch[1]] = attributeMatch[2]
  }
  
  // Extract title (everything after the last comma)
  const lastCommaIndex = rest.lastIndexOf(',')
  if (lastCommaIndex !== -1) {
    title = rest.substring(lastCommaIndex + 1).trim()
  }
  
  return {
    duration,
    title,
    url: '', // Will be set later
    attributes
  }
}

/**
 * Create Channel object from M3U entry
 */
function createChannelFromEntry(entry: Partial<M3UEntry>, url: string, channelNumber: number): Channel {
  const attributes = entry.attributes || {}
  
  return {
    id: generateChannelId(entry.title || '', url),
    name: entry.title || `Channel ${channelNumber}`,
    url: url.trim(),
    logo: attributes['tvg-logo'] || attributes['logo'],
    group: attributes['group-title'] || attributes['group'],
    number: parseInt(attributes['tvg-chno'] || attributes['channel-number']) || channelNumber,
    description: attributes['tvg-name'] || attributes['description'],
    isFavorite: false,
    isOnline: true // Will be determined by stream validation
  }
}

/**
 * Generate unique channel ID
 */
function generateChannelId(title: string, url: string): string {
  const combined = `${title}-${url}`
  return btoa(combined).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16)
}

/**
 * Validate M3U content
 */
export function validateM3U(content: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!content || content.trim().length === 0) {
    errors.push('Content is empty')
    return { isValid: false, errors }
  }
  
  // Check for M3U header
  if (!content.includes('#EXTINF')) {
    errors.push('No #EXTINF entries found - this may not be a valid M3U file')
  }
  
  // Check for URLs
  const urlRegex = /^(https?|rtmp|rtsp):\/\//m
  if (!urlRegex.test(content)) {
    errors.push('No valid streaming URLs found')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Parse M3U from URL
 */
export async function parseM3UFromUrl(url: string): Promise<ParsedPlaylist> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const content = await response.text()
    return parseM3U(content)
  } catch (error) {
    return {
      channels: [],
      totalChannels: 0,
      groups: [],
      errors: [`Failed to fetch playlist: ${error}`]
    }
  }
}

/**
 * Parse M3U from file
 */
export function parseM3UFromFile(file: File): Promise<ParsedPlaylist> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    
    reader.onload = (event) => {
      const content = event.target?.result as string
      resolve(parseM3U(content))
    }
    
    reader.onerror = () => {
      resolve({
        channels: [],
        totalChannels: 0,
        groups: [],
        errors: ['Failed to read file']
      })
    }
    
    reader.readAsText(file)
  })
}

/**
 * Export channels back to M3U format
 */
export function exportToM3U(channels: Channel[]): string {
  let m3u = '#EXTM3U\n\n'
  
  channels.forEach(channel => {
    const attributes = []
    
    if (channel.logo) {
      attributes.push(`tvg-logo="${channel.logo}"`)
    }
    
    if (channel.group) {
      attributes.push(`group-title="${channel.group}"`)
    }
    
    if (channel.number) {
      attributes.push(`tvg-chno="${channel.number}"`)
    }
    
    if (channel.description) {
      attributes.push(`tvg-name="${channel.description}"`)
    }
    
    const attributeString = attributes.length > 0 ? ` ${attributes.join(' ')}` : ''
    
    m3u += `#EXTINF:-1${attributeString},${channel.name}\n`
    m3u += `${channel.url}\n\n`
  })
  
  return m3u
}

/**
 * Validate stream URL
 */
export async function validateStreamUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Batch validate stream URLs
 */
export async function validateChannels(channels: Channel[]): Promise<Channel[]> {
  const validationPromises = channels.map(async (channel) => {
    const isOnline = await validateStreamUrl(channel.url)
    return { ...channel, isOnline }
  })
  
  return Promise.all(validationPromises)
}
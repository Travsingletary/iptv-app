import { describe, it, expect } from 'vitest'
import { mockChannels, mockPrograms } from '../mockData'

describe('Mock Data', () => {
  describe('mockChannels', () => {
    it('should have valid channel structure', () => {
      expect(mockChannels).toBeInstanceOf(Array)
      expect(mockChannels.length).toBeGreaterThan(0)
      
      mockChannels.forEach(channel => {
        expect(channel).toHaveProperty('id')
        expect(channel).toHaveProperty('number')
        expect(channel).toHaveProperty('name')
        expect(channel).toHaveProperty('isActive')
        expect(typeof channel.id).toBe('string')
        expect(typeof channel.number).toBe('string')
        expect(typeof channel.name).toBe('string')
        expect(typeof channel.isActive).toBe('boolean')
      })
    })

    it('should have at least one active channel', () => {
      const activeChannels = mockChannels.filter(channel => channel.isActive)
      expect(activeChannels.length).toBeGreaterThan(0)
    })

    it('should have unique channel IDs', () => {
      const ids = mockChannels.map(channel => channel.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('should have unique channel numbers', () => {
      const numbers = mockChannels.map(channel => channel.number)
      const uniqueNumbers = new Set(numbers)
      expect(uniqueNumbers.size).toBe(numbers.length)
    })
  })

  describe('mockPrograms', () => {
    it('should have valid program structure', () => {
      expect(mockPrograms).toBeInstanceOf(Array)
      expect(mockPrograms.length).toBeGreaterThan(0)
      
      mockPrograms.forEach(program => {
        expect(program).toHaveProperty('id')
        expect(program).toHaveProperty('channelId')
        expect(program).toHaveProperty('title')
        expect(program).toHaveProperty('description')
        expect(program).toHaveProperty('startTime')
        expect(program).toHaveProperty('endTime')
        expect(program).toHaveProperty('category')
        expect(program).toHaveProperty('isLive')
        
        expect(typeof program.id).toBe('string')
        expect(typeof program.channelId).toBe('string')
        expect(typeof program.title).toBe('string')
        expect(typeof program.description).toBe('string')
        expect(program.startTime).toBeInstanceOf(Date)
        expect(program.endTime).toBeInstanceOf(Date)
        expect(typeof program.category).toBe('string')
        expect(typeof program.isLive).toBe('boolean')
      })
    })

    it('should have programs with valid time ranges', () => {
      mockPrograms.forEach(program => {
        expect(program.endTime.getTime()).toBeGreaterThan(program.startTime.getTime())
      })
    })

    it('should have at least one live program', () => {
      const livePrograms = mockPrograms.filter(program => program.isLive)
      expect(livePrograms.length).toBeGreaterThan(0)
    })

    it('should have programs that reference existing channels', () => {
      const channelIds = new Set(mockChannels.map(channel => channel.id))
      
      mockPrograms.forEach(program => {
        expect(channelIds.has(program.channelId)).toBe(true)
      })
    })

    it('should have unique program IDs', () => {
      const ids = mockPrograms.map(program => program.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })
  })

  describe('Data Consistency', () => {
    it('should have programs for active channels', () => {
      const activeChannels = mockChannels.filter(channel => channel.isActive)
      const programChannelIds = new Set(mockPrograms.map(program => program.channelId))
      
      const activeChannelsWithPrograms = activeChannels.filter(channel => 
        programChannelIds.has(channel.id)
      )
      
      expect(activeChannelsWithPrograms.length).toBeGreaterThan(0)
    })
  })
})
/**
 * Watchlist API Module
 * 
 * Handles:
 * - Get user's watchlist items
 * - Add/remove items
 * - Each item includes alertCount
 */
import { api, apiCall } from './client';

/**
 * Get user's watchlist items with alert counts
 * @param {string} [type] - Filter by type: 'token' | 'wallet' | 'actor'
 */
export async function getWatchlist(type) {
  return apiCall(
    api.get('/api/watchlist', {
      params: type ? { type } : {},
    })
  );
}

/**
 * Add item to watchlist
 * @param {Object} item - Item to add
 * @param {string} item.type - 'token' | 'wallet' | 'actor' | 'entity'
 * @param {Object} item.target - Target details
 * @param {string} item.target.address - Address
 * @param {string} [item.target.chain] - Chain (default: 'ethereum')
 * @param {string} [item.target.symbol] - Symbol
 * @param {string} [item.target.name] - Name
 * @param {string} [item.note] - User note
 * @param {string[]} [item.tags] - Tags
 */
export async function addToWatchlist(item) {
  return apiCall(
    api.post('/api/watchlist', item)
  );
}

/**
 * Remove item from watchlist
 * @param {string} itemId - Watchlist item ID
 */
export async function removeFromWatchlist(itemId) {
  return apiCall(
    api.delete(`/api/watchlist/${itemId}`)
  );
}

/**
 * Get single watchlist item with alert count
 * @param {string} itemId - Watchlist item ID
 */
export async function getWatchlistItem(itemId) {
  return apiCall(
    api.get(`/api/watchlist/${itemId}`)
  );
}

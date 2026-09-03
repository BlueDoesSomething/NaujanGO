/**
 * Admin Dashboard POI/Attractions Management Helper
 * 
 * This file provides handlers for managing attractions/POI in the admin dashboard
 * including delete and restore functionality. Integrate these into your AdminDashboard.jsx
 */

import api from '../api';

/**
 * Delete attraction handler
 * Usage: await handleDeleteAttraction(attractionId, false)
 */
export const createDeleteAttractionHandler = (
  setAttractionActionLoading,
  setAttractions,
  attractions,
  onSuccess = () => {}
) => {
  return async (attractionId, hardDelete = false) => {
    if (!window.confirm(hardDelete 
      ? 'This will permanently delete the attraction. This action cannot be undone. Continue?' 
      : 'Archive this attraction? Users will no longer see it on the map.')) {
      return;
    }

    setAttractionActionLoading(prev => ({ ...prev, [attractionId]: true }));
    try {
      await api.delete(`/attractions/${attractionId}`, { data: { hardDelete } });
      
      if (hardDelete) {
        setAttractions(attractions.filter(a => a.id !== attractionId));
      } else {
        setAttractions(attractions.map(a => 
          a.id === attractionId ? { ...a, archived: 1, archived_at: new Date().toISOString() } : a
        ));
      }
      
      if (onSuccess) onSuccess(attractionId, hardDelete);
    } catch (error) {
      console.error('Error deleting attraction:', error);
      alert('Failed to delete attraction: ' + (error.response?.data?.message || error.message));
    } finally {
      setAttractionActionLoading(prev => ({ ...prev, [attractionId]: false }));
    }
  };
};

/**
 * Restore archived attraction handler
 */
export const createRestoreAttractionHandler = (
  setAttractionActionLoading,
  setAttractions,
  attractions,
  onSuccess = () => {}
) => {
  return async (attractionId) => {
    if (!window.confirm('Restore this attraction? It will be visible on the map again.')) {
      return;
    }

    setAttractionActionLoading(prev => ({ ...prev, [attractionId]: true }));
    try {
      await api.post(`/attractions/${attractionId}/restore`);
      
      setAttractions(attractions.map(a => 
        a.id === attractionId ? { ...a, archived: 0, archived_at: null } : a
      ));
      
      if (onSuccess) onSuccess(attractionId);
    } catch (error) {
      console.error('Error restoring attraction:', error);
      alert('Failed to restore attraction: ' + (error.response?.data?.message || error.message));
    } finally {
      setAttractionActionLoading(prev => ({ ...prev, [attractionId]: false }));
    }
  };
};

/**
 * UI Component for Attraction Delete/Restore Buttons
 * 
 * Usage in your attractions list render:
 * <AttractionActionButtons 
 *   attraction={attraction}
 *   isLoading={attractionActionLoading[attraction.id]}
 *   onDelete={handleDeleteAttraction}
 *   onRestore={handleRestoreAttraction}
 * />
 */
export const AttractionActionButtons = ({
  attraction,
  isLoading,
  onDelete,
  onRestore
}) => {
  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      {attraction.archived ? (
        <button
          onClick={() => onRestore(attraction.id)}
          disabled={isLoading}
          style={{
            padding: '6px 12px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1,
            fontSize: '12px'
          }}
        >
          {isLoading ? 'Restoring...' : 'Restore'}
        </button>
      ) : (
        <>
          <button
            onClick={() => onDelete(attraction.id, false)}
            disabled={isLoading}
            style={{
              padding: '6px 12px',
              background: '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
              fontSize: '12px'
            }}
          >
            {isLoading ? 'Archiving...' : 'Archive'}
          </button>
          <button
            onClick={() => onDelete(attraction.id, true)}
            disabled={isLoading}
            style={{
              padding: '6px 12px',
              background: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
              fontSize: '12px'
            }}
            title="Permanently delete (cannot be undone)"
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </button>
        </>
      )}
    </div>
  );
};

/**
 * Integration Instructions for AdminDashboard.jsx:
 * 
 * 1. Import in your AdminDashboard.jsx:
 *    import { 
 *      createDeleteAttractionHandler, 
 *      createRestoreAttractionHandler,
 *      AttractionActionButtons 
 *    } from './AdminDashboardAttractionHelpers';
 * 
 * 2. Add near other state initialization:
 *    const handleDeleteAttraction = createDeleteAttractionHandler(
 *      setAttractionActionLoading,
 *      setAttractions,
 *      attractions,
 *      () => alert('Attraction deleted/archived')
 *    );
 * 
 *    const handleRestoreAttraction = createRestoreAttractionHandler(
 *      setAttractionActionLoading,
 *      setAttractions,
 *      attractions,
 *      () => alert('Attraction restored')
 *    );
 * 
 * 3. In your attractions list rendering, add the buttons:
 *    <AttractionActionButtons 
 *      attraction={attraction}
 *      isLoading={attractionActionLoading[attraction.id]}
 *      onDelete={handleDeleteAttraction}
 *      onRestore={handleRestoreAttraction}
 *    />
 */

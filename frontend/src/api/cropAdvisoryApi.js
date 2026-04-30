import apiClient from './client';

// Get all locations
export const getLocations = async () => {
  const response = await apiClient.get('/crop-advisory/locations');
  return response.data.data.locations;
};

// Get all seasons
export const getSeasons = async () => {
  const response = await apiClient.get('/crop-advisory/seasons');
  return response.data.data.seasons;
};

// Get all soil types
export const getSoilTypes = async () => {
  const response = await apiClient.get('/crop-advisory/soil-types');
  return response.data.data.soilTypes;
};

// Get crop recommendations
export const getRecommendations = async (location, season, soil) => {
  const params = { location, season };
  if (soil && soil !== 'Any') {
    params.soil = soil;
  }
  const response = await apiClient.get('/crop-advisory/recommendations', { params });
  return response.data.data.crops;
};

// Admin/Expert functions
export const getAllCrops = async () => {
  const response = await apiClient.get('/crop-advisory/crops');
  return response.data.data.crops;
};

export const createCrop = async (cropData) => {
  const response = await apiClient.post('/crop-advisory/crops', cropData);
  return response.data.data.crop;
};

export const updateCrop = async (id, cropData) => {
  const response = await apiClient.patch(`/crop-advisory/crops/${id}`, cropData);
  return response.data.data.crop;
};

export const deleteCrop = async (id) => {
  await apiClient.delete(`/crop-advisory/crops/${id}`);
};
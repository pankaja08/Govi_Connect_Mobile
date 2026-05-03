import apiClient from './client';

// ---------------------------------------------------------------------------
// Master data
// ---------------------------------------------------------------------------

export const getLocations = async () => {
  const response = await apiClient.get('/crop-advisory/locations');
  return response.data.data.locations;
};

export const getSeasons = async () => {
  const response = await apiClient.get('/crop-advisory/seasons');
  return response.data.data.seasons;
};

export const getSoilTypes = async () => {
  const response = await apiClient.get('/crop-advisory/soil-types');
  return response.data.data.soilTypes;
};

// ---------------------------------------------------------------------------
// Recommendations (farmer side)
// ---------------------------------------------------------------------------

export const getRecommendations = async (location, season, soil) => {
  const params = { location, season };
  if (soil && soil !== 'Any') {
    params.soil = soil;
  }
  const response = await apiClient.get('/crop-advisory/recommendations', { params });
  return response.data.data.crops;
};

// ---------------------------------------------------------------------------
// Expert / Admin crop CRUD
// ---------------------------------------------------------------------------

export const getAllCrops = async () => {
  const response = await apiClient.get('/crop-advisory/crops');
  return response.data.data.crops;
};

/**
 * createCrop – expects a FormData object built by ExpertCropProfileScreen.
 * Axios will set the correct multipart/form-data content-type automatically
 * when you pass a FormData instance.
 */
export const createCrop = async (cropData) => {
  const response = await apiClient.post('/crop-advisory/crops', cropData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data.crop;
};

/**
 * updateCrop – same as createCrop but PATCH to /crops/:id
 */
export const updateCrop = async (id, cropData) => {
  const response = await apiClient.patch(`/crop-advisory/crops/${id}`, cropData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data.crop;
};

export const deleteCrop = async (id) => {
  await apiClient.delete(`/crop-advisory/crops/${id}`);
};
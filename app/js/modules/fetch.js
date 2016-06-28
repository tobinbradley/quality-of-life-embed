import axios from 'axios';

export function getMeta(endpoint) {
    return axios.get(endpoint);
}

export function getData(endpoint) {
    return axios.get(endpoint);
}

export function getGeoJSON(endpoint) {
    return axios.get(endpoint);
}

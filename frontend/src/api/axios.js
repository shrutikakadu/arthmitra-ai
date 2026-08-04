import axios from "axios";
const hostname = typeof window !== "undefined" && window.location.hostname ? window.location.hostname : "127.0.0.1";
const API = axios.create({ baseURL: `http://${hostname}:8000/api` });
export default API;
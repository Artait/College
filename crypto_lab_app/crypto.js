// crypto.js — AES-GCM 256 + PBKDF2 helpers using Web Crypto API
const MASTER_PASSPHRASE = "DC-LAB-MASTER-KEY-CRYPTO-V1";
const enc = new TextEncoder();
const dec = new TextDecoder();
function toB64(arr){ return btoa(String.fromCharCode(...new Uint8Array(arr))); }
function fromB64(b64){ return Uint8Array.from(atob(b64), c => c.charCodeAt(0)); }
async function sha256Hex(str){
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(str));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");
}
async function deriveKey(passphrase, saltBytes){
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey(
    { name:"PBKDF2", salt:saltBytes, iterations:250000, hash:"SHA-256" },
    keyMaterial,
    { name:"AES-GCM", length:256 },
    false,
    ["encrypt","decrypt"]
  );
  return key;
}
async function encryptJson(data){
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const key  = await deriveKey(MASTER_PASSPHRASE, salt);
  const payload = enc.encode(JSON.stringify(data));
  const ctBuf = await crypto.subtle.encrypt({name:"AES-GCM", iv}, key, payload);
  return { ct: toB64(ctBuf), iv: toB64(iv), salt: toB64(salt) };
}
async function decryptJson({ct, iv, salt}){
  if(!ct || !iv || !salt) throw new Error("Invalid encrypted payload");
  const key = await deriveKey(MASTER_PASSPHRASE, fromB64(salt));
  const plainBuf = await crypto.subtle.decrypt({name:"AES-GCM", iv: fromB64(iv)}, key, fromB64(ct));
  return JSON.parse(dec.decode(plainBuf));
}
const USERS_KEY = "users.enc.bundle";
async function loadUsers(){
  const raw = localStorage.getItem(USERS_KEY);
  if(!raw) return [];
  try{
    const pack = JSON.parse(raw);
    const arr = await decryptJson(pack);
    if(Array.isArray(arr)) return arr;
    return [];
  }catch(e){ console.error("Decryption failed", e); return []; }
}
async function saveUsers(users){
  const pack = await encryptJson(users);
  localStorage.setItem(USERS_KEY, JSON.stringify(pack));
  return pack;
}
const ADMIN_DB_KEY = "admin.db";
const DEFAULT_ADMIN = { email: "admin@dc-lab.local", password: "Admin#1234" };
async function ensureAdminDb(){
  if(localStorage.getItem(ADMIN_DB_KEY)) return;
  const passHash = await sha256Hex(DEFAULT_ADMIN.password);
  const rec = { email: DEFAULT_ADMIN.email, passHash };
  localStorage.setItem(ADMIN_DB_KEY, JSON.stringify(rec));
}
async function checkAdminLogin(email, password){
  const rec = JSON.parse(localStorage.getItem(ADMIN_DB_KEY) || "{}");
  if(!rec.email || !rec.passHash) return false;
  const ph = await sha256Hex(password);
  return email.trim().toLowerCase() === rec.email.toLowerCase() && ph === rec.passHash;
}
const SESSION_KEY = "session.lab";
function setSession(obj){ localStorage.setItem(SESSION_KEY, JSON.stringify(obj)); }
function getSession(){ try { return JSON.parse(localStorage.getItem(SESSION_KEY)||"{}"); } catch(e){return {}} }
function clearSession(){ localStorage.removeItem(SESSION_KEY); }

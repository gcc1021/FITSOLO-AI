/* FITSOLO 本地存储：档案 / 方案 / 打卡记录（localStorage，无需后端） */
(function (root) {
  'use strict';
  const PREFIX = 'fitsolo_';
  const store = {
    get(key, def) {
      try {
        const v = localStorage.getItem(PREFIX + key);
        return v ? JSON.parse(v) : def;
      } catch (e) { return def; }
    },
    set(key, val) {
      try { localStorage.setItem(PREFIX + key, JSON.stringify(val)); } catch (e) {}
    },
    remove(key) {
      try { localStorage.removeItem(PREFIX + key); } catch (e) {}
    },
    profile() { return store.get('profile', null); },
    plan() { return store.get('plan', null); },
    checkins() { return store.get('checkins', []); }
  };
  root.FITSOLO_STORE = store;
})(typeof window !== 'undefined' ? window : globalThis);

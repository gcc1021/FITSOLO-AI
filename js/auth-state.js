/* FITSOLO 身份状态：服务端验证账号，本地仅保存会话凭证与展示信息。 */
(function (root) {
  'use strict';

  var STORAGE_KEY = 'fitsolo_auth_identity_v1';

  function getIdentity() {
    try {
      var value = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!value || (value.role !== 'member' && value.role !== 'guest')) return null;
      if (value.role === 'member' && !value.token) return null;
      return value;
    } catch (error) {
      return null;
    }
  }

  function saveIdentity(identity) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
      return true;
    } catch (error) {
      return false;
    }
  }

  async function authenticate(phone, password) {
    var response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone, password: password })
    });
    var data = await response.json().catch(function () { return {}; });
    if (!response.ok) throw new Error(data.message || '登录失败，请稍后重试。');
    return Object.assign({}, data.identity, { token: data.token });
  }

  function loginAsGuest() {
    var identity = {
      role: 'guest',
      displayName: '游客',
      loggedInAt: new Date().toISOString()
    };
    saveIdentity(identity);
    return identity;
  }

  function clearIdentity() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      // 本地存储不可用时不阻断页面跳转。
    }
  }

  function getAuthHeaders() {
    var identity = getIdentity();
    return identity && identity.role === 'member' && identity.token
      ? { Authorization: 'Bearer ' + identity.token }
      : {};
  }

  root.FITSOLO_AUTH = {
    STORAGE_KEY: STORAGE_KEY,
    getIdentity: getIdentity,
    saveIdentity: saveIdentity,
    authenticate: authenticate,
    loginAsGuest: loginAsGuest,
    clearIdentity: clearIdentity,
    getAuthHeaders: getAuthHeaders
  };
})(typeof window !== 'undefined' ? window : globalThis);

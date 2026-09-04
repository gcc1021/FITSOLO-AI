/* FITSOLO 演示身份与本地登录状态（仅用于前端竞赛演示） */
(function (root) {
  'use strict';

  var STORAGE_KEY = 'fitsolo_auth_identity_v1';
  var DEMO_ACCOUNTS = Object.freeze([
    { phone: '13800138000', password: '123456' },
    { phone: '13800138001', password: '234567' },
    { phone: '13800138002', password: '345678' },
    { phone: '13800138003', password: '456789' },
    { phone: '13800138004', password: '567890' },
    { phone: '13800138005', password: '678901' },
    { phone: '13800138006', password: '789012' },
    { phone: '13800138007', password: '890123' },
    { phone: '13800138008', password: '901234' },
    { phone: '13800138009', password: '012345' }
  ]);

  function getIdentity() {
    try {
      var value = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      return value && (value.role === 'member' || value.role === 'guest') ? value : null;
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

  function authenticate(phone, password) {
    var account = DEMO_ACCOUNTS.find(function (item) {
      return item.phone === phone && item.password === password;
    });
    if (!account) return null;
    return {
      role: 'member',
      phone: account.phone,
      memberId: 'FS-' + account.phone.slice(-4),
      displayName: 'FITSOLO 会员 ' + account.phone.slice(-2),
      loggedInAt: new Date().toISOString()
    };
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

  root.FITSOLO_AUTH = {
    STORAGE_KEY: STORAGE_KEY,
    DEMO_ACCOUNTS: DEMO_ACCOUNTS,
    getIdentity: getIdentity,
    saveIdentity: saveIdentity,
    authenticate: authenticate,
    loginAsGuest: loginAsGuest,
    clearIdentity: clearIdentity
  };
})(typeof window !== 'undefined' ? window : globalThis);

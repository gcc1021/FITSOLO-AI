(function () {
  'use strict';

  var OAUTH_ENDPOINTS = window.FITSOLO_OAUTH_ENDPOINTS || {
    WeChat: '/oauth2/authorize/wechat',
    QQ: '/oauth2/authorize/qq'
  };
  var authState = window.FITSOLO_AUTH;
  var body = document.body;
  var landingScreen = document.getElementById('landingScreen');
  var authScreen = document.getElementById('authScreen');
  var enterButton = document.getElementById('enterButton');
  var backButton = document.getElementById('backButton');
  var brandBackButton = document.getElementById('brandBackButton');
  var form = document.getElementById('authForm');
  var telephone = document.getElementById('telephone');
  var password = document.getElementById('password');
  var agreement = document.getElementById('agreement');
  var submitButton = document.getElementById('submitButton');
  var primaryActionText = document.getElementById('primaryActionText');
  var guestLoginButton = document.getElementById('guestLoginButton');
  var message = document.getElementById('formMessage');

  function focusWithoutJump(input) {
    window.setTimeout(function () {
      input.focus({ preventScroll: true });
    }, 420);
  }

  function enterAuth() {
    authScreen.removeAttribute('inert');
    landingScreen.removeAttribute('aria-hidden');
    enterButton.setAttribute('aria-expanded', 'true');
    body.classList.remove('is-returning');
    body.classList.add('has-entered');
    window.setTimeout(function () {
      landingScreen.setAttribute('aria-hidden', 'true');
      focusWithoutJump(telephone);
    }, 820);
  }

  function returnToLanding() {
    if (!body.classList.contains('has-entered')) return;
    landingScreen.removeAttribute('aria-hidden');
    body.classList.add('is-returning');
    body.classList.remove('has-entered');
    enterButton.setAttribute('aria-expanded', 'false');
    enterButton.focus({ preventScroll: true });
    window.setTimeout(function () {
      authScreen.setAttribute('inert', '');
      body.classList.remove('is-returning');
    }, 850);
  }

  function clearValidation() {
    message.textContent = '';
    message.classList.remove('success');
    [telephone, password].forEach(function (input) {
      input.removeAttribute('aria-invalid');
    });
    agreement.closest('.agreement-row').classList.remove('has-error');
  }

  function showError(target, text) {
    message.textContent = text;
    message.classList.remove('success');
    if (target === agreement) {
      target.closest('.agreement-row').classList.add('has-error');
    } else {
      target.setAttribute('aria-invalid', 'true');
    }
    target.focus({ preventScroll: true });
  }

  function showCredentialError(text) {
    message.textContent = text;
    message.classList.remove('success');
    telephone.setAttribute('aria-invalid', 'true');
    password.setAttribute('aria-invalid', 'true');
    password.focus({ preventScroll: true });
  }

  function isValidPhone(value) {
    return /^1[3-9]\d{9}$/.test(value.trim());
  }

  function finishLogin(identity, targetPage) {
    authState.saveIdentity(identity);
    message.textContent = identity.role === 'member'
      ? '登录成功，正在进入个人中心…'
      : '正在以游客身份进入 FITSOLO…';
    message.classList.add('success');
    submitButton.disabled = true;
    guestLoginButton.disabled = true;
    primaryActionText.textContent = '正在登录…';
    window.setTimeout(function () {
      window.location.href = targetPage;
    }, 520);
  }

  enterButton.addEventListener('click', enterAuth);
  backButton.addEventListener('click', returnToLanding);
  brandBackButton.addEventListener('click', returnToLanding);
  form.addEventListener('input', clearValidation);
  agreement.addEventListener('change', clearValidation);

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    clearValidation();
    if (!agreement.checked) {
      showError(agreement, '请先阅读并同意《用户协议》与《隐私政策》。');
      return;
    }
    if (!isValidPhone(telephone.value)) {
      showError(telephone, '请输入有效的 11 位手机号。');
      return;
    }
    if (!/^\d{6}$/.test(password.value)) {
      showError(password, '请输入 6 位数字密码。');
      return;
    }
    submitButton.disabled = true;
    primaryActionText.textContent = '正在验证…';
    try {
      var identity = await authState.authenticate(telephone.value.trim(), password.value);
      finishLogin(identity, 'profile.html');
    } catch (error) {
      submitButton.disabled = false;
      primaryActionText.textContent = '登录并进入';
      showCredentialError(error.message || '登录失败，请稍后重试。');
    }
  });

  guestLoginButton.addEventListener('click', function () {
    clearValidation();
    finishLogin(authState.loginAsGuest(), 'home.html');
  });

  document.querySelectorAll('.social-button').forEach(function (button) {
    button.addEventListener('click', function () {
      clearValidation();
      if (!agreement.checked) {
        showError(agreement, '使用快捷登录前，请先同意《用户协议》与《隐私政策》。');
        return;
      }
      var provider = button.dataset.provider;
      var endpoint = OAUTH_ENDPOINTS[provider] || button.dataset.oauthPath;
      var callbackUrl = new URL('oauth-callback.html', window.location.href).href;
      window.location.assign(endpoint + '?redirect_uri=' + encodeURIComponent(callbackUrl));
    });
  });
})();

(function () {
  'use strict';

  var OAUTH_ENDPOINTS = window.FITSOLO_OAUTH_ENDPOINTS || {
    WeChat: '/oauth2/authorize/wechat',
    QQ: '/oauth2/authorize/qq'
  };

  var body = document.body;
  var landingScreen = document.getElementById('landingScreen');
  var authScreen = document.getElementById('authScreen');
  var enterButton = document.getElementById('enterButton');
  var backButton = document.getElementById('backButton');
  var brandBackButton = document.getElementById('brandBackButton');
  var form = document.getElementById('authForm');
  var modeSwitch = document.getElementById('modeSwitch');
  var codePanel = document.getElementById('codeLoginPanel');
  var passwordPanel = document.getElementById('passwordLoginPanel');
  var codeTelephone = document.getElementById('codeTelephone');
  var verificationCode = document.getElementById('verificationCode');
  var getCodeButton = document.getElementById('getCodeButton');
  var account = document.getElementById('account');
  var password = document.getElementById('password');
  var agreement = document.getElementById('agreement');
  var submitButton = document.getElementById('submitButton');
  var primaryActionText = document.getElementById('primaryActionText');
  var guestLoginButton = document.getElementById('guestLoginButton');
  var message = document.getElementById('formMessage');
  var mode = 'code';
  var countdownTimer = null;

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
      focusWithoutJump(mode === 'code' ? codeTelephone : account);
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
    [codeTelephone, verificationCode, account, password].forEach(function (input) {
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
    target.focus();
  }

  function isValidPhone(value) {
    return /^1[3-9]\d{9}$/.test(value.trim());
  }

  function setMode(nextMode) {
    if (mode === nextMode) return;
    mode = nextMode;
    var passwordMode = mode === 'password';

    body.classList.toggle('password-mode', passwordMode);
    codePanel.classList.toggle('is-active', !passwordMode);
    passwordPanel.classList.toggle('is-active', passwordMode);
    codePanel.toggleAttribute('inert', passwordMode);
    passwordPanel.toggleAttribute('inert', !passwordMode);
    codePanel.setAttribute('aria-hidden', String(passwordMode));
    passwordPanel.setAttribute('aria-hidden', String(!passwordMode));
    modeSwitch.setAttribute('aria-pressed', String(passwordMode));

    document.getElementById('loginModeTitle').textContent = passwordMode ? '账号密码登录' : '手机号验证码登录';
    document.getElementById('loginModeDescription').textContent = passwordMode
      ? '使用手机号或 FITSOLO 账号与密码登录。'
      : '无需记住密码，验证手机号即可安全登录。';
    document.getElementById('switchPrompt').textContent = passwordMode ? '忘记密码也没关系' : '也可以使用密码登录';
    modeSwitch.textContent = passwordMode ? '手机号验证码登录' : '账号密码登录';

    clearValidation();
    focusWithoutJump(passwordMode ? account : codeTelephone);
  }

  function startCountdown() {
    var seconds = 60;
    getCodeButton.disabled = true;
    getCodeButton.textContent = seconds + 's 后重试';

    countdownTimer = window.setInterval(function () {
      seconds -= 1;
      getCodeButton.textContent = seconds + 's 后重试';

      if (seconds <= 0) {
        window.clearInterval(countdownTimer);
        countdownTimer = null;
        getCodeButton.disabled = false;
        getCodeButton.textContent = '重新获取';
      }
    }, 1000);
  }

  function finishLogin(authMode) {
    message.textContent = '验证通过，正在进入 FITSOLO…';
    message.classList.add('success');
    submitButton.disabled = true;
    primaryActionText.textContent = '正在登录…';

    try {
      sessionStorage.setItem('fitsoloAuthMode', authMode);
    } catch (error) {
      // Browser storage is optional; never persist passwords or verification codes.
    }

    window.setTimeout(function () {
      window.location.href = 'home.html';
    }, 650);
  }

  enterButton.addEventListener('click', enterAuth);
  backButton.addEventListener('click', returnToLanding);
  brandBackButton.addEventListener('click', returnToLanding);

  modeSwitch.addEventListener('click', function () {
    setMode(mode === 'code' ? 'password' : 'code');
  });

  form.addEventListener('input', clearValidation);
  agreement.addEventListener('change', clearValidation);

  getCodeButton.addEventListener('click', function () {
    clearValidation();
    if (!isValidPhone(codeTelephone.value)) {
      showError(codeTelephone, '请输入有效的 11 位手机号。');
      return;
    }

    // 接入短信服务时，在这里调用 POST /api/auth/sms-code。
    startCountdown();
    message.textContent = '验证码已发送，请注意查收。演示环境可输入任意 6 位数字。';
    message.classList.add('success');
    verificationCode.focus();
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    clearValidation();

    if (!agreement.checked) {
      showError(agreement, '请先阅读并同意《用户协议》与《隐私政策》。');
      return;
    }

    if (mode === 'code') {
      if (!isValidPhone(codeTelephone.value)) {
        showError(codeTelephone, '请输入有效的 11 位手机号。');
        return;
      }
      if (!/^\d{6}$/.test(verificationCode.value.trim())) {
        showError(verificationCode, '请输入 6 位数字验证码。');
        return;
      }
      finishLogin('sms-code');
      return;
    }

    if (!account.value.trim()) {
      showError(account, '请输入手机号或账号。');
      return;
    }
    if (password.value.length < 8) {
      showError(password, '密码至少需要 8 个字符。');
      return;
    }
    finishLogin('password');
  });

  guestLoginButton.addEventListener('click', function () {
    // 游客访问不校验表单，也不请求接口，直接进入网站首页。
    try {
      sessionStorage.setItem('fitsoloAuthMode', 'guest');
    } catch (error) {
      // 浏览器禁用存储时仍允许游客进入。
    }
    window.location.assign('home.html');
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
      var callbackUrl = window.location.origin + '/oauth-callback.html';
      window.location.assign(endpoint + '?redirect_uri=' + encodeURIComponent(callbackUrl));
    });
  });

  window.addEventListener('pagehide', function () {
    if (countdownTimer) window.clearInterval(countdownTimer);
  });
})();

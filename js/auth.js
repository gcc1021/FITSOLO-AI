(function () {
  'use strict';

  var body = document.body;
  var enterButton = document.getElementById('enterButton');
  var landingScreen = document.getElementById('landingScreen');
  var signupScreen = document.getElementById('signupScreen');
  var form = document.getElementById('authForm');
  var modeSwitch = document.getElementById('modeSwitch');
  var submitButton = document.getElementById('submitButton');
  var primaryActionText = document.getElementById('primaryActionText');
  var message = document.getElementById('formMessage');
  var telephone = document.getElementById('telephone');
  var password = document.getElementById('password');
  var fullName = document.getElementById('fullName');
  var confirmPassword = document.getElementById('confirmPassword');
  var isLogin = false;

  function enterSite() {
    signupScreen.removeAttribute('inert');
    enterButton.setAttribute('aria-expanded', 'true');
    body.classList.add('has-entered');
    window.setTimeout(function () {
      landingScreen.setAttribute('aria-hidden', 'true');
      fullName.focus({ preventScroll: true });
    }, 850);
  }

  function setMode(loginMode) {
    isLogin = loginMode;
    body.classList.toggle('login-mode', isLogin);
    document.getElementById('formEyebrow').textContent = isLogin ? 'WELCOME BACK' : 'START YOUR JOURNEY';
    document.getElementById('formTitle').innerHTML = isLogin ? 'Log in to<br>FITSOLO.' : 'Create your<br>account.';
    document.getElementById('formIntro').textContent = isLogin
      ? 'Your plan, progress and next workout are waiting for you.'
      : 'A stronger routine starts with a plan built around you.';
    document.getElementById('actionDescription').textContent = isLogin
      ? 'Continue where you left off and keep your momentum moving.'
      : 'Join FITSOLO and turn your goals into a routine that lasts.';
    primaryActionText.textContent = isLogin ? 'Log In' : 'Sign Up';
    document.getElementById('switchPrompt').textContent = isLogin ? 'New to FITSOLO?' : 'Already have an account?';
    modeSwitch.textContent = isLogin ? 'Sign up' : 'Log in';

    fullName.required = !isLogin;
    confirmPassword.required = !isLogin;
    password.autocomplete = isLogin ? 'current-password' : 'new-password';
    document.querySelectorAll('.social-label').forEach(function (label) {
      var provider = label.closest('.social-button').dataset.provider;
      label.textContent = (isLogin ? 'Log In' : 'Sign Up') + ' with ' + provider;
    });

    form.reset();
    clearValidation();
    telephone.focus();
  }

  function clearValidation() {
    message.textContent = '';
    message.classList.remove('success');
    [fullName, telephone, password, confirmPassword].forEach(function (input) {
      input.removeAttribute('aria-invalid');
    });
  }

  function showError(input, text) {
    input.setAttribute('aria-invalid', 'true');
    message.textContent = text;
    input.focus();
  }

  enterButton.addEventListener('click', enterSite);

  modeSwitch.addEventListener('click', function () {
    setMode(!isLogin);
  });

  form.addEventListener('input', clearValidation);

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    clearValidation();

    if (!isLogin && !fullName.value.trim()) {
      showError(fullName, 'Please enter your full name.');
      return;
    }
    if (!telephone.value.trim()) {
      showError(telephone, 'Please enter your telephone number.');
      return;
    }
    if (password.value.length < 8) {
      showError(password, 'Password must contain at least 8 characters.');
      return;
    }
    if (!isLogin && password.value !== confirmPassword.value) {
      showError(confirmPassword, 'The passwords do not match.');
      return;
    }

    message.textContent = isLogin
      ? 'Welcome back. Taking you to FITSOLO…'
      : 'Account details look good. Taking you to FITSOLO…';
    message.classList.add('success');

    submitButton.disabled = true;
    primaryActionText.textContent = isLogin ? 'Logging In…' : 'Creating Account…';

    try {
      sessionStorage.setItem('fitsoloAuthMode', isLogin ? 'login' : 'signup');
      sessionStorage.setItem('fitsoloDisplayName', fullName.value.trim());
    } catch (error) {
      // The page can continue even when browser storage is unavailable.
    }

    window.setTimeout(function () {
      window.location.href = 'home.html';
    }, 700);
  });

  document.querySelectorAll('.social-button').forEach(function (button) {
    button.addEventListener('click', function () {
      clearValidation();
      message.textContent = button.dataset.provider + ' authentication is ready to be connected.';
      message.classList.add('success');
    });
  });
})();

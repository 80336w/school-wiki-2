'use strict';

// ==== 通用页面交互 ====
const menuBtn = document.querySelector('.menu-btn');
const mainNav = document.querySelector('.main-nav');

if (menuBtn && mainNav) {
  menuBtn.addEventListener('click', () => {
    mainNav.classList.toggle('open');
  });
}

const filterButtons = document.querySelectorAll('.filter-btn');
const courseCards = document.querySelectorAll('.course-card');

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;

    filterButtons.forEach(btn => btn.classList.toggle('active', btn === button));

    courseCards.forEach(card => {
      const category = card.dataset.category;
      const show = filter === 'all' || category === filter;
      card.style.display = show ? 'block' : 'none';
    });
  });
});

// ==== 用户系统（邮箱 + GitHub 登录） ====
const STORAGE_KEY = 'campus_user_list';
const CURRENT_USER_KEY = 'campus_current_user';

const authTrigger = document.getElementById('authTrigger');
const userBadge = document.getElementById('userBadge');
const miniAvatar = document.getElementById('miniAvatar');
const miniName = document.getElementById('miniName');
const authModal = document.getElementById('authModal');
const closeModal = document.getElementById('closeModal');
const authTabs = document.querySelectorAll('.auth-tab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const githubLoginBtn = document.getElementById('githubLoginBtn');

const profileEditor = document.getElementById('profileEditor');
const editProfileBtn = document.getElementById('editProfileBtn');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const cancelProfileBtn = document.getElementById('cancelProfileBtn');
const avatarInput = document.getElementById('avatarInput');
const nameInput = document.getElementById('nameInput');
const introInput = document.getElementById('introInput');

const profileNameLarge = document.getElementById('profileNameLarge');
const profileIntroLarge = document.getElementById('profileIntroLarge');
const profileAvatarLarge = document.getElementById('profileAvatarLarge');

function getUsers() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function setUsers(users) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function getCurrentUser() {
  const raw = localStorage.getItem(CURRENT_USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

function setCurrentUser(user) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

function clearCurrentUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

function defaultAvatar(name = 'User') {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1d4ed8&color=fff`;
}

function openModal() {
  authModal.classList.remove('hidden');
}

function closeModalFn() {
  authModal.classList.add('hidden');
}

function createUserRecord({ name, email, password, avatar, intro, provider = 'email' }) {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    name,
    email,
    password,
    avatar: avatar || defaultAvatar(name),
    intro: intro || '这个人还没有写介绍。',
    provider
  };
}

function renderUserUI() {
  const user = getCurrentUser();

  if (!user) {
    authTrigger.classList.remove('hidden');
    userBadge.classList.add('hidden');
    profileAvatarLarge.src = defaultAvatar('User');
    profileNameLarge.textContent = '校园用户';
    profileIntroLarge.textContent = '这个人还没有写介绍。';
    return;
  }

  authTrigger.classList.add('hidden');
  userBadge.classList.remove('hidden');

  const avatarSrc = user.avatar || defaultAvatar(user.name || 'User');
  miniAvatar.src = avatarSrc;
  miniName.textContent = user.name || '校园用户';

  profileAvatarLarge.src = avatarSrc;
  profileNameLarge.textContent = user.name || '校园用户';
  profileIntroLarge.textContent = user.intro || '这个人还没有写介绍。';

  nameInput.value = user.name || '';
  introInput.value = user.intro || '';
}

// 处理登录/注册面板切换
authTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    authTabs.forEach(t => t.classList.toggle('active', t === tab));
    const mode = tab.dataset.auth;

    if (mode === 'login') {
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
    } else {
      loginForm.classList.add('hidden');
      registerForm.classList.remove('hidden');
    }
  });
});

authTrigger.addEventListener('click', openModal);
closeModal.addEventListener('click', closeModalFn);

document.addEventListener('click', e => {
  if (e.target === authModal) {
    closeModalFn();
  }
});

// ==== 邮箱注册 ====
registerForm.addEventListener('submit', e => {
  e.preventDefault();

  const name = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;

  if (!name || !email || !password) {
    alert('请完整填写注册信息');
    return;
  }

  if (password.length < 6) {
    alert('密码至少 6 位');
    return;
  }

  const users = getUsers();
  const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());

  if (exists) {
    alert('该邮箱已注册');
    return;
  }

  const newUser = createUserRecord({
    name,
    email,
    password,
    avatar: defaultAvatar(name),
    intro: '这个人还没有写介绍。',
    provider: 'email'
  });

  users.push(newUser);
  setUsers(users);
  setCurrentUser(newUser);

  renderUserUI();
  closeModalFn();
  registerForm.reset();
});

// ==== 邮箱登录 ====
loginForm.addEventListener('submit', e => {
  e.preventDefault();

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

  if (!user) {
    alert('邮箱或密码不正确');
    return;
  }

  setCurrentUser(user);
  renderUserUI();
  closeModalFn();
  loginForm.reset();
});

// ==== GitHub 登录（前端演示版） ====
githubLoginBtn.addEventListener('click', () => {
  const existingUsers = getUsers();
  let githubUser = existingUsers.find(u => u.provider === 'github');

  if (!githubUser) {
    const githubName = prompt('请输入你的 GitHub 用户名', 'schooluser');
    if (!githubName) return;

    githubUser = createUserRecord({
      name: githubName,
      email: `${githubName.toLowerCase()}@github.local`,
      password: 'github-login',
      avatar: `https://github.com/${githubName}.png`,
      intro: 'GitHub 账号登录用户，欢迎来到校园百科。',
      provider: 'github'
    });

    existingUsers.push(githubUser);
    setUsers(existingUsers);
  }

  setCurrentUser(githubUser);
  renderUserUI();
  closeModalFn();
});

// ==== 个人资料编辑 ====
editProfileBtn.addEventListener('click', () => {
  const user = getCurrentUser();
  if (!user) {
    openModal();
    return;
  }

  profileEditor.classList.remove('hidden');
  nameInput.value = user.name || '';
  introInput.value = user.intro || '';
});

cancelProfileBtn.addEventListener('click', () => {
  profileEditor.classList.add('hidden');
});

avatarInput.addEventListener('change', e => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const value = reader.result;
    profileAvatarLarge.src = value;
    miniAvatar.src = value;
  };
  reader.readAsDataURL(file);
});

saveProfileBtn.addEventListener('click', () => {
  const user = getCurrentUser();
  if (!user) {
    alert('请先登录后再修改资料');
    return;
  }

  const newName = nameInput.value.trim() || '校园用户';
  const newIntro = introInput.value.trim() || '这个人还没有写介绍。';
  const avatarValue = profileAvatarLarge.src || defaultAvatar(newName);

  const updatedUser = {
    ...user,
    name: newName,
    intro: newIntro,
    avatar: avatarValue
  };

  const users = getUsers();
  const index = users.findIndex(item => item.email === user.email && item.provider === user.provider);

  if (index >= 0) {
    users[index] = updatedUser;
    setUsers(users);
  }

  setCurrentUser(updatedUser);
  renderUserUI();
  profileEditor.classList.add('hidden');
});

// 初始化
renderUserUI();

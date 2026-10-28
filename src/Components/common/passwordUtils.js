export const passwordRules = [
  { id: "length", label: "At least 8 characters", test: (value) => value.length >= 8 },
  { id: "upper", label: "An uppercase letter (A–Z)", test: (value) => /[A-Z]/.test(value) },
  { id: "lower", label: "A lowercase letter (a–z)", test: (value) => /[a-z]/.test(value) },
  { id: "number", label: "A number (0–9)", test: (value) => /\d/.test(value) },
  { id: "special", label: "A special character (! @ # $ % …)", test: (value) => /[^A-Za-z0-9]/.test(value) },
  {
    id: "username",
    label: "Doesn't contain the username",
    test: (value, username) =>
      value.length > 0 && (!username || username.length < 3 || !value.toLowerCase().includes(username.toLowerCase())),
  },
];

export const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];

export const evaluatePassword = (password = "", username = "") => {
  const results = passwordRules.map((rule) => ({ ...rule, met: rule.test(password, username) }));
  const passed = results.filter((rule) => rule.met).length;
  let score = 0;

  if (password) {
    if (passed <= 2) score = 1;
    else if (passed <= 4) score = 2;
    else if (passed === 5) score = 3;
    else score = password.length >= 12 ? 4 : 3;
  }

  return { results, score, valid: results.every((rule) => rule.met) };
};

const randomIndex = (max) => {
  const values = new Uint32Array(1);
  window.crypto.getRandomValues(values);
  return values[0] % max;
};

export const generateStrongPassword = (length = 16) => {
  const sets = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnopqrstuvwxyz", "23456789", "!@#$%^&*?-_+"];
  const all = sets.join("");
  const characters = sets.map((set) => set[randomIndex(set.length)]);

  while (characters.length < length) {
    characters.push(all[randomIndex(all.length)]);
  }

  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swap = randomIndex(index + 1);
    [characters[index], characters[swap]] = [characters[swap], characters[index]];
  }

  return characters.join("");
};

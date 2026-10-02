// Minimal, dependency-free validator. Every route validates body input
// through here before it touches the models.
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

exports.validate = (schema) => (req, res, next) => {
  const errors = [];
  for (const [field, rules] of Object.entries(schema)) {
    const value = req.body[field];
    const empty = value === undefined || value === null || value === '';
    if (rules.required && empty) { errors.push(`${field} is required`); continue; }
    if (empty) continue;
    if (rules.type === 'email' && !EMAIL_RE.test(value)) errors.push(`${field} must be a valid email`);
    if (rules.type === 'int' && !Number.isInteger(Number(value))) errors.push(`${field} must be an integer`);
    if (rules.min !== undefined && Number(value) < rules.min) errors.push(`${field} must be >= ${rules.min}`);
    if (rules.max !== undefined && Number(value) > rules.max) errors.push(`${field} must be <= ${rules.max}`);
    if (rules.minLength && String(value).length < rules.minLength) errors.push(`${field} must be at least ${rules.minLength} characters`);
    if (rules.maxLength && String(value).length > rules.maxLength) errors.push(`${field} exceeds ${rules.maxLength} characters`);
    if (rules.enum && !rules.enum.includes(value)) errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
  }
  if (errors.length) return res.status(422).json({ message: 'Validation failed', errors });
  next();
};

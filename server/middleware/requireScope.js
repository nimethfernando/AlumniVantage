const requireScope = (requiredScope) => {
  return (req, res, next) => {
    // Assuming your verifyApiKey middleware attaches the key details to req.apiKey
    if (!req.apiKey || !req.apiKey.scope) {
      return res.status(403).json({ error: 'Forbidden: No scope associated with this API Key.' });
    }

    if (req.apiKey.scope !== requiredScope) {
      return res.status(403).json({ 
        error: `Forbidden: Insufficient permissions. Required scope: ${requiredScope}` 
      });
    }

    next();
  };
};

module.exports = requireScope;
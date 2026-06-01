const jwt = require('jsonwebtoken');
const db = require('../services/db'); 
const { generateUsername } = require('../utils/validation');

exports.QueryUserData = async (req, res) => {
  const { code, derivId, token, currency, raw } = req.body;
  const balance = 0.00;
  const email = '';
  const phoneNumber = '';
  const username = generateUsername(code || token);

  try {
    const appIdentifier = String(derivId || process.env.DERIV_ID || '53052');

    let app = await db.app.findUnique({
      where: { deriv_id: appIdentifier }
    });

    if (!app) {
      console.warn(`App with deriv_id=${appIdentifier} not found, creating default app record.`);
      app = await db.app.create({
        data: {
          apiKey: process.env.API_KEY || 'dev_api_key_123',
          platformId: process.env.PLATFORM_ID || process.env.DERIV_ID || appIdentifier,
          deriv_id: appIdentifier,
          name: process.env.APP_NAME || 'TiltTrader Dev',
          origin: process.env.APP_ORIGIN || 'localhost:3000',
          permissions: JSON.stringify(['authorize', 'query-user', 'websocket'])
        }
      });
    }

    let user = await db.user.findFirst({
      where: { userId: code, appId: app.deriv_id }
    });

    if (user) {
      if (raw && user.auth_token !== token) {
        user = await db.user.update({
          where: { id: user.id },
          data: { auth_token: token, token }
        });
      }
      return res.status(200).json({ success: true, message: 'User connected successfully', auth_token: user.auth_token });
    } else {
      const auth_token = raw ? token : jwt.sign({ userId: code, appId: app.deriv_id, token }, process.env.JWT_SECRET);

      user = await db.user.create({
        data: {
          userId: code || `manual_${token.slice(0, 8)}`,
          balance,
          phoneNumber,
          email,
          username,
          appId: app.deriv_id,
          token,
          currency,
          auth_token
        }
      });

      return res.status(201).json({ success: true, message: 'User connected successfully', auth_token });
    }
  } catch (error) {
    console.error('Error connecting user:', error);
    return res.status(200).json({ success: false, message: 'Failed to connect user' });
  }
};

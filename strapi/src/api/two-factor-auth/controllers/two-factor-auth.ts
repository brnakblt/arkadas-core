import { factories } from '@strapi/strapi';
// @ts-ignore
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';

export default factories.createCoreController('api::two-factor-auth.two-factor-auth', ({ strapi }) => ({
  /**
   * Setup 2FA: Generate secret and QR code
   */
  async setup(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('Sisteme giriş yapmalısınız.');
    }

    // 1. Check if already setup (we allow re-setup if not verified?)
    const existing = await strapi.db.query('api::two-factor-auth.two-factor-auth').findOne({
      where: { user: user.id },
    });

    if (existing && existing.isEnabled && existing.isVerified) {
      return ctx.badRequest('2FA zaten etkinleştirilmiş.');
    }

    // 2. Generate Secret
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(user.email, 'ArkadasERP', secret);

    // 3. Generate QR Code
    const qrCode = await QRCode.toDataURL(otpauth);

    // 4. Store in DB
    if (existing) {
      await strapi.db.query('api::two-factor-auth.two-factor-auth').update({
        where: { id: existing.id },
        data: {
          secret,
          isVerified: false,
          isEnabled: false,
        },
      });
    } else {
      await strapi.db.query('api::two-factor-auth.two-factor-auth').create({
        data: {
          user: user.id,
          secret,
          isVerified: false,
          isEnabled: false,
        },
      });
    }

    return ctx.send({
      success: true,
      secret,
      qrCode,
    });
  },

  /**
   * Verify 2FA code and enable if first time
   */
  async verify(ctx) {
    const user = ctx.state.user;
    const { code } = ctx.request.body;

    if (!user) {
      return ctx.unauthorized('Sisteme giriş yapmalısınız.');
    }

    if (!code) {
      return ctx.badRequest('Doğrulama kodu gereklidir.');
    }

    // 1. Find 2FA record
    const record = await strapi.db.query('api::two-factor-auth.two-factor-auth').findOne({
      where: { user: user.id },
    });

    if (!record || !record.secret) {
      return ctx.badRequest('2FA kurulumu yapılmamış.');
    }

    // 2. Validate Code
    const isValid = authenticator.verify({
      token: code,
      secret: record.secret,
    });

    if (!isValid) {
      return ctx.badRequest('Geçersiz doğrulama kodu.');
    }

    // 3. Enable 2FA if valid
    await strapi.db.query('api::two-factor-auth.two-factor-auth').update({
      where: { id: record.id },
      data: {
        isEnabled: true,
        isVerified: true,
        lastUsedAt: new Date(),
      },
    });

    return ctx.send({
      success: true,
      message: '2FA başarıyla doğrulandı ve etkinleştirildi.',
    });
  },

  /**
   * Disable 2FA
   */
  async disable(ctx) {
    const user = ctx.state.user;
    const { code } = ctx.request.body;

    if (!user) {
      return ctx.unauthorized('Sisteme giriş yapmalısınız.');
    }

    const record = await strapi.db.query('api::two-factor-auth.two-factor-auth').findOne({
      where: { user: user.id },
    });

    if (!record || !record.isEnabled) {
      return ctx.badRequest('2FA zaten aktif değil.');
    }

    // Verify code before disabling
    const isValid = authenticator.verify({
      token: code,
      secret: record.secret,
    });

    if (!isValid) {
      return ctx.badRequest('Geçersiz doğrulama kodu.');
    }

    await strapi.db.query('api::two-factor-auth.two-factor-auth').update({
      where: { id: record.id },
      data: {
        isEnabled: false,
        isVerified: false,
        secret: null, // Wipe secret on disable for security
      },
    });

    return ctx.send({
      success: true,
      message: '2FA devre dışı bırakıldı.',
    });
  },
}));

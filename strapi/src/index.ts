/**
 * Bootstrap
 */

import type { Core } from '@strapi/strapi';

export default {
  register(/*{ strapi }*/) {
    // Registration phase
  },

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    console.log('[Bootstrap] Starting seeding process...');
    try {
      const adminEmail = process.env.STRAPI_ADMIN_EMAIL || 'barannakblut@gmail.com';
      const adminPassword = process.env.STRAPI_ADMIN_PASSWORD || 'admin123';

      // 1. Check/Create Admin User (for Strapi Panel)
      const adminUsers = await strapi.db.query('admin::user').findMany();
      console.log(`[Admin Seeder] Current admin count: ${adminUsers ? adminUsers.length : 0}`);
      
      if (!adminUsers || adminUsers.length === 0) {
        const superAdminRole = await strapi.db.query('admin::role').findOne({ where: { code: 'strapi-super-admin' } });
        
        if (superAdminRole) {
          const hashedPassword = await strapi.admin.services.auth.hashPassword(adminPassword);

          await strapi.db.query('admin::user').create({
            data: {
              username: 'admin',
              email: adminEmail,
              password: hashedPassword,
              firstname: 'Admin',
              lastname: 'User',
              isActive: true,
              blocked: false,
              roles: [superAdminRole.id],
            },
          });
          console.log(`[Admin Seeder] Created admin user: ${adminEmail}`);
        }
      }

      // 2. Check/Create End User (for Web Login)
      // Delete existing plain-text user if exists
      const existingUPUser = await strapi.query('plugin::users-permissions.user').findOne({
        where: { email: adminEmail }
      });

      if (existingUPUser) {
        // If password is not hashed (doesn't start with $), delete it to re-seed correctly
        if (!existingUPUser.password.startsWith('$')) {
          await strapi.query('plugin::users-permissions.user').delete({
            where: { id: existingUPUser.id }
          });
          console.log(`[User Seeder] Deleted invalid plain-text user: ${adminEmail}`);
        }
      }

      const hasEndUser = await strapi.query('plugin::users-permissions.user').count({
        where: { email: adminEmail }
      });

      if (hasEndUser === 0) {
        const authenticatedRole = await strapi.query('plugin::users-permissions.role').findOne({
          where: { type: 'authenticated' },
        });

        if (authenticatedRole) {
          // Use the plugin's service to ensure hashing
          // @ts-ignore
          const userPluginService = strapi.plugin('users-permissions').service('user');
          await userPluginService.add({
            username: 'baran',
            email: adminEmail,
            password: adminPassword,
            role: authenticatedRole.id,
            confirmed: true,
            provider: 'local',
          });
          console.log(`[User Seeder] Created professional user with hashed password: ${adminEmail}`);
        }
      }

      // 3. Set Public Permissions
      const publicRole = await strapi.query('plugin::users-permissions.role').findOne({
        where: { type: 'public' },
      });

      if (publicRole) {
        const coreApis = [
          'api::hero.hero',
          'api::service.service',
          'api::about.about',
          'api::process.process',
          'api::faq.faq',
          'api::gallery.gallery',
          'api::article.article',
          'api::category.category',
          'api::author.author',
          'api::attendance-log.attendance-log',
          'api::personnel.personnel',
          'api::student.student',
          'api::educational-module.educational-module',
          'api::ram-report.ram-report',
          'api::bep-target.bep-target',
          'api::classroom.classroom',
          'api::session-plan.session-plan'
        ];

        for (const api of coreApis) {
          await strapi.query('plugin::users-permissions.permission').create({
            data: { action: `${api}.find`, role: publicRole.id },
          }).catch(() => { });

          await strapi.query('plugin::users-permissions.permission').create({
            data: { action: `${api}.findOne`, role: publicRole.id },
          }).catch(() => { });

          if (api === 'api::personnel.personnel' || api === 'api::session-plan.session-plan') {
            await strapi.query('plugin::users-permissions.permission').create({
              data: { action: `${api}.create`, role: publicRole.id },
            }).catch(() => { });
          }
        }
        console.log('[Permission Seeder] Public permissions configured.');
      }

      // 4. Data Seeder (Content)
      const now = new Date();

      // Hero (Single Type)
      const hero = await strapi.entityService.findMany('api::hero.hero');
      if (!hero) {
        await strapi.entityService.create('api::hero.hero', {
          data: {
            title: 'Geleceği Birlikte İnşa Ediyoruz',
            subtitle: 'Arkadaş Özel Eğitim ve Rehabilitasyon Merkezi',
            description: 'Uzman kadromuz ve modern eğitim yaklaşımlarımızla her çocuğun potansiyelini en üst düzeye çıkarmak için çalışıyoruz.',
            publishedAt: now,
            stats: [
              { value: '500+', label: 'Mezun Öğrenci' },
              { value: '25+', label: 'Uzman Eğitmen' },
              { value: '15+', label: 'Eğitim Programı' }
            ]
          }
        });
        console.log('[Data Seeder] Hero data created.');
      }

      // Services (Collection)
      const existingServices = await strapi.entityService.findMany('api::service.service');
      if (existingServices && Array.isArray(existingServices) && existingServices.length === 0) {
        const services = [
          { title: 'Dil ve Konuşma Terapisi', description: 'Bireylerin iletişim becerilerini geliştirmeye yönelik uzman terapi.', icon: 'speech', slug: 'dil-ve-konusma', publishedAt: now },
          { title: 'Zihinsel Engelliler Eğitimi', description: 'Bilişsel gelişimi destekleyen bireyselleştirilmiş eğitim programları.', icon: 'brain', slug: 'zihinsel-egitim', publishedAt: now },
          { title: 'Otizm Destek Eğitimi', description: 'Otizmli bireylerin sosyal ve akademik uyumunu artırmaya yönelik eğitim.', icon: '🧩', slug: 'otizm-destek', publishedAt: now }
        ];
        for (const s of services) {
          await strapi.entityService.create('api::service.service', { data: s });
        }
        console.log('[Data Seeder] Services created.');
      }

      // Processes (Collection)
      const existingProcesses = await strapi.entityService.findMany('api::process.process');
      if (existingProcesses && Array.isArray(existingProcesses) && existingProcesses.length === 0) {
        const processes = [
          { number: '01', title: 'Değerlendirme', description: 'Uzman ekibimiz tarafından ilk kaba değerlendirme yapılır.', icon: 'search', publishedAt: now },
          { number: '02', title: 'BEP Hazırlığı', description: 'Öğrencinin ihtiyaçlarına uygun Bireysel Eğitim Planı oluşturulur.', icon: 'clipboard-list', publishedAt: now },
          { number: '03', title: 'Eğitim Başlangıcı', description: 'Planlanan program dahilinde düzenli eğitimlere başlanır.', icon: '🚀', publishedAt: now }
        ];
        for (const p of processes) {
          await strapi.entityService.create('api::process.process', { data: p });
        }
        console.log('[Data Seeder] Processes created.');
      }

    } catch (error) {
      console.error('[Bootstrap] Error:', error);
    }
  },
};

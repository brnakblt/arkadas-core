'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { createStrapi } = require('@strapi/strapi');

async function findFile(strapi, name) {
  const files = await strapi.documents('plugin::upload.file').findMany({
    filters: {
      name: {
        $contains: name,
      },
    },
  });
  return files[0];
}

async function setPublicPermissions(strapi) {
  const publicRole = await strapi.db.query('plugin::users-permissions.role').findOne({
    where: { type: 'public' },
  });

  const permissions = [
    'api::hero.hero.find',
    'api::service.service.find',
    'api::service.service.findOne',
    'api::process.process.find',
    'api::process.process.findOne',
    'api::faq.faq.find',
    'api::faq.faq.findOne',
    'api::gallery.gallery.find',
    'api::gallery.gallery.findOne',
    'api::about.about.find',
    'api::about.about.findOne',
  ];

  for (const permission of permissions) {
    const existing = await strapi.db.query('plugin::users-permissions.permission').findOne({
      where: {
        action: permission,
        role: publicRole.id
      }
    });

    if (!existing) {
      await strapi.db.query('plugin::users-permissions.permission').create({
        data: {
          action: permission,
          role: publicRole.id,
        },
      });
    }
  }
  console.log('Public permissions set.');
}

async function seedAbout(strapi) {
  // Clear existing
  try {
    const existing = await strapi.documents('api::about.about').findMany();
    if (existing && !Array.isArray(existing)) {
      await strapi.documents('api::about.about').delete({ documentId: existing.documentId });
    } else if (Array.isArray(existing)) {
      for (const item of existing) {
        await strapi.documents('api::about.about').delete({ documentId: item.documentId });
      }
    }
  } catch (e) {
    // Ignore
  }

  await strapi.documents('api::about.about').create({
    data: {
      title: 'Hakkımızda',
      blocks: [
        {
          __component: 'shared.rich-text',
          body: `2009 yılından itibaren **İzmir'de** özel eğitim alanında öncü hizmetler sunan merkezimiz, özel gereksinimli çocukların eğitim ve rehabilitasyon süreçlerinde ailelerin en güvenilir yol arkadaşıdır. Uzman kadromuz ve her çocuğa özel hazırlanan **Bireyselleştirilmiş Eğitim Programlarımız (BEP)** ile her çocuğun içindeki gerçek potansiyeli ortaya çıkarmayı hedefliyoruz.

### Eğitim Modelimiz ve Yaklaşımımız

Eğitim modelimizde; bilimsel temelli eğitim yöntemleri, kanıta dayalı güncel rehabilitasyon teknikleri ve aile odaklı yaklaşımı bir araya getiriyoruz. Çocuklarımızın:

- Sosyal becerileri
- Akademik başarıları
- Günlük yaşam becerileri

üzerinde kalıcı gelişim sağlamayı amaçlıyoruz. Otizm, Disleksi, Down Sendromu ve fiziksel gelişim alanlarında gelişimsel takip ve profesyonel destekle, özel çocuklarımızın hayata tam katılımı için yanınızdayız.`
        }
      ],
      publishedAt: new Date(),
    },
    status: 'published',
  });
  console.log('About seeded.');
}

async function seedHero(strapi) {
  // Clear existing
  try {
    const existing = await strapi.documents('api::hero.hero').findMany();
    if (existing) {
      // v5 single types might return object or array depending on context, assuming array for safety or just delete if id exists
      if (Array.isArray(existing)) {
        for (const item of existing) {
          await strapi.documents('api::hero.hero').delete({ documentId: item.documentId });
        }
      } else if (existing.documentId) {
        await strapi.documents('api::hero.hero').delete({ documentId: existing.documentId });
      }
    }
  } catch (e) {
    // Ignore if not found
  }

  const images = [];
  for (let i = 1; i <= 6; i++) {
    const file = await findFile(strapi, `${i}.webp`);
    if (file) images.push(file.id); // v5 usually expects ID for relations in create
  }

  await strapi.documents('api::hero.hero').create({
    data: {
      title: 'Her Çocuk',
      subtitle: 'Özel ve Değerli',
      description: '2009’dan beri özel eğitim ve rehabilitasyon alanında uzman kadromuzla hizmet veriyoruz. Bilimsel temelli yöntemlerle özel gereksinimli çocukların sosyal ve akademik gelişimlerini destekliyoruz. Her çocuk için bireysel yaklaşım, aile odaklı çözüm!',
      images: images, // Pass IDs
      stats: [
        { value: '500+', label: 'Başarılı Öğrenci' },
        { value: '15+', label: 'Yıl Deneyim' },
        { value: '98%', label: 'Aile Memnuniyeti' },
        { value: '24/7', label: 'Destek Hattı' },
      ],
      publishedAt: new Date(),
    },
    status: 'published',
  });
  console.log('Hero seeded.');
}

async function seedServices(strapi) {
  // Clear existing
  const existing = await strapi.documents('api::service.service').findMany();
  for (const item of existing) {
    await strapi.documents('api::service.service').delete({ documentId: item.documentId });
  }

  const services = [
    {
      title: 'Dil ve Konuşma Terapisi',
      description: 'Dil ve konuşma bozuklukları olan çocuklar için bireysel terapi programları ve aile eğitimi.',
      icon: '💬',
      features: [
        { text: 'Artikülasyon Terapisi' },
        { text: 'Dil Gelişimi' },
        { text: 'Sosyal İletişim' },
        { text: 'Aile Danışmanlığı' },
      ],
    },
    {
      title: 'Özel Eğitim Programları',
      description: 'Özel gereksinimli çocuklar için bireysel eğitim planları ve akademik destek programları.',
      icon: '🧩',
      features: [
        { text: 'Bireysel Eğitim Planı' },
        { text: 'Akademik Beceriler' },
        { text: 'Sosyal Beceriler' },
        { text: 'Günlük Yaşam Becerileri' },
      ],
    },
    {
      title: 'Rehabilitasyon Hizmetleri',
      description: 'Fiziksel ve bilişsel rehabilitasyon programları ile çocukların gelişimini destekleme.',
      icon: '🤸',
      features: [
        { text: 'Fizyoterapi' },
        { text: 'Ergoterapisi' },
        { text: 'Bilişsel Rehabilitasyon' },
        { text: 'Oyun Terapisi' },
      ],
    },
  ];

  for (const service of services) {
    await strapi.documents('api::service.service').create({
      data: service,
      status: 'published',
    });
  }
  console.log('Services seeded.');
}

async function seedProcesses(strapi) {
  // Clear existing
  const existing = await strapi.documents('api::process.process').findMany();
  for (const item of existing) {
    await strapi.documents('api::process.process').delete({ documentId: item.documentId });
  }

  const processes = [
    { number: '01', title: 'İlk Görüşme', description: 'Çocuğunuzla tanışır ve ailenizle detaylı bir görüşme gerçekleştiririz.', icon: '👥' },
    { number: '02', title: 'Bireysel Eğitim Planı', description: 'Değerlendirme sonuçlarına göre çocuğunuza özel bireysel eğitim programı hazırlarız.', icon: '📋' },
    { number: '03', title: 'Eğitim Sürecinin Başlatılması', description: 'Uzman öğretmenlerimiz ve terapistlerimizle bireysel eğitim seanslarına başlarız.', icon: '🚀' },
    { number: '04', title: 'Aile Eğitimi ve Danışmanlık', description: 'Ailelere evde uygulayabilecekleri stratejiler ve destek programları sağlarız.', icon: '👨‍👩‍👧‍👦' },
    { number: '05', title: 'Düzenli Takip ve Değerlendirme', description: 'Çocuğunuzun gelişimini düzenli olarak takip eder, programı güncelleriz.', icon: '📈' },
    { number: '06', title: 'Sürekli Destek', description: 'Eğitim süreci boyunca ve sonrasında sürekli destek ve danışmanlık hizmeti veriyoruz.', icon: '🤝' },
  ];

  for (const process of processes) {
    await strapi.documents('api::process.process').create({
      data: process,
      status: 'published',
    });
  }
  console.log('Processes seeded.');
}

async function seedFAQs(strapi) {
  // Clear existing
  const existing = await strapi.documents('api::faq.faq').findMany();
  for (const item of existing) {
    await strapi.documents('api::faq.faq').delete({ documentId: item.documentId });
  }

  const faqs = [
    { question: 'Hangi yaş gruplarına hizmet veriyorsunuz?', answer: '0-18 yaş arası tüm çocuklara hizmet veriyoruz. Erken müdahale programlarından okul çağı destek eğitimlerine kadar geniş bir yaş yelpazesinde uzmanlaşmış hizmetler sunuyoruz.' },
    { question: 'Özel eğitim süreci nasıl başlıyor?', answer: 'İlk olarak ailemizle görüşme yapıyor, çocuğunuzun ihtiyaçlarını değerlendiriyoruz. Ardından kapsamlı bir değerlendirme süreci başlatıyor ve bireysel eğitim planı hazırlıyoruz. Tüm süreç ailenin aktif katılımıyla gerçekleşir.' },
    { question: 'Hangi alanlarda uzmanlaşmış hizmet veriyorsunuz?', answer: 'Dil ve konuşma terapisi, özel eğitim, fizyoterapi, ergoterapisi, oyun terapisi ve aile danışmanlığı alanlarında uzman kadromuzla hizmet veriyoruz. Her çocuğun bireysel ihtiyaçlarına uygun programlar hazırlıyoruz.' },
    { question: 'Eğitim seansları ne kadar sürer?', answer: 'Seansların süresi çocuğun yaşına, dikkat süresine ve ihtiyaçlarına göre belirlenir. Genellikle 30-45 dakika arasında değişir. Bireysel eğitim planında seansların sıklığı ve süresi detaylandırılır.' },
    { question: 'Ailelere nasıl destek sağlıyorsunuz?', answer: 'Aile eğitimi ve danışmanlık hizmetleri sunuyoruz. Evde uygulayabilecekleri stratejiler öğretiyoruz ve düzenli aile görüşmeleri yapıyoruz. Ailenin sürece aktif katılımını destekliyoruz.' },
    { question: 'Randevu nasıl alabilirim?', answer: 'Telefon, WhatsApp veya web sitemizden randevu alabilirsiniz. İlk görüşme ücretsizdir ve çocuğunuzun ihtiyaçlarını değerlendirmek için detaylı bir görüşme gerçekleştiririz.' },
  ];

  for (const faq of faqs) {
    await strapi.documents('api::faq.faq').create({
      data: faq,
      status: 'published',
    });
  }
  console.log('FAQs seeded.');
}

async function seedGallery(strapi) {
  // Clear existing
  const existing = await strapi.documents('api::gallery.gallery').findMany();
  for (const item of existing) {
    await strapi.documents('api::gallery.gallery').delete({ documentId: item.documentId });
  }

  const galleryItems = [
    { src: '1.webp', title: 'Bireysel Çalışmalar', category: 'Eğitim', alt: 'Arkadaş Özel Eğitim ve Rehabilitasyon Merkezi - Uzman eğitmenler ile bireysel çalışmalar' },
    { src: '2.webp', title: 'Özel Eğitim Sınıfları', category: 'Eğitim', alt: 'Arkadaş Özel Eğitim Merkezi - Modern özel eğitim sınıfları, çocuklar öğreniyor, destekleyici eğitim ortamı' },
    { src: '3.webp', title: 'Eğitici Aktiviteler', category: 'Sosyal Aktivite', alt: 'Arkadaş Özel Eğitim Merkezi - Eğitici aktiviteler, renkli öğrenme materyalleri, interaktif öğrenme' },
    { src: '4.webp', title: 'Bireysel Eğitim', category: 'Eğitim', alt: 'Arkadaş Özel Eğitim Merkezi - Bireyselleştirilmiş eğitim çalışmaları' },
    { src: '5.webp', title: 'Grup Çalışmaları', category: 'Sosyal Aktivite', alt: 'Arkadaş Özel Eğitim Merkezi - Grup çalışmaları, sosyal beceri geliştirme, çocuklar birlikte öğreniyor' },
    { src: '6.webp', title: 'Aile Danışmanlığı', category: 'Danışmanlık', alt: 'Arkadaş Özel Eğitim Merkezi - Aile danışmanlığı ve rehberlik hizmetleri' },
  ];

  for (const item of galleryItems) {
    const file = await findFile(strapi, item.src);
    if (file) {
      await strapi.documents('api::gallery.gallery').create({
        data: {
          title: item.title,
          category: item.category,
          alt: item.alt,
          image: file.id, // v5 ID
        },
        status: 'published',
      });
    }
  }
  console.log('Gallery seeded.');
}

async function main() {
  const app = await createStrapi({
    appDir: path.resolve(__dirname, '..'),
    distDir: path.resolve(__dirname, '../dist'),
  }).load();

  app.log.level = 'error';

  try {
    await setPublicPermissions(app);
    await seedAbout(app);
    await seedHero(app);
    await seedServices(app);
    await seedProcesses(app);
    await seedFAQs(app);
    await seedGallery(app);
    console.log('Seeding completed successfully.');
  } catch (error) {
    console.error('Seeding failed:', error);
  }

  await app.destroy();
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

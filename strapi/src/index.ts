import { seedErpRoles } from './bootstrap/seed-roles';
import { seedAdmin } from './bootstrap/seed-admin';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) { },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: any }) {
    // Seed Admin Users (Backend & Frontend)
    await seedAdmin(strapi);

    // Seed ERP roles
    await seedErpRoles(strapi);

    const publicRole = await strapi
      .db.query("plugin::users-permissions.role")
      .findOne({ where: { type: "public" } });

    if (!publicRole) {
      console.warn("Public role not found. Skipping permission bootstrap.");
      return;
    }

    const contentTypesToOpen = [
      "api::hero.hero",
      "api::service.service",
      "api::process.process",
      "api::faq.faq",
      "api::gallery.gallery",
      "api::team-member.team-member",
    ];

    for (const uid of contentTypesToOpen) {
      try {
        const permissions = await strapi
          .db.query("plugin::users-permissions.permission")
          .findMany({
            where: {
              role: publicRole.id,
              action: { $in: [`${uid}.find`, `${uid}.findOne`] },
            },
          });

        const existingActions = permissions.map((p: any) => p.action);
        const actionsToAdd = [`${uid}.find`, `${uid}.findOne`].filter(
          (action) => !existingActions.includes(action)
        );

        if (actionsToAdd.length > 0) {
          console.log(`Granting Public read access (missing: ${actionsToAdd.join(", ")}) to ${uid}...`);
          for (const action of actionsToAdd) {
            await strapi.db.query("plugin::users-permissions.permission").create({
              data: {
                role: publicRole.id,
                action: action,
              },
            });
          }
        }
      } catch (e: any) {
        console.error(`Error granting permissions for ${uid}: ${e.message}`);
      }
    }

    await seedData(strapi);
  },
};


async function seedData(strapi: any) {
  const contentTypes = {
    hero: "api::hero.hero",
    service: "api::service.service",
    process: "api::process.process",
    faq: "api::faq.faq",
    teamMember: "api::team-member.team-member",
    gallery: "api::gallery.gallery",
  };

  try {
    // Helper to find files
    const findFile = async (name: string) => {
      try {
        const files = await strapi.documents('plugin::upload.file').findMany({
          filters: {
            name: {
              $contains: name,
            },
          },
        });
        return files[0];
      } catch (e: any) {
        console.error(`Error finding file ${name}: ${e.message}`);
        return null;
      }
    };

    // Clean up function
    const clearData = async (uid: string) => {
      try {
        const items = await strapi.documents(uid).findMany();
        if (Array.isArray(items)) {
          for (const item of items) {
            await strapi.documents(uid).delete({ documentId: item.documentId });
          }
        } else if (items && items.documentId) { // Single type
          await strapi.documents(uid).delete({ documentId: items.documentId });
        }
      } catch (e: any) {
        console.error(`Error clearing data for ${uid}: ${e.message}`);
      }
    };

    // Check if we need to re-seed (if Hero exists and is English)
    let shouldReseed = false;
    try {
      const existingHero = await strapi.documents(contentTypes.hero).findFirst();
      shouldReseed = !existingHero || existingHero.title === "Empowering Your Future";
    } catch (e: any) {
      console.error(`Error checking hero: ${e.message}`);
      shouldReseed = true;
    }

    if (shouldReseed) {
      console.log("Detected missing or English content. Starting re-seed process...");

      // Seed Hero
      console.log("Seeding Hero data...");
      await clearData(contentTypes.hero);
      const heroImageIds = [];
      for (let i = 1; i <= 6; i++) {
        const file = await findFile(`${i}.webp`);
        if (file) heroImageIds.push(file.id);
      }

      try {
        await strapi.documents(contentTypes.hero).create({
          data: {
            title: 'Her Çocuk',
            subtitle: 'Özel ve Değerli',
            description: 'Özel eğitim ve rehabilitasyon alanında uzman kadromuzla, her çocuğun potansiyelini keşfetmesi ve gelişmesi için bireysel eğitim programları sunuyoruz.',
            images: heroImageIds,
            stats: [
              { value: '500+', label: 'Başarılı Öğrenci' },
              { value: '15+', label: 'Yıl Deneyim' },
              { value: '98%', label: 'Aile Memnuniyeti' },
              { value: '24/7', label: 'Destek Hattı' },
            ],
          },
          status: 'published',
        });
        console.log("Hero created");
      } catch (e: any) {
        console.error(`Hero create failed: ${e.message}`);
      }

      // Seed Services
      console.log("Seeding Services data...");
      await clearData(contentTypes.service);
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
        try {
          await strapi.documents(contentTypes.service).create({
            data: service,
            status: 'published',
          });
        } catch (e: any) { console.error(`Service create failed: ${e.message}`); }
      }

      // Seed Processes
      console.log("Seeding Processes data...");
      await clearData(contentTypes.process);
      const processes = [
        { number: '01', title: 'İlk Görüşme', description: 'Çocuğunuzla tanışır ve ailenizle detaylı bir görüşme gerçekleştiririz.', icon: '👥' },
        { number: '02', title: 'Bireysel Eğitim Planı', description: 'Değerlendirme sonuçlarına göre çocuğunuza özel bireysel eğitim programı hazırlarız.', icon: '📋' },
        { number: '03', title: 'Eğitim Sürecinin Başlatılması', description: 'Uzman öğretmenlerimiz ve terapistlerimizle bireysel eğitim seanslarına başlarız.', icon: '🚀' },
        { number: '04', title: 'Aile Eğitimi ve Danışmanlık', description: 'Ailelere evde uygulayabilecekleri stratejiler ve destek programları sağlarız.', icon: '👨‍👩‍👧‍👦' },
        { number: '05', title: 'Düzenli Takip ve Değerlendirme', description: 'Çocuğunuzun gelişimini düzenli olarak takip eder, programı güncelleriz.', icon: '📈' },
        { number: '06', title: 'Sürekli Destek', description: 'Eğitim süreci boyunca ve sonrasında sürekli destek ve danışmanlık hizmeti veriyoruz.', icon: '🤝' },
      ];
      for (const process of processes) {
        try {
          await strapi.documents(contentTypes.process).create({
            data: process,
            status: 'published',
          });
        } catch (e: any) { console.error(`Process create failed: ${e.message}`); }
      }

      // Seed FAQs
      console.log("Seeding FAQs data...");
      await clearData(contentTypes.faq);
      const faqs = [
        { question: 'Hangi yaş gruplarına hizmet veriyorsunuz?', answer: '0-18 yaş arası tüm çocuklara hizmet veriyoruz. Erken müdahale programlarından okul çağı destek eğitimlerine kadar geniş bir yaş yelpazesinde uzmanlaşmış hizmetler sunuyoruz.' },
        { question: 'Özel eğitim süreci nasıl başlıyor?', answer: 'İlk olarak ailemizle görüşme yapıyor, çocuğunuzun ihtiyaçlarını değerlendiriyoruz. Ardından kapsamlı bir değerlendirme süreci başlatıyor ve bireysel eğitim planı hazırlıyoruz. Tüm süreç ailenin aktif katılımıyla gerçekleşir.' },
        { question: 'Hangi alanlarda uzmanlaşmış hizmet veriyorsunuz?', answer: 'Dil ve konuşma terapisi, özel eğitim, fizyoterapi, ergoterapisi, oyun terapisi ve aile danışmanlığı alanlarında uzman kadromuzla hizmet veriyoruz. Her çocuğun bireysel ihtiyaçlarına uygun programlar hazırlıyoruz.' },
        { question: 'Eğitim seansları ne kadar sürer?', answer: 'Seansların süresi çocuğun yaşına, dikkat süresine ve ihtiyaçlarına göre belirlenir. Genellikle 30-45 dakika arasında değişir. Bireysel eğitim planında seansların sıklığı ve süresi detaylandırılır.' },
        { question: 'Ailelere nasıl destek sağlıyorsunuz?', answer: 'Aile eğitimi ve danışmanlık hizmetleri sunuyoruz. Evde uygulayabilecekleri stratejiler öğretiyoruz ve düzenli aile görüşmeleri yapıyoruz. Ailenin sürece aktif katılımını destekliyoruz.' },
        { question: 'Randevu nasıl alabilirim?', answer: 'Telefon, WhatsApp veya web sitemizden randevu alabilirsiniz. İlk görüşme ücretsizdir ve çocuğunuzun ihtiyaçlarını değerlendirmek için detaylı bir görüşme gerçekleştiririz.' },
      ];
      for (const faq of faqs) {
        try {
          await strapi.documents(contentTypes.faq).create({
            data: faq,
            status: 'published',
          });
        } catch (e: any) { console.error(`FAQ create failed: ${e.message}`); }
      }

      // Seed Gallery
      console.log("Seeding Gallery data...");
      await clearData(contentTypes.gallery);
      const galleryItems = [
        { src: '1.webp', title: 'Bireysel Çalışmalar', category: 'Eğitim', alt: 'Arkadaş Özel Eğitim ve Rehabilitasyon Merkezi - Uzman eğitmenler ile bireysel çalışmalar' },
        { src: '2.webp', title: 'Özel Eğitim Sınıfları', category: 'Eğitim', alt: 'Arkadaş Özel Eğitim Merkezi - Modern özel eğitim sınıfları, çocuklar öğreniyor, destekleyici eğitim ortamı' },
        { src: '3.webp', title: 'Eğitici Aktiviteler', category: 'Sosyal Aktivite', alt: 'Arkadaş Özel Eğitim Merkezi - Eğitici aktiviteler, renkli öğrenme materyalleri, interaktif öğrenme' },
        { src: '4.webp', title: 'Bireysel Eğitim', category: 'Eğitim', alt: 'Arkadaş Özel Eğitim Merkezi - Bireyselleştirilmiş eğitim çalışmaları' },
        { src: '5.webp', title: 'Grup Çalışmaları', category: 'Sosyal Aktivite', alt: 'Arkadaş Özel Eğitim Merkezi - Grup çalışmaları, sosyal beceri geliştirme, çocuklar birlikte öğreniyor' },
        { src: '6.webp', title: 'Aile Danışmanlığı', category: 'Danışmanlık', alt: 'Arkadaş Özel Eğitim Merkezi - Aile danışmanlığı ve rehberlik hizmetleri' },
      ];

      for (const item of galleryItems) {
        const file = await findFile(item.src);
        if (file) {
          try {
            await strapi.documents(contentTypes.gallery).create({
              data: {
                title: item.title,
                category: item.category,
                alt: item.alt,
                image: file.id,
              },
              status: 'published',
            });
          } catch (e: any) { console.error(`Gallery create failed: ${e.message}`); }
        }
      }

      console.log("Re-seeding completed.");
    }

  } catch (error: any) {
    console.error("Seeding failed:", error);
  }
}

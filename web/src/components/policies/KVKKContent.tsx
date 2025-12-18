import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShieldAlt, faUserLock, faFileContract } from "@fortawesome/free-solid-svg-icons";

const KVKKContent = () => {
    return (
        <div className="prose prose-lg prose-green max-w-none text-gray-600 space-y-8 font-body">
            <div className="flex items-center gap-4 mb-8">
                <div className="bg-secondary/10 p-4 rounded-2xl text-secondary">
                    <FontAwesomeIcon icon={faUserLock} className="w-8 h-8" />
                </div>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-neutral-dark m-0 leading-normal pb-1">
                    KVKK ve Aydınlatma Metni
                </h1>
            </div>

            <section>
                <p className="lead text-lg font-medium text-gray-700">
                    Arkadaş Özel Eğitim ve Rehabilitasyon Merkezi olarak, kişisel verilerinizin güvenliği
                    ve gizliliği konusunda azami hassasiyet göstermekteyiz. 6698 sayılı Kişisel Verilerin
                    Korunması Kanunu (&quot;KVKK&quot;) uyarınca, veri sorumlusu sıfatıyla, kişisel verilerinizi
                    aşağıda açıklanan kapsamda işlemekteyiz.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-neutral-dark mb-4 flex items-center gap-2">
                    <FontAwesomeIcon icon={faShieldAlt} className="w-5 h-5 text-primary" />
                    Hangi Verileri Topluyoruz?
                </h2>
                <p>
                    Hizmetlerimizi sunarken, web sitemiz, iletişim formlarımız veya doğrudan görüşmelerimiz
                    aracılığıyla aşağıdaki verileri toplayabiliriz:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li><strong>Kimlik Bilgileri:</strong> Ad, soyad, T.C. kimlik numarası (gerekli hallerde).</li>
                    <li><strong>İletişim Bilgileri:</strong> Telefon numarası, e-posta adresi, adres bilgileri.</li>
                    <li><strong>Talep ve Şikayet Bilgileri:</strong> İletişim formları aracılığıyla ilettiğiniz mesajlar.</li>
                    <li><strong>İşlem Güvenliği Bilgileri:</strong> IP adresi, site trafik verileri.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-neutral-dark mb-4">
                    Verilerinizi Hangi Amaçlarla İşliyoruz?
                </h2>
                <p>Topladığımız kişisel veriler, aşağıdaki amaçlarla işlenmektedir:</p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>Özel eğitim ve rehabilitasyon hizmetlerinin sunulması ve planlanması.</li>
                    <li>İletişim taleplerinizin yanıtlanması ve randevu süreçlerinin yönetilmesi.</li>
                    <li>Yasal yükümlülüklerin yerine getirilmesi (MEB ve diğer resmi kurumlarla iletişim).</li>
                    <li>Hizmet kalitemizin artırılması ve müşteri memnuniyetinin sağlanması.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-neutral-dark mb-4">
                    Verilerin Aktarılması
                </h2>
                <p>
                    Kişisel verileriniz, yasal zorunluluklar (resmi kurumlar) dışında ve açık rızanız
                    olmaksızın üçüncü kişilerle paylaşılmamaktadır.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-neutral-dark mb-4 border-b pb-2">
                    Yasal Mevzuat ve Kaynaklar
                </h2>
                <p className="mb-4">
                    Kişisel verilerin korunması ile ilgili detaylı bilgiye aşağıdaki resmi kaynaklardan ulaşabilirsiniz:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-primary font-medium">
                    <li>
                        <a href="https://www.mevzuat.gov.tr/MevzuatMetin/1.5.6698.pdf" target="_blank" rel="noopener noreferrer" className="hover:underline">
                            6698 Sayılı Kişisel Verilerin Korunması Kanunu (KVKK) - Resmi Gazete
                        </a>
                    </li>
                    <li>
                        <a href="https://www.kvkk.gov.tr" target="_blank" rel="noopener noreferrer" className="hover:underline">
                            Kişisel Verileri Koruma Kurumu (KVKK) Web Sitesi
                        </a>
                    </li>
                    <li>
                        <a href="https://www.ab.gov.tr/siteimages/resimler/Nihai-ABB-HCDB-GDPR.pdf" target="_blank" rel="noopener noreferrer" className="hover:underline">
                            Genel Veri Koruma Tüzüğü (GDPR) - Türkçe (AB Başkanlığı)
                        </a>
                    </li>
                </ul>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-neutral-dark mb-4 flex items-center gap-2">
                    <FontAwesomeIcon icon={faFileContract} className="w-5 h-5 text-accent" />
                    Haklarınız
                </h2>
                <p>
                    KVKK&apos;nın 11. maddesi uyarınca, veri sahibi olarak aşağıdaki haklara sahipsiniz:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme,</li>
                    <li>İşlenmişse buna ilişkin bilgi talep etme,</li>
                    <li>Amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
                    <li>Verilerin düzeltilmesini veya silinmesini talep etme.</li>
                </ul>
            </section>

            <section className="bg-gray-50 p-6 rounded-xl border border-gray-200 mt-8">
                <p className="text-sm">
                    Haklarınızı kullanmak için taleplerinizi yazılı olarak kurum adresimize iletebilir
                    veya <strong>info@arkadasozelegitim.com</strong> adresine e-posta gönderebilirsiniz.
                </p>
            </section>
        </div>
    );
};

export default KVKKContent;

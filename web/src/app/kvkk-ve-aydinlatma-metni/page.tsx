import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "KVKK ve Aydınlatma Metni | Arkadaş Özel Eğitim",
    description: "Kişisel Verilerin Korunması Kanunu kapsamında aydınlatma metni",
};

export default function KVKKPage() {
    return (
        <main className="min-h-screen bg-white dark:bg-gray-900 py-16 px-4">
            <div className="max-w-4xl mx-auto">
                <Link
                    href="/"
                    className="text-primary hover:underline mb-8 inline-block"
                >
                    ← Ana Sayfa
                </Link>

                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                    KVKK Aydınlatma Metni
                </h1>

                <div className="prose prose-lg dark:prose-invert max-w-none">
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        <strong>Son Güncelleme:</strong> 26 Aralık 2024
                    </p>

                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                        1. Veri Sorumlusu
                    </h2>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                        6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) kapsamında,
                        kişisel verileriniz; veri sorumlusu olarak Arkadaş Özel Eğitim ve
                        Rehabilitasyon Merkezi (&quot;Kurum&quot;) tarafından aşağıda açıklanan kapsamda
                        işlenebilecektir.
                    </p>

                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                        2. İşlenen Kişisel Veriler
                    </h2>
                    <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                        <li><strong>Kimlik Bilgileri:</strong> Ad, soyad, T.C. kimlik numarası, doğum tarihi</li>
                        <li><strong>İletişim Bilgileri:</strong> Telefon numarası, e-posta adresi, adres</li>
                        <li><strong>Eğitim Bilgileri:</strong> Öğrenci bilgileri, eğitim programı, devam durumu</li>
                        <li><strong>Sağlık Bilgileri:</strong> Engel türü, sağlık raporu, tedavi bilgileri</li>
                        <li><strong>Görsel Veriler:</strong> Fotoğraf, video kayıtları</li>
                        <li><strong>Biyometrik Veriler:</strong> Yüz tanıma verileri (BKDS kapsamında)</li>
                    </ul>

                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                        3. Veri İşleme Amaçları
                    </h2>
                    <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                        <li>Özel eğitim hizmetlerinin sunulması</li>
                        <li>Yasal yükümlülüklerin yerine getirilmesi (MEB mevzuatı)</li>
                        <li>İletişim ve bilgilendirme faaliyetleri</li>
                        <li>Servis takibi ve güvenlik</li>
                        <li>Fatura ve ödeme işlemleri</li>
                    </ul>

                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                        4. Veri Aktarımı
                    </h2>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                        Kişisel verileriniz, yasal zorunluluklar çerçevesinde aşağıdaki taraflara aktarılabilir:
                    </p>
                    <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                        <li>Milli Eğitim Bakanlığı (MEBBİS, RAM)</li>
                        <li>Sosyal Güvenlik Kurumu</li>
                        <li>Yetkili kamu kurum ve kuruluşları</li>
                    </ul>

                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                        5. Veri Saklama Süreleri
                    </h2>
                    <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                        <li>Kamera kayıtları: 150 gün</li>
                        <li>E-fatura kayıtları: 10 yıl</li>
                        <li>Öğrenci dosyaları: Mezuniyetten sonra 5 yıl</li>
                    </ul>

                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                        6. Haklarınız
                    </h2>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                        KVKK&apos;nın 11. maddesi kapsamında aşağıdaki haklara sahipsiniz:
                    </p>
                    <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                        <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                        <li>İşlenmişse buna ilişkin bilgi talep etme</li>
                        <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
                        <li>Yurtiçinde veya yurtdışında aktarıldığı üçüncü kişileri bilme</li>
                        <li>Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme</li>
                        <li>KVKK&apos;nın 7. maddesinde öngörülen şartlar çerçevesinde silinmesini isteme</li>
                    </ul>

                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                        7. İletişim
                    </h2>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                        KVKK kapsamındaki başvurularınız için:
                    </p>
                    <ul className="list-none text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                        <li><strong>E-posta:</strong> kvkk@arkadasozelegitim.com</li>
                        <li><strong>Telefon:</strong> (0212) 123 45 67</li>
                        <li><strong>Adres:</strong> [Kurum Adresi]</li>
                    </ul>
                </div>
            </div>
        </main>
    );
}

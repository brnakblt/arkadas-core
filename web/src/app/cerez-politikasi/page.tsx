import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Çerez Politikası | Arkadaş Özel Eğitim",
    description: "Web sitemizde kullanılan çerezler hakkında bilgilendirme",
};

export default function CookiePolicyPage() {
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
                    Çerez Politikası
                </h1>

                <div className="prose prose-lg dark:prose-invert max-w-none">
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        <strong>Son Güncelleme:</strong> 26 Aralık 2024
                    </p>

                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                        Çerez Nedir?
                    </h2>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                        Çerezler, web sitemizi ziyaret ettiğinizde cihazınıza (bilgisayar, tablet,
                        akıllı telefon) kaydedilen küçük metin dosyalarıdır. Bu dosyalar, web sitemizin
                        düzgün çalışması, kullanıcı deneyiminin iyileştirilmesi ve istatistiksel
                        verilerin toplanması amacıyla kullanılmaktadır.
                    </p>

                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                        Kullandığımız Çerez Türleri
                    </h2>

                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
                        1. Zorunlu Çerezler
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                        Web sitemizin temel işlevlerinin çalışması için gereklidir. Bu çerezler
                        olmadan site düzgün çalışmaz.
                    </p>
                    <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                        <li>Oturum yönetimi</li>
                        <li>Güvenlik doğrulama</li>
                        <li>Çerez tercih ayarları</li>
                    </ul>

                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
                        2. İşlevsel Çerezler
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                        Tercihlerinizi hatırlamak ve kişiselleştirilmiş deneyim sunmak için kullanılır.
                    </p>
                    <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                        <li>Dil tercihi</li>
                        <li>Tema tercihi (açık/koyu mod)</li>
                        <li>Erişilebilirlik ayarları</li>
                    </ul>

                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
                        3. Analitik Çerezler
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                        Web sitemizin nasıl kullanıldığını anlamamıza yardımcı olur.
                    </p>
                    <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                        <li>Sayfa görüntüleme sayısı</li>
                        <li>Ziyaretçi davranışları</li>
                        <li>Trafik kaynakları</li>
                    </ul>

                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                        Çerez Yönetimi
                    </h2>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                        Tarayıcı ayarlarınızdan çerezleri yönetebilir, silebilir veya engelleyebilirsiniz.
                        Ancak çerezleri engellemek, web sitemizin bazı özelliklerinin düzgün çalışmamasına
                        neden olabilir.
                    </p>

                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
                        Tarayıcı Ayarları
                    </h3>
                    <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                        <li><strong>Chrome:</strong> Ayarlar → Gizlilik ve güvenlik → Çerezler</li>
                        <li><strong>Firefox:</strong> Ayarlar → Gizlilik ve Güvenlik → Çerezler</li>
                        <li><strong>Safari:</strong> Tercihler → Gizlilik → Çerezler</li>
                        <li><strong>Edge:</strong> Ayarlar → Çerezler ve site izinleri</li>
                    </ul>

                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                        Saklama Süreleri
                    </h2>
                    <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 mb-6">
                        <thead>
                            <tr className="bg-gray-100 dark:bg-gray-800">
                                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-gray-900 dark:text-white">
                                    Çerez Türü
                                </th>
                                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-gray-900 dark:text-white">
                                    Süre
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-700 dark:text-gray-300">
                                    Oturum Çerezleri
                                </td>
                                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-700 dark:text-gray-300">
                                    Tarayıcı kapanana kadar
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-700 dark:text-gray-300">
                                    Tercih Çerezleri
                                </td>
                                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-700 dark:text-gray-300">
                                    1 yıl
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-700 dark:text-gray-300">
                                    Analitik Çerezleri
                                </td>
                                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-700 dark:text-gray-300">
                                    2 yıl
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                        İletişim
                    </h2>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                        Çerez politikamız hakkında sorularınız için:
                    </p>
                    <ul className="list-none text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                        <li><strong>E-posta:</strong> info@arkadasozelegitim.com</li>
                        <li><strong>Telefon:</strong> (0212) 123 45 67</li>
                    </ul>
                </div>
            </div>
        </main>
    );
}

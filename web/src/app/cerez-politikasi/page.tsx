import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Çerez Politikası | Arkadaş Özel Eğitim",
    description: "Web sitemizde kullanılan çerezler hakkında detaylı bilgilendirme",
};

export default function CookiePolicyPage() {
    return (
        <main className="min-h-screen bg-neutral-900/50 backdrop-blur-sm py-16 px-4">
            <div className="max-w-4xl mx-auto">
                <Link
                    href="/"
                    className="text-primary hover:underline mb-8 inline-block"
                >
                    ← Ana Sayfa
                </Link>

                <div className="prose prose-lg dark:prose-invert max-w-none">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="w-14 h-14 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center">
                            <span className="text-3xl">🍪</span>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white m-0">
                                Çerez Politikası
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1 m-0">
                                Gizliliğiniz ve güvenliğiniz bizim için önemlidir.
                            </p>
                        </div>
                    </div>

                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        <strong>Son Güncelleme:</strong> 26 Aralık 2024
                    </p>

                    {/* Çerez Nedir */}
                    <section className="mb-10">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-secondary/10 dark:bg-secondary/20 rounded-lg flex items-center justify-center text-secondary text-sm">ℹ️</span>
                            Çerez Nedir?
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Çerezler, ziyaret ettiğiniz web siteleri tarafından tarayıcınıza gönderilen
                            küçük metin dosyalarıdır. Sitenin tercihlerinizi hatırlamasına, oturumunuzu
                            açık tutmasına ve size daha iyi bir deneyim sunmasına yardımcı olur.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Çerezler aşağıdaki amaçlarla kullanılır:
                        </p>
                        <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                            <li>Güvenli ve hızlı bir deneyim sunmak için</li>
                            <li>Site performansını ölçmek ve iyileştirmek için</li>
                            <li>Tercihlerinizi hatırlayarak kolaylık sağlamak için</li>
                        </ul>
                    </section>

                    {/* Çerez Türleri */}
                    <section className="mb-10">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                            Kullandığımız Çerez Türleri
                        </h2>

                        <div className="grid gap-6 md:grid-cols-2 not-prose">
                            {/* Zorunlu */}
                            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                                        <span className="text-green-600 dark:text-green-400">✓</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">Zorunlu Çerezler</h3>
                                        <span className="text-xs bg-gray-800 dark:bg-gray-600 text-white px-2 py-0.5 rounded-full">Gerekli</span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Güvenlik, ağ yönetimi ve erişilebilirlik gibi temel işlevleri etkinleştirir.
                                    Bunları tarayıcı ayarlarından devre dışı bırakabilirsiniz ancak site düzgün çalışmayabilir.
                                </p>
                                <div className="mt-3 text-xs text-gray-500 dark:text-gray-500">
                                    <strong>Süre:</strong> Oturum süresi
                                </div>
                            </div>

                            {/* Fonksiyonel */}
                            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                        <span className="text-blue-600 dark:text-blue-400">⚙️</span>
                                    </div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">Fonksiyonel Çerezler</h3>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Dil, tema (açık/koyu mod) ve bölge gibi tercihlerinizi hatırlamamızı sağlar.
                                    Web sitesinin kişiselleştirilmiş bir deneyim sunmasına yardımcı olur.
                                </p>
                                <div className="mt-3 text-xs text-gray-500 dark:text-gray-500">
                                    <strong>Süre:</strong> 1 yıl
                                </div>
                            </div>

                            {/* Analitik */}
                            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                                        <span className="text-purple-600 dark:text-purple-400">📊</span>
                                    </div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">Performans ve Analiz</h3>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Ziyaretçilerin siteyle nasıl etkileşime girdiğini anonim olarak raporlayarak
                                    sitemizi geliştirmemize yardımcı olur. Site trafiğini analiz eder.
                                </p>
                                <div className="mt-3 text-xs text-gray-500 dark:text-gray-500">
                                    <strong>Süre:</strong> 2 yıl
                                </div>
                            </div>

                            {/* Pazarlama */}
                            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                                        <span className="text-orange-600 dark:text-orange-400">📢</span>
                                    </div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">Pazarlama Çerezleri</h3>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    İlgi alanlarınıza uygun içerik ve kampanyalar sunmamızı sağlar.
                                    Ziyaretçileri web siteleri genelinde takip etmek için kullanılır.
                                </p>
                                <div className="mt-3 text-xs text-gray-500 dark:text-gray-500">
                                    <strong>Süre:</strong> 2 yıl
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Çerez Yönetimi */}
                    <section className="mb-10">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                            Çerez Tercihlerinizi Nasıl Yönetirsiniz?
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Çerez tercihlerinizi her zaman değiştirebilirsiniz:
                        </p>
                        <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                            <li><strong>Sitemizden:</strong> Sayfanın altındaki çerez simgesine tıklayarak tercihlerinizi güncelleyebilirsiniz.</li>
                            <li><strong>Tarayıcınızdan:</strong> Tarayıcı ayarlarından tüm çerezleri silebilir veya engelleyebilirsiniz.</li>
                        </ul>

                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-3">
                            Tarayıcı Ayarları
                        </h3>
                        <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                            <li><strong>Chrome:</strong> Ayarlar → Gizlilik ve güvenlik → Çerezler</li>
                            <li><strong>Firefox:</strong> Ayarlar → Gizlilik ve Güvenlik → Çerezler</li>
                            <li><strong>Safari:</strong> Tercihler → Gizlilik → Çerezler</li>
                            <li><strong>Edge:</strong> Ayarlar → Çerezler ve site izinleri</li>
                        </ul>
                    </section>

                    {/* Onam Geri Çekme */}
                    <section className="mb-10">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                            Onayınızı Geri Çekme
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Daha önce verdiğiniz çerez onayını istediğiniz zaman geri çekebilirsiniz.
                            Bunun için:
                        </p>
                        <ol className="list-decimal pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                            <li>Sayfanın sol alt köşesindeki çerez simgesine tıklayın</li>
                            <li>&quot;Ayarlar&quot; butonuna basın</li>
                            <li>İstemediğiniz çerez kategorilerini kapatın</li>
                            <li>&quot;Seçimi Kaydet&quot; veya &quot;Reddet&quot; butonuna tıklayın</li>
                        </ol>
                    </section>

                    {/* Üçüncü Taraflar */}
                    <section className="mb-10">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
                            Üçüncü Taraf Çerezleri
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Sitemizde aşağıdaki üçüncü taraf hizmetlerinden çerezler kullanılabilir:
                        </p>
                        <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 mb-6 not-prose">
                            <thead>
                                <tr className="bg-gray-100 dark:bg-gray-800">
                                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-gray-900 dark:text-white">
                                        Hizmet
                                    </th>
                                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-gray-900 dark:text-white">
                                        Amaç
                                    </th>
                                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-gray-900 dark:text-white">
                                        Tür
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-700 dark:text-gray-300">
                                        Google Analytics
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-700 dark:text-gray-300">
                                        Site trafiği analizi
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-700 dark:text-gray-300">
                                        Analitik
                                    </td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-700 dark:text-gray-300">
                                        Google Maps
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-700 dark:text-gray-300">
                                        Konum haritası
                                    </td>
                                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-700 dark:text-gray-300">
                                        Fonksiyonel
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </section>

                    {/* Yasal Bilgilendirme */}
                    <section className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mt-0 mb-3">
                            Yasal Bilgilendirme
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm">
                            Bu politika, <a href="https://www.mevzuat.gov.tr/MevzuatMetin/1.5.6698.pdf" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">6698 Sayılı KVKK</a> ve
                            ilgili mevzuata uygun olarak hazırlanmıştır.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 text-sm">
                            Daha fazla bilgi veya sorularınız için:
                        </p>
                        <ul className="list-none text-gray-700 dark:text-gray-300 mt-2 space-y-1 text-sm">
                            <li><strong>E-posta:</strong> info@arkadasozelegitim.com</li>
                            <li><strong>Telefon:</strong> (0212) 123 45 67</li>
                        </ul>
                    </section>

                    {/* KVKK Link */}
                    <div className="mt-8 text-center">
                        <Link
                            href="/kvkk-ve-aydinlatma-metni"
                            className="text-primary hover:underline font-medium"
                        >
                            KVKK Aydınlatma Metnini İncele →
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}

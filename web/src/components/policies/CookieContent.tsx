import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCookieBite, faInfoCircle, faCheck, faSave, faThumbsUp, faBan } from "@fortawesome/free-solid-svg-icons";
import { useCookie } from "@/context/CookieContext";
import { usePolicyModal } from "@/context/PolicyModalContext";

const CookieContent = () => {
    const { preferences, togglePreference, acceptAll, rejectAll, savePreferences } = useCookie();
    const { closePolicyModal } = usePolicyModal();

    const handleSave = () => {
        savePreferences();
        closePolicyModal();
    };

    const handleAcceptAll = () => {
        acceptAll();
        closePolicyModal();
    };

    const handleRejectAll = () => {
        rejectAll();
        closePolicyModal();
    };

    return (
        <div className="prose prose-lg max-w-none text-gray-600 dark:text-gray-300 space-y-8 font-body pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8 border-b border-gray-100 pb-8">
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 p-6 rounded-3xl text-primary dark:text-primary-light shadow-sm ring-1 ring-primary/10 dark:ring-primary/20">
                    <FontAwesomeIcon icon={faCookieBite} className="w-10 h-10" />
                </div>
                <div>
                    <h1 className="text-3xl md:text-4xl font-display font-bold text-neutral-dark dark:text-white m-0 leading-tight">
                        Çerez Politikası
                    </h1>
                    <p className="text-lg text-gray-500 dark:text-gray-400 mt-2 m-0">
                        Gizliliğiniz ve güvenliğiniz bizim için önemlidir.
                    </p>
                </div>
            </div>

            {/* Cookie Settings Panel */}
            <div className="bg-white dark:bg-neutral-800 rounded-3xl border border-gray-200 dark:border-neutral-700 overflow-hidden shadow-lg shadow-gray-100/50 dark:shadow-none">
                <div className="p-6 md:p-8 bg-gray-50/50 dark:bg-neutral-800/50 border-b border-gray-100 dark:border-neutral-700">
                    <h3 className="text-xl font-bold text-neutral-dark dark:text-white flex items-center gap-3 m-0">
                        <span className="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary dark:text-primary-light text-sm">
                            <FontAwesomeIcon icon={faCookieBite} />
                        </span>
                        Çerez Tercihlerini Yönet
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 m-0">
                        Aşağıdaki panelden hangi çerezlerin kullanılacağına karar verebilirsiniz.
                    </p>
                </div>

                <div className="p-6 md:p-8 space-y-4">
                    {/* Necessary */}
                    <div className="flex items-start md:items-center justify-between p-5 bg-gray-50 dark:bg-neutral-900/50 rounded-2xl border border-gray-200 dark:border-neutral-700 opacity-80 cursor-not-allowed">
                        <div className="pr-4">
                            <div className="flex items-center gap-3 mb-1">
                                <span className="font-bold text-neutral-dark dark:text-gray-200">Zorunlu Çerezler</span>
                                <span className="text-[10px] uppercase tracking-wider font-bold bg-neutral-dark dark:bg-neutral-600 text-white px-2 py-0.5 rounded-full">Gerekli</span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 m-0">Sitenin temel fonksiyonları ve güvenliği için zorunludur. Kapatılamaz.</p>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0">
                            <FontAwesomeIcon icon={faCheck} className="w-3 h-3" />
                        </div>
                    </div>

                    {/* Functional */}
                    <div className={`flex items-start md:items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${preferences.functional ? 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600'}`}>
                        <div className="pr-4">
                            <div className="font-bold text-neutral-dark dark:text-gray-200 mb-1">Fonksiyonel Çerezler</div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 m-0">Dil ve bölge gibi tercihlerinizi hatırlamamızı sağlar.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                                type="checkbox"
                                checked={preferences.functional}
                                onChange={() => togglePreference('functional')}
                                className="sr-only peer"
                            />
                            <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-500 hover:after:scale-95"></div>
                        </label>
                    </div>

                    {/* Analytics */}
                    <div className={`flex items-start md:items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${preferences.analytics ? 'bg-purple-50/50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' : 'bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600'}`}>
                        <div className="pr-4">
                            <div className="font-bold text-neutral-dark dark:text-gray-200 mb-1">Performans ve Analiz</div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 m-0">Site trafiğini analiz ederek deneyiminizi iyileştirmemize yardımcı olur.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                                type="checkbox"
                                checked={preferences.analytics}
                                onChange={() => togglePreference('analytics')}
                                className="sr-only peer"
                            />
                            <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-500 hover:after:scale-95"></div>
                        </label>
                    </div>

                    {/* Marketing */}
                    <div className={`flex items-start md:items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${preferences.marketing ? 'bg-orange-50/50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' : 'bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600'}`}>
                        <div className="pr-4">
                            <div className="font-bold text-neutral-dark dark:text-gray-200 mb-1">Pazarlama</div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 m-0">İlgi alanlarınıza uygun içerik ve kampanyalar sunmamızı sağlar.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                                type="checkbox"
                                checked={preferences.marketing}
                                onChange={() => togglePreference('marketing')}
                                className="sr-only peer"
                            />
                            <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-500 hover:after:scale-95"></div>
                        </label>
                    </div>
                </div>

                {/* Actions Footer */}
                <div className="p-6 md:p-8 bg-gray-50 dark:bg-neutral-800/50 border-t border-gray-100 dark:border-neutral-700 flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={handleRejectAll}
                        className="flex-1 px-6 py-3.5 border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-neutral-800 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-700 hover:border-gray-400 dark:hover:border-neutral-500 font-bold transition-all text-sm flex items-center justify-center gap-2"
                    >
                        <FontAwesomeIcon icon={faBan} className="text-gray-400" />
                        Reddet
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-[2] px-6 py-3.5 bg-neutral-dark text-white rounded-xl hover:bg-black font-bold transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-gray-200"
                    >
                        <FontAwesomeIcon icon={faSave} />
                        Seçimi Kaydet
                    </button>
                    <button
                        onClick={handleAcceptAll}
                        className="flex-[2] px-6 py-3.5 bg-primary text-white rounded-xl hover:bg-primary/90 font-bold transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                    >
                        <FontAwesomeIcon icon={faThumbsUp} />
                        Tümünü Kabul Et
                    </button>
                </div>
            </div>

            {/* Info Sections Grid */}
            <div className="grid md:grid-cols-2 gap-8 pt-8">
                <section>
                    <h2 className="text-2xl font-bold text-neutral-dark dark:text-white mb-4 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-secondary/10 dark:bg-secondary/20 flex items-center justify-center text-secondary text-sm">
                            <FontAwesomeIcon icon={faInfoCircle} />
                        </span>
                        Çerez Nedir?
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                        Çerezler, ziyaret ettiğiniz web siteleri tarafından tarayıcınıza gönderilen
                        küçük metin dosyalarıdır. Sitenin tercihlerinizi hatırlamasına, oturumunuzu
                        açık tutmasına ve size daha iyi bir deneyim sunmasına yardımcı olur.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-neutral-dark dark:text-white mb-4 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary text-sm">
                            <FontAwesomeIcon icon={faCheck} />
                        </span>
                        Neden Kullanıyoruz?
                    </h2>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                        <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2"></span>
                            Güvenli ve hızlı bir deneyim sunmak için.
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2"></span>
                            Site performansını ölçmek ve iyileştirmek için.
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2"></span>
                            Tercihlerinizi hatırlayarak kolaylık sağlamak için.
                        </li>
                    </ul>
                </section>
            </div>

            {/* Cookie Types */}
            <section className="pt-8">
                <h2 className="text-2xl font-bold text-neutral-dark dark:text-white mb-6">Detaylı Çerez Bilgileri</h2>
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl border border-gray-100 dark:border-neutral-700 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-neutral-700 flex items-center justify-center text-gray-600 dark:text-gray-300 mb-4">
                            <FontAwesomeIcon icon={faCheck} />
                        </div>
                        <h3 className="font-bold text-lg text-neutral-dark dark:text-white mb-2">Zorunlu</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 m-0">
                            Güvenlik, ağ yönetimi ve erişilebilirlik gibi temel işlevleri etkinleştirir.
                            Bunları tarayıcı ayarlarından devre dışı bırakabilirsiniz ancak site düzgün çalışmayabilir.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl border border-gray-100 dark:border-neutral-700 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-500 mb-4">
                            <FontAwesomeIcon icon={faInfoCircle} />
                        </div>
                        <h3 className="font-bold text-lg text-neutral-dark dark:text-white mb-2">Analitik</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 m-0">
                            Ziyaretçilerin siteyle nasıl etkileşime girdiğini anonim olarak raporlayarak
                            sitemizi geliştirmemize yardımcı olur.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl border border-gray-100 dark:border-neutral-700 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-500 mb-4">
                            <FontAwesomeIcon icon={faCookieBite} />
                        </div>
                        <h3 className="font-bold text-lg text-neutral-dark dark:text-white mb-2">Pazarlama</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 m-0">
                            Ziyaretçileri web siteleri genelinde takip etmek için kullanılır.
                            Amaç, bireysel kullanıcı için alakalı ve ilgi çekici reklamlar göstermektir.
                        </p>
                    </div>
                </div>
            </section>

            {/* Legal Footer */}
            <div className="mt-8 p-6 bg-gray-50 dark:bg-neutral-900/50 rounded-2xl border border-gray-100 dark:border-neutral-700 text-sm text-gray-500 dark:text-gray-400">
                <h3 className="font-bold text-neutral-dark dark:text-white mb-2">Yasal Bilgilendirme</h3>
                <p>
                    Bu politika, <a href="https://www.mevzuat.gov.tr/MevzuatMetin/1.5.6698.pdf" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-light font-medium hover:underline">6698 Sayılı KVKK</a> ve
                    ilgili mevzuata uygun olarak hazırlanmıştır. Daha fazla bilgi veya sorularınız için
                    <a href="mailto:info@arkadasozelegitim.com" className="text-neutral-dark dark:text-white font-medium hover:underline ml-1">info@arkadasozelegitim.com</a> adresinden bize ulaşabilirsiniz.
                </p>
            </div>
        </div>
    );
};

export default CookieContent;
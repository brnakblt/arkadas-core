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
        <div className="prose prose-lg prose-green max-w-none text-gray-600 space-y-8 font-body pb-20">
            {/* Header Section */}
            <div className="flex items-center gap-4 mb-4">
                <div className="bg-primary/10 p-4 rounded-2xl text-primary">
                    <FontAwesomeIcon icon={faCookieBite} className="w-8 h-8" />
                </div>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-neutral-dark m-0 leading-normal pb-1">
                    Çerez Politikası
                </h1>
            </div>

            {/* Cookie Settings Panel */}
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-xl font-bold text-neutral-dark mb-6 flex items-center gap-2">
                    <FontAwesomeIcon icon={faCookieBite} className="text-primary w-5 h-5" />
                    Çerez Tercihlerinizi Yönetin
                </h3>

                <div className="space-y-4">
                    {/* Necessary */}
                    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-neutral-dark">Zorunlu Çerezler</span>
                                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Gerekli</span>
                            </div>
                            <p className="text-xs text-gray-500">Sitenin çalışması için zorunludur.</p>
                        </div>
                        <FontAwesomeIcon icon={faCheck} className="text-gray-300" />
                    </div>

                    {/* Functional */}
                    <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${preferences.functional ? 'bg-primary/5 border-primary/30' : 'bg-white border-gray-200'}`}>
                        <div>
                            <div className="font-bold text-neutral-dark mb-1">Fonksiyonel Çerezler</div>
                            <p className="text-xs text-gray-500">Tercihlerinizi hatırlamamızı sağlar.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={preferences.functional}
                                onChange={() => togglePreference('functional')}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>

                    {/* Analytics */}
                    <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${preferences.analytics ? 'bg-primary/5 border-primary/30' : 'bg-white border-gray-200'}`}>
                        <div>
                            <div className="font-bold text-neutral-dark mb-1">Performans ve Analiz</div>
                            <p className="text-xs text-gray-500">Site trafiğini analiz etmemize yarar.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={preferences.analytics}
                                onChange={() => togglePreference('analytics')}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>

                    {/* Marketing */}
                    <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${preferences.marketing ? 'bg-primary/5 border-primary/30' : 'bg-white border-gray-200'}`}>
                        <div>
                            <div className="font-bold text-neutral-dark mb-1">Pazarlama</div>
                            <p className="text-xs text-gray-500">Size özel içerikler sunmamızı sağlar.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={preferences.marketing}
                                onChange={() => togglePreference('marketing')}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
                    <button
                        onClick={handleRejectAll}
                        className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all text-sm"
                    >
                        <FontAwesomeIcon icon={faBan} />
                        Sadece Zorunlu
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-neutral-dark text-white rounded-xl hover:bg-black font-medium transition-all text-sm"
                    >
                        <FontAwesomeIcon icon={faSave} />
                        Seçilenleri Kaydet
                    </button>
                    <button
                        onClick={handleAcceptAll}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 font-medium transition-all text-sm shadow-lg shadow-primary/20"
                    >
                        <FontAwesomeIcon icon={faThumbsUp} />
                        Tümünü Kabul Et
                    </button>
                </div>
            </div>

            <section>
                <h2 className="text-2xl font-bold text-neutral-dark mb-4 flex items-center gap-2">
                    <FontAwesomeIcon icon={faInfoCircle} className="w-5 h-5 text-secondary" />
                    Çerez (Cookie) Nedir?
                </h2>
                <p>
                    Çerezler, bir web sitesini ziyaret ettiğinizde cihazınızda (bilgisayar, telefon
                    veya tablet) depolanan ve sonraki ziyaretlerinizde bu bilgilerin okunmasını
                    sağlayan küçük veri dosyalarıdır. Çerezler, web sitesinin daha verimli çalışmasını,
                    tercihlerinizin hatırlanmasını ve site trafiğinin analiz edilmesini sağlar.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-neutral-dark mb-4">
                    Çerezleri Neden ve Nasıl Kullanıyoruz?
                </h2>
                <p>
                    Arkadaş Özel Eğitim ve Rehabilitasyon Merkezi olarak çerezleri şu amaçlarla kullanıyoruz:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>Web sitemizin temel fonksiyonlarının çalışmasını sağlamak (Oturum açma, güvenlik vb.).</li>
                    <li>Ziyaretçi tercihlerini hatırlayarak kullanım kolaylığı sunmak.</li>
                    <li>Site trafiğini ve performansını analiz ederek hizmetlerimizi geliştirmek.</li>
                    <li>Size özel kişiselleştirilmiş içerik ve deneyimler sunmak.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-neutral-dark mb-4">
                    Kullandığımız Çerez Türleri
                </h2>
                <div className="grid gap-6">
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                        <h3 className="font-bold text-lg text-primary mb-2">Zorunlu Çerezler</h3>
                        <p className="text-sm">
                            Web sitesinin düzgün çalışması için gereklidir. Bu çerezler olmadan sitenin
                            bazı bölümleri kullanılamaz. (Örn: Güvenlik ayarları, erişilebilirlik tercihleri).
                        </p>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                        <h3 className="font-bold text-lg text-secondary mb-2">Performans ve Analiz Çerezleri</h3>
                        <p className="text-sm">
                            Sitemizin nasıl kullanıldığını anlamamıza yardımcı olur. Ziyaretçi sayısı,
                            en çok gezilen sayfalar gibi verileri anonim olarak toplar.
                        </p>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                        <h3 className="font-bold text-lg text-accent mb-2">Fonksiyonel Çerezler</h3>
                        <p className="text-sm">
                            Dil tercihi, yazı boyutu gibi kişisel ayarlarınızı hatırlamamızı sağlar.
                        </p>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-neutral-dark mb-4">
                    Çerez Tercihlerini Yönetme
                </h2>
                <p>
                    Web sitemizi kullanırken çerez tercihlerinizi dilediğiniz zaman değiştirebilirsiniz.
                    Zorunlu çerezler dışındaki tüm çerezleri "Çerez Ayarları" butonunu kullanarak
                    kapatabilirsiniz. Ayrıca tarayıcı ayarlarınızdan da çerezleri silebilir veya
                    engelleyebilirsiniz.
                </p>
                <div className="mt-6 p-4 bg-gray-100 rounded-xl">
                    <h3 className="font-bold text-neutral-dark mb-2">İlgili Mevzuat</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                        <li>
                            Çerez uygulamalarımız, <a href="https://www.mevzuat.gov.tr/MevzuatMetin/1.5.6698.pdf" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">6698 Sayılı KVKK</a> ve Avrupa Birliği <a href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32002L0058" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">e-Privacy Direktifi</a> ile uyumlu olarak yürütülmektedir.
                        </li>
                    </ul>
                </div>
            </section>

            <section className="bg-primary/5 p-8 rounded-2xl border border-primary/10 mt-8">
                <h2 className="text-xl font-bold text-neutral-dark mb-4">
                    Bize Ulaşın
                </h2>
                <p className="mb-4">
                    Çerez politikamız veya kişisel verilerinizin işlenmesi hakkında sorularınız için
                    bizimle iletişime geçebilirsiniz.
                </p>
                <div className="text-sm text-gray-500">
                    <p><strong>Kurum:</strong> Arkadaş Özel Eğitim ve Rehabilitasyon Merkezi</p>
                    <p><strong>E-posta:</strong> info@arkadasozelegitim.com</p>
                </div>
            </section>
        </div>
    );
};

export default CookieContent;

import { Settings, Clock, Mail } from 'lucide-react';

export default function MaintenancePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-center relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-indigo-50 rounded-full blur-2xl opacity-50"></div>
                <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-blue-50 rounded-full blur-2xl opacity-50"></div>

                <div className="relative z-10">
                    <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                        <Settings className="w-12 h-12 text-indigo-600 animate-spin-slow" />
                    </div>

                    <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
                        Bakım Modu
                    </h1>

                    <p className="text-xl text-gray-600 mb-8">
                        Şu anda sistem üzerinde iyileştirme çalışmaları yapıyoruz.
                        Arkadaş Özel Eğitim ERP sistemi kısa bir süre sonra tekrar yayında olacak.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mb-8">
                        <div className="bg-indigo-50 p-4 rounded-xl flex items-center gap-3 text-left">
                            <Clock className="w-8 h-8 text-indigo-500" />
                            <div>
                                <h3 className="font-semibold text-gray-900">Tahmini Süre</h3>
                                <p className="text-sm text-gray-600">Yaklaşık 1 saat içinde döneceğiz.</p>
                            </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-xl flex items-center gap-3 text-left">
                            <Mail className="w-8 h-8 text-blue-500" />
                            <div>
                                <h3 className="font-semibold text-gray-900">İletişim</h3>
                                <p className="text-sm text-gray-600">Acil durumlar için: info@arkadas.com</p>
                            </div>
                        </div>
                    </div>

                    <div className="text-sm text-gray-400">
                        Sabrınız için teşekkür ederiz.
                    </div>
                </div>
            </div>
        </div>
    );
}

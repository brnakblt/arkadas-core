'use client';

import Link from 'next/link';

interface FooterLink {
    label: string;
    href: string;
}

interface FooterSection {
    title: string;
    links: FooterLink[];
}

const FOOTER_SECTIONS: FooterSection[] = [
    {
        title: 'Hizmetlerimiz',
        links: [
            { label: 'Özel Eğitim', href: '/hizmetler#ozel-egitim' },
            { label: 'Dil ve Konuşma Terapisi', href: '/hizmetler#dil-konusma' },
            { label: 'Fizyoterapi', href: '/hizmetler#fizyoterapi' },
            { label: 'Oyun Terapisi', href: '/hizmetler#oyun-terapisi' },
            { label: 'Aile Danışmanlığı', href: '/hizmetler#aile-danismanligi' },
        ],
    },
    {
        title: 'Kurumsal',
        links: [
            { label: 'Hakkımızda', href: '/hakkimizda' },
            { label: 'Ekibimiz', href: '/ekibimiz' },
            { label: 'Galeri', href: '/galeri' },
            { label: 'Kariyer', href: '/kariyer' },
            { label: 'Blog', href: '/blog' },
        ],
    },
    {
        title: 'Veliler İçin',
        links: [
            { label: 'Veli Portalı', href: '/portal' },
            { label: 'Servis Takip', href: '/servis-takip' },
            { label: 'Yoklama', href: '/yoklama' },
            { label: 'Program', href: '/program' },
            { label: 'SSS', href: '/sss' },
        ],
    },
    {
        title: 'İletişim',
        links: [
            { label: 'İletişim Formu', href: '/iletisim' },
            { label: 'Randevu Al', href: '/randevu' },
            { label: 'Konum', href: '/konum' },
            { label: 'WhatsApp', href: 'https://wa.me/905551234567' },
        ],
    },
];

const SOCIAL_LINKS = [
    { icon: '📘', label: 'Facebook', href: 'https://facebook.com' },
    { icon: '📸', label: 'Instagram', href: 'https://instagram.com' },
    { icon: '🐦', label: 'Twitter', href: 'https://twitter.com' },
    { icon: '▶️', label: 'YouTube', href: 'https://youtube.com' },
    { icon: '💼', label: 'LinkedIn', href: 'https://linkedin.com' },
];

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-white">
            {/* Main Footer */}
            <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12">
                    {/* Brand Section */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl">
                                🎓
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Arkadaş</h3>
                                <p className="text-sm text-gray-400">Özel Eğitim ve Rehabilitasyon</p>
                            </div>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed mb-6">
                            Her çocuğun özel ve değerli olduğuna inanıyoruz. 15 yılı aşkın deneyimimizle,
                            özel gereksinimli çocuklarımızın potansiyellerini keşfetmelerine yardımcı oluyoruz.
                        </p>

                        {/* Social Links */}
                        <div className="flex gap-3">
                            {SOCIAL_LINKS.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors"
                                    aria-label={social.label}
                                >
                                    {social.icon}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Footer Sections */}
                    {FOOTER_SECTIONS.map((section) => (
                        <div key={section.title}>
                            <h4 className="font-semibold text-white mb-4">{section.title}</h4>
                            <ul className="space-y-3">
                                {section.links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-gray-400 hover:text-white transition-colors text-sm"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            {/* Contact Bar */}
            <div className="border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">📍</span>
                            <div>
                                <p className="text-sm text-gray-400">Adres</p>
                                <p className="text-gray-300">Örnek Mahallesi, Eğitim Cad. No:123, İstanbul</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">📞</span>
                            <div>
                                <p className="text-sm text-gray-400">Telefon</p>
                                <a href="tel:+902121234567" className="text-gray-300 hover:text-white">
                                    (0212) 123 45 67
                                </a>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">✉️</span>
                            <div>
                                <p className="text-sm text-gray-400">E-posta</p>
                                <a href="mailto:info@arkadas.edu.tr" className="text-gray-300 hover:text-white">
                                    info@arkadas.edu.tr
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-800 bg-gray-950">
                <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-gray-500 text-sm">
                            © {currentYear} Arkadaş Özel Eğitim ve Rehabilitasyon Merkezi. Tüm hakları saklıdır.
                        </p>
                        <div className="flex gap-6 text-sm">
                            <Link href="/gizlilik" className="text-gray-500 hover:text-gray-300">
                                Gizlilik Politikası
                            </Link>
                            <Link href="/kullanim-kosullari" className="text-gray-500 hover:text-gray-300">
                                Kullanım Koşulları
                            </Link>
                            <Link href="/kvkk" className="text-gray-500 hover:text-gray-300">
                                KVKK
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

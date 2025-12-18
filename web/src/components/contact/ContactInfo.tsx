import React from "react";
import SocialLinks from "./SocialLinks";

const ContactInfo: React.FC = () => {
    return (
        <div className="flex justify-center">
            <div className="bg-white dark:bg-neutral-800 rounded-3xl p-8 w-full max-w-5xl shadow-xl dark:shadow-none transition-colors duration-300">
                <h3 className="font-display text-2xl font-bold text-neutral-dark dark:text-white mb-6 leading-normal pb-1">
                    İletişim Bilgileri
                </h3>
                <div className="space-y-6 mb-8">
                    <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                            <svg
                                className="w-6 h-6 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h4 className="font-body font-semibold text-neutral-dark dark:text-white mb-1">
                                E-posta
                            </h4>
                            <p className="font-body text-neutral-dark/80 dark:text-white/80">
                                cigliarkadasozelegitim@gmail.com
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                            <svg
                                className="w-6 h-6 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h4 className="font-body font-semibold text-neutral-dark dark:text-white mb-1">
                                Telefon
                            </h4>
                            <p className="font-body text-neutral-dark/80 dark:text-white/80">+90 506 810 33 21</p>
                        </div>
                    </div>

                    <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                            <svg
                                className="w-6 h-6 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h4 className="font-body font-semibold text-neutral-dark dark:text-white mb-1">
                                Adres
                            </h4>
                            <p className="font-body text-neutral-dark/80 dark:text-white/80">
                                Maltepe Mahallesi 8108. Sk. No:9
                                <br />
                                35600 Çiğli/İzmir
                                <br />
                            </p>
                        </div>
                    </div>
                </div>

                <SocialLinks />

                {/* Google Maps iframe - Responsive */}
                <div className="mt-8">
                    <div className="rounded-2xl overflow-hidden shadow-lg relative w-full aspect-video sm:aspect-[4/3] lg:aspect-[16/9]">
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d38532.36818884902!2d27.103783262601926!3d38.4843215025564!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14bbd0a8c91f1c0b%3A0xaa627e94f9f1781d!2s%C3%96zel%20Arkada%C5%9F%20%C3%96zel%20E%C4%9Fitim%20ve%20Rehabilitasyon%20Merkezi!5e0!3m2!1str!2str!4v1764150415003!5m2!1str!2str"
                            className="absolute inset-0 w-full h-full"
                            style={{ border: 0 }}
                            allowFullScreen={true}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Özel Arkadaş Özel Eğitim Merkezi Konum"
                        />
                    </div>

                    {/* Short link to open in Maps app or full Google Maps */}
                    <div className="mt-3 text-right">
                        <a
                            href="https://maps.app.goo.gl/zuUQwm7RvJ14sc2Z9"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block text-sm font-semibold text-neutral-dark/90 dark:text-white/90 hover:text-primary dark:hover:text-white hover:underline transition-colors"
                            aria-label="Haritayı uygulamada aç"
                        >
                            📍 Haritayı uygulamada aç
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactInfo;


import { constructBEPPrompt, BEP_SYSTEM_INSTRUCTION } from '@/lib/bepPrompts';
import { describe, it, expect } from 'vitest';

describe('BEP Prompt Construction', () => {
    it('should contain the correct system instruction keywords', () => {
        expect(BEP_SYSTEM_INSTRUCTION).toContain("Milli Eğitim Bakanlığı");
        expect(BEP_SYSTEM_INSTRUCTION).toContain("SMART");
        expect(BEP_SYSTEM_INSTRUCTION).toContain("JSON");
    });

    it('should include few-shot examples in the system instruction', () => {
        expect(BEP_SYSTEM_INSTRUCTION).toContain("Örnek 1:");
        expect(BEP_SYSTEM_INSTRUCTION).toContain("Yanlış Hedef:");
        expect(BEP_SYSTEM_INSTRUCTION).toContain("Doğru Hedef:");
    });

    it('should correctly construct the user prompt with student data', () => {
        const studentData = {
            name: "Ali Veli",
            age: 8,
            diagnosis: "Otizm Spektrum Bozukluğu",
            performanceLevel: "Okuma yazma bilmiyor. Harfleri tanıyor.",
            strengths: ["Görsel hafızası güçlü", "Müzik seviyor"],
            needs: ["Göz teması kurma", "Yönerge takip etme"]
        };

        const prompt = constructBEPPrompt(studentData);

        expect(prompt).toContain("Adı Soyadı: Ali Veli");
        expect(prompt).toContain("Yaş: 8");
        expect(prompt).toContain("Tanı: Otizm Spektrum Bozukluğu");
        expect(prompt).toContain("Okuma yazma bilmiyor");
        expect(prompt).toContain("Görsel hafızası güçlü");
        expect(prompt).toContain("Göz teması kurma");
    });
});

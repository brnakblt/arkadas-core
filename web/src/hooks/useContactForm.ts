import { useState } from "react";

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  message: string;
}

export interface ContactFormErrors {
  name: string;
  email: string;
  phone: string;
  address: string;
  message: string;
}

export interface ContactFormTouched {
  name: boolean;
  email: boolean;
  phone: boolean;
  address: boolean;
  message: boolean;
}

export const useContactForm = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    phone: "",
    address: "",
    message: "",
  });

  const [errors, setErrors] = useState<ContactFormErrors>({
    name: "",
    email: "",
    phone: "",
    address: "",
    message: "",
  });

  const [touched, setTouched] = useState<ContactFormTouched>({
    name: false,
    email: false,
    phone: false,
    address: false,
    message: false,
  });

  const [kvkkApproved, setKvkkApproved] = useState(false);
  const [kvkkError, setKvkkError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";

  const validateField = (name: string, value: string) => {
    switch (name) {
      case "name":
        return value.trim() === "" ? "Ad Soyad alanı zorunludur" : "";
      case "email":
        return value.trim() === ""
          ? "E-posta alanı zorunludur"
          : !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)
            ? "Geçerli bir e-posta adresi giriniz"
            : "";
      case "phone":
        return value.trim() === ""
          ? "Telefon numarası zorunludur"
          : !/^[+]?[0-9\s()-]+$/.test(value)
            ? "Geçerli bir telefon numarası giriniz"
            : "";
      case "address":
        return value.trim() === "" ? "Lütfen bir adres giriniz" : "";
      case "message":
        return value.trim() === "" ? "Mesaj alanı zorunludur" : "";
      default:
        return "";
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Handle textarea auto-resize
    if (e.target instanceof HTMLTextAreaElement) {
      e.target.style.height = "auto";
      e.target.style.height = `${e.target.scrollHeight}px`;
    }

    // Clear error when the user starts typing in a field
    if (value.trim() !== "") {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    } else if (touched[name as keyof typeof touched]) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateField(name, value),
      }));
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
    const error = validateField(name, e.target.value);
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));

    if (error) {
      setTimeout(() => {
        setErrors((prev) => ({
          ...prev,
          [name]: "",
        }));
      }, 5000);
    }
  };

  const submitForm = async () => {
    if (!kvkkApproved) {
      setKvkkError(
        "Kişisel verilerin işlenmesi hakkında bilgilendirmeyi okuyup onaylamanız gerekmektedir."
      );
      return false;
    }

    const newErrors = {
      name: validateField("name", formData.name),
      email: validateField("email", formData.email),
      phone: validateField("phone", formData.phone),
      address: validateField("address", formData.address),
      message: validateField("message", formData.message),
    };

    setErrors(newErrors);
    setTouched({
      name: true,
      email: true,
      phone: true,
      address: true,
      message: true,
    });

    if (Object.values(newErrors).every((error) => error === "")) {
      try {
        setIsSubmitting(true);
        const response = await fetch(`${STRAPI_URL}/api/contact-messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ data: formData }),
        });

        if (!response.ok) {
          throw new Error("Bir hata oluştu");
        }

        setFormData({
          name: "",
          email: "",
          phone: "",
          address: "",
          message: "",
        });
        setTouched({
          name: false,
          email: false,
          phone: false,
          address: false,
          message: false,
        });
        setKvkkApproved(false);
        return true;
      } catch (error) {
        console.error("Submission error:", error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    }
    return false;
  };

  return {
    formData,
    errors,
    touched,
    kvkkApproved,
    setKvkkApproved,
    kvkkError,
    setKvkkError,
    isSubmitting,
    handleChange,
    handleBlur,
    submitForm,
  };
};

import { createFileRoute } from "@tanstack/react-router";

import { SubHeader } from "@/components/vanta/sub-header";
import { useCenterToast } from "@/components/vanta/center-toast";
import { useSettings } from "@/lib/vanta";
import supportImage from "@/assets/oil-support.jpg";

export const Route = createFileRoute("/_authenticated/customer-service")({
  head: () => ({
    meta: [
      { title: "Customer Service — Vanta Oil" },
      { name: "description", content: "Contact Vanta Oil support on WhatsApp: online 9:00 AM to 7:00 PM every day." },
      { property: "og:title", content: "Customer Service — Vanta Oil" },
      { property: "og:description", content: "Contact Vanta Oil support on WhatsApp: online 9:00 AM to 7:00 PM every day." },
    ],
  }),
  component: CustomerServicePage,
});

function waLink(number: string) {
  const digits = number.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : "";
}

function CustomerServicePage() {
  const settings = useSettings();
  const { showPillToast } = useCenterToast();

  const channels = [
    { label: settings.support_whatsapp || "WhatsApp Service", href: waLink(settings.support_whatsapp) },
    { label: settings.support_whatsapp_2 || "WhatsApp Service 2", href: waLink(settings.support_whatsapp_2) },
    { label: "Official WhatsApp Group", href: settings.group_link?.trim() ?? "" },
  ];

  return (
    <div className="slide-in min-h-dvh bg-surface">
      <SubHeader title="Customer Service" />

      <img
        src={supportImage}
        alt="Vanta Oil customer service agents assisting a client"
        width={1280}
        height={720}
        className="h-56 w-full object-cover"
      />

      <div className="px-5 py-6">
        <h2 className="text-[26px] font-semibold">Online time: 9:00 AM-7:00 PM</h2>
        <p className="mt-4 text-[16px] text-link">Click to jump to the official WhatsApp channel</p>

        <div className="mt-4 rounded-2xl border border-border p-3">
          <p className="px-2 py-1 text-[19px]">WhatsApp</p>
          <div className="mt-1">
            {channels.map((c) => (
              <button
                key={c.label}
                type="button"
                onClick={() => {
                  if (!c.href) {
                    showPillToast("Support channel is coming soon");
                    return;
                  }
                  window.open(c.href, "_blank", "noopener,noreferrer");
                }}
                className="press flex w-full items-center justify-between border-b border-border/70 bg-secondary/60 px-3 py-4 text-left text-[16px] last:border-b-0"
              >
                <span>{c.label}</span>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m9 5 7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        <p className="mt-6 text-[17px] font-semibold">TIPS:</p>
        <p className="mt-2 text-[16px] leading-[1.6] text-foreground/85">
          1. If you have any questions, please feel free to contact our online customer service. We
          are happy to assist you.
          <br />
          2. Please keep your password safe and never disclose it to others. Official staff will
          never ask you for your password.
        </p>
      </div>
    </div>
  );
}

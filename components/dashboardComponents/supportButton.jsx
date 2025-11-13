import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Headset, Phone, Mail, MessageCircle, X, Copy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

function copyToClipboard(text) {
  if (!navigator?.clipboard) return;
  navigator.clipboard.writeText(text);
}

export default function SupportButton() {
  const [isOpen, setIsOpen] = useState(false);

  const contactOptions = [
    {
      id: "phone",
      icon: Phone,
      title: "Call Support",
      description: "Speak with our support representative now",
      value: "09045058791",
      action: "tel:09045058791",
      color: "from-indigo-500 to-blue-500",
      accent: "indigo"
    },
    {
      id: "whatsapp",
      icon: MessageCircle,
      title: "WhatsApp",
      description: "Chat with us instantly on WhatsApp",
      value: "Chat on WhatsApp",
      action: "https://wa.me/9045058791",
      color: "from-green-500 to-emerald-500",
      accent: "green"
    },
    {
      id: "email",
      icon: Mail,
      title: "Email",
      description: "Send us an email and we’ll reply fast",
      value: "darllixhq@gmail.com",
      action: "mailto:darllixhq@gmail.com",
      color: "from-cyan-500 to-sky-500",
      accent: "cyan"
    }
  ];

  return (
    <>
      {/* Floating Support Button */}
      <Button
        onClick={() => setIsOpen(true)}
        aria-label="Open support"
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-2xl transform-gpu z-50
                   bg-gradient-to-br from-indigo-600 to-blue-500 text-white flex items-center justify-center
                   ring-0 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-200"
        size="icon"
      >
        <Headset className="w-10 h-10" />
      </Button>

      {/* Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className="
            max-w-screen h-full w-full p-0 m-0 border-0 rounded-none flex flex-col
            bg-white backdrop-blur-sm"
        >
          {/* overlay + container */}
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setIsOpen(false)} />

          <div
            className="
              relative z-50 mx-auto h-full  w-full max-w-6xl
              md:my-20 rounded-2xl overflow-hidden
              shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            {/* header */}
            <div className="flex items-center justify-between p-6 bg-gradient-to-tr from-white/70 to-white/60 backdrop-blur-sm border-b">
              <div>
                <DialogHeader>
                  <DialogTitle className="text-3xl md:text-4xl font-extrabold text-slate-900">
                    How can we help you?
                  </DialogTitle>
                  <p className="mt-2 text-sm text-slate-600">Choose any option to reach our support team</p>
                </DialogHeader>
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 rounded-full hover:bg-muted"
            >
              <X className="h-6 w-6" />
             </Button>
              </div>

              
            </div>

            {/* body */}
            <div className="p-6 md:p-8 bg-gradient-to-b from-white/60 to-white/50">
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {contactOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <Card
                      key={option.id}
                      className="
                        relative group overflow-hidden rounded-2xl border
                        bg-white/80 backdrop-blur-sm
                        hover:shadow-[0_10px_30px_rgba(10,10,50,0.12)]
                        transition-transform transform will-change-transform
                        hover:-translate-y-2"
                    >
                      {/* top accent */}
                      <div className={`h-2 bg-gradient-to-r ${option.color}`} />

                      <CardContent className="p-6 flex flex-col items-start gap-4">
                        {/* icon + title */}
                        <div className="flex items-center gap-4 w-full">
                          <div
                            className={`
                              inline-flex items-center justify-center h-14 w-14 rounded-lg
                              bg-gradient-to-br ${option.color} shadow-md
                              text-white flex-none`}
                          >
                            <Icon className="w-6 h-6" />
                          </div>

                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-slate-900">{option.title}</h3>
                            <p className="text-sm text-slate-600 mt-1">{option.description}</p>
                          </div>
                        </div>

                        {/* value and actions */}
                        <div className="w-full flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-slate-800">{option.value}</div>
                            <div className="text-xs text-slate-500 mt-1">Reliable, secure, fast</div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(option.action, "_blank");
                              }}
                              size="sm"
                              className="bg-color4 text-color3 hover:text-white border px-3 py-2 shadow-sm hover:shadow-md hover:scale-[1.02] transition"
                            >
                              Open
                            </Button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const toCopy = option.id === "phone" ? "09045058791" : option.id === "email" ? "darllixhq@gmail.com" : option.action;
                                copyToClipboard(toCopy);
                              }}
                              aria-label={`Copy ${option.title}`}
                              className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-slate-50 border hover:bg-slate-100 transition"
                            >
                              <Copy className="w-4 h-4 text-slate-700" />
                            </button>
                          </div>
                        </div>

                        {/* subtle footer */}
                        <div className="w-full pt-2 border-t mt-2 text-xs text-slate-500 flex items-center justify-between">
                          <span>Available 24/7</span>
                          <span className="capitalize">{option.id}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* small footer with support note */}
              <div className="mt-6 text-center text-sm text-slate-600">
                <span>If you need immediate help, call the phone option for fastest response</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

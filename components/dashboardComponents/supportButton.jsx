"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Headset, Phone, Mail, MessageCircle, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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
      color: "from-indigo-500 to-blue-500"
    },
    {
      id: "whatsapp",
      icon: MessageCircle,
      title: "WhatsApp",
      description: "Chat with us instantly on WhatsApp",
      value: "Chat on WhatsApp",
      action: "https://wa.me/+2349045058791",
      color: "from-green-500 to-emerald-500"
    },
    {
      id: "email",
      icon: Mail,
      title: "Email",
      description: "Send us an email and we’ll reply fast",
      value: "darllixhq@gmail.com",
      action: "mailto:darllixhq@gmail.com",
      color: "from-cyan-500 to-sky-500"
    }
  ];

  function openAction(action) {
    if (action.startsWith("tel:") || action.startsWith("mailto:")) {
      window.location.href = action;
    } else {
      window.open(action, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <>
      {/* Floating Support Button */}
      <Button
        onClick={() => setIsOpen(true)}
        aria-label="Open support"
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-2xl z-50
                   bg-gradient-to-br from-indigo-600 to-blue-500 text-white flex items-center justify-center
                   hover:scale-105 transition"
        size="icon"
      >
        <Headset className="w-6 h-6" />
      </Button>

      {/* Fullscreen Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="p-0 m-0 border-0 rounded-none w-screen h-screen max-w-none overflow-hidden bg-white">
          
          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-slate-900">
                How can we help you?
              </DialogTitle>
              <p className="text-sm text-slate-600">Choose an option to reach our support team</p>
            </DialogHeader>
            </div>

          {/* Body content */}
          <div className="p-6 overflow-y-auto h-[calc(100vh-80px)]">
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {contactOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <Card
                    key={option.id}
                    className="rounded-2xl overflow-hidden bg-white/90 border hover:shadow-lg hover:-translate-y-1 transition"
                  >
                    <div className={`h-2 bg-gradient-to-r ${option.color}`} />

                    <CardContent className="p-6 flex flex-col gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${option.color} flex items-center justify-center text-white`}>
                          <Icon className="w-5 h-5" />
                        </div>

                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-900">{option.title}</h3>
                          <p className="text-sm text-slate-600 mt-1">{option.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{option.value}</p>
                          <p className="text-xs text-slate-500 mt-1">Available 24/7</p>
                        </div>

                        <Button
                          onClick={() => openAction(option.action)}
                          size="sm"
                          className="bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-2"
                        >
                          Open
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="text-center mt-6 text-sm text-slate-600">
              If you need immediate help, call the phone option for fastest response
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
